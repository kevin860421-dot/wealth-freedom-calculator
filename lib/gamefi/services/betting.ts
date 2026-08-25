import { getPrisma, type PrismaTx } from "@/lib/db/client";
import { GameFiNotImplementedError, GameFiServiceError } from "@/lib/gamefi/services/errors";

export type PlaceBetResult = {
  userId: string;
  matchId: string;
  amount: number;
  betId: string | null;
};

/**
 * 下注（Phase 2 預留）。
 * 架構：單一 transaction 內鎖定錢包 → 扣款 + ledger → 建立 bet 紀錄。
 */
export async function placeBet(
  userId: string,
  matchId: string,
  amount: number,
): Promise<PlaceBetResult> {
  if (!userId?.trim()) {
    throw new GameFiServiceError("userId 不可為空");
  }
  if (!matchId?.trim()) {
    throw new GameFiServiceError("matchId 不可為空");
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new GameFiServiceError("amount 必須為正數");
  }

  try {
    return await getPrisma().$transaction(async (tx: PrismaTx) => {
      const wallet = await tx.userWallet.findUnique({
        where: { userId },
      });

      if (!wallet) {
        throw new GameFiServiceError("找不到用戶錢包");
      }

      if (wallet.gems < amount) {
        throw new GameFiServiceError("寶石餘額不足");
      }

      // Phase 2：match 驗證、BET_PLACE ledger、betting 表寫入
      void matchId;
      void tx;
      throw new GameFiNotImplementedError("placeBet");
    });
  } catch (error) {
    if (error instanceof GameFiServiceError) throw error;
    throw new GameFiServiceError(
      error instanceof Error ? error.message : "placeBet 交易失敗",
    );
  }
}
