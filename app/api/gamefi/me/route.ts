import { NextResponse } from "next/server";
import { AuthRequiredError, requireUser } from "@/lib/auth/require-user";

export const dynamic = "force-dynamic";

/** 取得登入用戶與錢包；新用戶自動 provision（1000 gems + INITIAL_GRANT ledger） */
export async function GET() {
  try {
    const { user, wallet } = await requireUser();

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        authProvider: user.authProvider,
      },
      wallet: {
        id: wallet.id,
        gems: wallet.gems,
        status: wallet.status,
      },
    });
  } catch (error) {
    if (error instanceof AuthRequiredError) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    console.error("[api/gamefi/me]", error);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
