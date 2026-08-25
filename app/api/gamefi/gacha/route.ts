import { NextResponse } from "next/server";
import { AuthRequiredError, requireUser } from "@/lib/auth/require-user";
import { enrichCardView } from "@/lib/gamefi/cards/catalog";
import {
  listUserCards,
  summonGachaCard,
  sumCardAttack,
} from "@/lib/gamefi/services/gacha";
import { GameFiServiceError } from "@/lib/gamefi/services/errors";

export const dynamic = "force-dynamic";

function serializeCard(card: Awaited<ReturnType<typeof summonGachaCard>>["card"]) {
  return enrichCardView(card);
}

/** 免費召喚抽卡（操作累積觸發） */
export async function POST() {
  try {
    const { user } = await requireUser();
    const result = await summonGachaCard(user.id);

    return NextResponse.json({
      success: true,
      leveledUp: result.leveledUp,
      card: serializeCard(result.card),
    });
  } catch (error) {
    if (error instanceof AuthRequiredError) {
      return NextResponse.json(
        { success: false, error: "unauthorized" },
        { status: 401 },
      );
    }
    if (error instanceof GameFiServiceError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 },
      );
    }
    console.error("[api/gamefi/gacha]", error);
    return NextResponse.json(
      { success: false, error: "internal_error" },
      { status: 500 },
    );
  }
}

/** 查詢卡包與總攻擊力 */
export async function GET() {
  try {
    const { user } = await requireUser();
    const cards = await listUserCards(user.id);

    return NextResponse.json({
      success: true,
      totalAttack: sumCardAttack(cards),
      cards: cards.map(serializeCard),
    });
  } catch (error) {
    if (error instanceof AuthRequiredError) {
      return NextResponse.json(
        { success: false, error: "unauthorized" },
        { status: 401 },
      );
    }
    console.error("[api/gamefi/gacha GET]", error);
    return NextResponse.json(
      { success: false, error: "internal_error" },
      { status: 500 },
    );
  }
}
