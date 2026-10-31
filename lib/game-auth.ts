import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getCurrentParticipant } from "@/lib/games";
import { prisma } from "@/lib/prisma";

export const ADMIN_COOKIE = "ashraya_game_admin";

export class GameError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}

export function checkOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const url = new URL(request.url);
  const hostOrigin = `${url.protocol}//${request.headers.get("host")}`;
  if ((origin && origin !== url.origin && origin !== hostOrigin) || request.headers.get("sec-fetch-site") === "cross-site") {
    throw new GameError("Cross-site request rejected", 403);
  }
}

function signature(value: string) {
  const secret = process.env.GAME_ADMIN_COOKIE_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!secret || secret.length < 32) throw new GameError("Admin session secret is not configured", 503);
  return createHmac("sha256", secret).update(value).digest("hex");
}

export function constantEqual(left: string, right: string) {
  const leftHash = createHmac("sha256", "game-pin-compare").update(left).digest();
  const rightHash = createHmac("sha256", "game-pin-compare").update(right).digest();
  return timingSafeEqual(leftHash, rightHash);
}

export function hasAdminSession(alias: string) {
  const value = cookies().get(ADMIN_COOKIE)?.value;
  if (!value) return false;
  const [signedAlias, expires, mac, extra] = value.split(".");
  if (extra || signedAlias !== alias || !Number.isFinite(Number(expires)) || Number(expires) < Date.now()) return false;
  return constantEqual(mac ?? "", signature(`${signedAlias}.${expires}`));
}

export function setAdminSession(response: NextResponse, alias: string) {
  const value = `${alias}.${Date.now() + 12 * 60 * 60 * 1000}`;
  response.cookies.set(ADMIN_COOKIE, `${value}.${signature(value)}`, {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: 12 * 60 * 60,
  });
}

export async function requirePlayer() {
  const player = await getCurrentParticipant();
  if (!player) throw new GameError("Please sign in first", 401);
  return player;
}

export async function requireGameAdmin() {
  const player = await requirePlayer();
  if (!player.isAdmin || !hasAdminSession(player.alias)) throw new GameError("Admin flag and PIN session required", 403);
  return player;
}

export async function gameCommand(eventId: string, actor: string, action: string, payload: object) {
  if (action.startsWith("admin.participant.")) {
    const rows = await prisma.$queryRaw<{ result: Record<string, unknown> }[]>`
      SELECT game_participant_command(${eventId}, ${actor}, ${action}, ${JSON.stringify(payload)}::jsonb) AS result`;
    return rows[0].result;
  }
  const rows = await prisma.$queryRaw<{ result: Record<string, unknown> }[]>`
    SELECT game_day_command(${eventId}, ${actor}, ${action}, ${JSON.stringify(payload)}::jsonb) AS result`;
  return rows[0].result;
}

export function gameResponse(value: unknown, status = 200) {
  return NextResponse.json(value, { status, headers: { "Cache-Control": "private, no-store" } });
}

export async function gameRoute(run: () => Promise<Response>) {
  try { return await run(); } catch (error) {
    if (error instanceof GameError) return gameResponse({ error: error.message }, error.status);
    if (error instanceof ZodError) return gameResponse({ error: error.issues[0]?.message ?? "Invalid request" }, 400);
    const databaseError = error as { code?: string; meta?: { code?: string; message?: string } };
    if (databaseError.code === "P2002" || databaseError.meta?.code === "23505") return gameResponse({ error: "That name or entry already exists" }, 409);
    if (databaseError.meta?.code === "P0001") return gameResponse({ error: databaseError.meta.message?.replace(/^ERROR: /, "").split("\n")[0] ?? "Action rejected" }, 409);
    console.error("game_request_failed", { code: databaseError.code ?? "unknown" });
    return gameResponse({ error: "Reconnecting... Your action was not confirmed. Please retry." }, 503);
  }
}