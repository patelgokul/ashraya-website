import { NextRequest, NextResponse } from "next/server";
import { adminActionSchema } from "@/lib/validations/game-day";
import { GameError, checkOrigin, gameCommand, gameRoute, requireGameAdmin } from "@/lib/game-auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: { eventId: string } }) {
  return gameRoute(async () => {
    checkOrigin(req);
    const admin = await requireGameAdmin();
    const action = adminActionSchema.parse({ ...await req.json(), action: "admin.score.award" });
    if (action.action !== "admin.score.award" || (!action.alias && !action.teamId)) throw new GameError("Choose a player or team");
    return NextResponse.json(await gameCommand(params.eventId, admin.alias, action.action, action));
  });
}
