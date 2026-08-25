import { NextResponse } from "next/server";
import { AuthRequiredError, requireUser } from "@/lib/auth/require-user";
import { enrichCardView } from "@/lib/gamefi/cards/catalog";
import { listUserCards, sumCardAttack } from "@/lib/gamefi/services/gacha";

export const dynamic = "force-dynamic";

/** 卡包查詢 */
export async function GET() {
  try {
    const { user } = await requireUser();
    const cards = await listUserCards(user.id);

    return NextResponse.json({
      success: true,
      totalAttack: sumCardAttack(cards),
      cards: cards.map(enrichCardView),
    });
  } catch (error) {
    if (error instanceof AuthRequiredError) {
      return NextResponse.json(
        { success: false, error: "unauthorized" },
        { status: 401 },
      );
    }
    console.error("[api/gamefi/cards]", error);
    return NextResponse.json(
      { success: false, error: "internal_error" },
      { status: 500 },
    );
  }
}
