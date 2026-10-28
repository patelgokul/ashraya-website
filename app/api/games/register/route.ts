import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { GameRegisterSchema } from "@/lib/validations/game";
import { createDeviceToken, getCurrentParticipant, hashToken, setDeviceCookie } from "@/lib/games";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const existing = await getCurrentParticipant();
  if (existing) {
    return NextResponse.json({ id: existing.id, name: existing.name });
  }

  const body = await req.json().catch(() => null);
  const result = GameRegisterSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
  }

  const token = createDeviceToken();
  const participant = await prisma.gameParticipant.create({
    data: {
      name: result.data.name,
      alias: result.data.alias,
      phone: result.data.phone,
      tokenHash: hashToken(token),
    },
    select: { id: true, name: true },
  });

  const res = NextResponse.json(participant, { status: 201 });
  setDeviceCookie(res, token);
  return res;
}
