import { NextResponse } from "next/server";
import { AuthRequiredError, requireUser } from "@/lib/auth/require-user";
import { getPrisma } from "@/lib/db/client";

export const dynamic = "force-dynamic";

const LEDGER_LIMIT = 10;

/** 錢包餘額 + 最近 10 筆流水（requireUser 含自動 provision） */
export async function GET() {
  try {
    const { user, wallet } = await requireUser();
    const prisma = getPrisma();

    const ledgerRows = await prisma.walletLedger.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: LEDGER_LIMIT,
      select: {
        id: true,
        actionType: true,
        gemChange: true,
        balanceAfter: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      balance: wallet.gems,
      ledger: ledgerRows.map((row) => ({
        id: row.id,
        type: row.actionType,
        amount: row.gemChange,
        balance_after: row.balanceAfter,
        created_at: row.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    if (error instanceof AuthRequiredError) {
      return NextResponse.json(
        { success: false, error: "unauthorized" },
        { status: 401 },
      );
    }
    console.error("[api/gamefi/wallet]", error);
    return NextResponse.json(
      { success: false, error: "internal_error" },
      { status: 500 },
    );
  }
}
