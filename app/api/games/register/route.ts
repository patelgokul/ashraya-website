import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { GameRegisterSchema, NAME_REQUIRED_MESSAGE } from "@/lib/validations/game";
import { clearAliasCookie, setAliasCookie } from "@/lib/games";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const result = GameRegisterSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
  }

  const { alias, name, phone } = result.data;
  const existing = await prisma.gameParticipant.findUnique({ where: { alias }, select: { alias: true, name: true } });
  if (existing) {
    const res = NextResponse.json(existing);
    setAliasCookie(res, existing.alias);
    return res;
  }

  if (!name) {
    return NextResponse.json(
      { error: { formErrors: [], fieldErrors: { name: [NAME_REQUIRED_MESSAGE] } } },
      { status: 400 }
    );
  }

  const participant = await prisma.gameParticipant.upsert({
    where: { alias },
    update: {},
    create: { alias, name, phone },
    select: { alias: true, name: true },
  });

  const res = NextResponse.json(participant, { status: 201 });
  setAliasCookie(res, participant.alias);
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ success: true });
  clearAliasCookie(res);
  return res;
}
