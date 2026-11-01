import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { GameLoginSchema } from "@/lib/validations/game";
import { setAliasCookie } from "@/lib/games";
import { ADMIN_COOKIE, checkOrigin, gameRoute } from "@/lib/game-auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  return gameRoute(async () => {
    checkOrigin(req);
    const body = await req.json().catch(() => null);
    const result = GameLoginSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
    }

    const participant = await prisma.gameParticipant.findUnique({
      where: { alias: result.data.alias },
      select: { alias: true, name: true },
    });
    if (!participant) {
      return NextResponse.json(
        { error: "This alias is not registered.", code: "NOT_REGISTERED" },
        { status: 404 },
      );
    }

    const res = NextResponse.json(participant);
    res.cookies.delete(ADMIN_COOKIE);
    setAliasCookie(res, participant.alias);
    return res;
  });
}
