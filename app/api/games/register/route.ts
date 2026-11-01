import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { GameRegisterSchema } from "@/lib/validations/game";
import { clearAliasCookie, setAliasCookie } from "@/lib/games";
import { ADMIN_COOKIE, checkOrigin, gameRoute } from "@/lib/game-auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  return gameRoute(async () => {
  checkOrigin(req);
  const body = await req.json().catch(() => null);
  const result = GameRegisterSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
  }

  const { alias, name, phone } = result.data;
  const existing = await prisma.gameParticipant.findUnique({ where: { alias }, select: { alias: true } });
  if (existing) {
    return NextResponse.json(
      { error: "This alias is already registered. Log in instead.", code: "ALREADY_REGISTERED" },
      { status: 409 },
    );
  }

  // A plain insert: Neon's HTTP connection on Workers can't run upsert's transaction.
  const participant = await prisma.gameParticipant
    .create({ data: { alias, name, phone }, select: { alias: true, name: true } })
    .catch((error: unknown) => {
      if ((error as { code?: string }).code === "P2002") return null;
      throw error;
    });
  if (!participant) {
    return NextResponse.json(
      { error: "This alias is already registered. Log in instead.", code: "ALREADY_REGISTERED" },
      { status: 409 },
    );
  }

  const res = NextResponse.json(participant, { status: 201 });
  res.cookies.delete(ADMIN_COOKIE);
  setAliasCookie(res, participant.alias);
  return res;
  });
}

export async function DELETE(req: NextRequest) {
  return gameRoute(async () => {
  checkOrigin(req);
  const res = NextResponse.json({ success: true });
  clearAliasCookie(res);
  res.cookies.delete(ADMIN_COOKIE);
  return res;
  });
}
