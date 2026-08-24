/**
 * GameFi E2E：provisionUserWithWallet 於真實 DB 連線下驗證（transaction rollback，不留測試髒資料）。
 *
 * 執行：npm run test:gamefi
 */
import { randomUUID } from "node:crypto";
import type { User as SupabaseAuthUser } from "@supabase/supabase-js";
import { getPrisma } from "@/lib/db/client";
import {
  INITIAL_WALLET_GEMS,
  provisionUserWithWallet,
} from "@/lib/gamefi/wallet-service";

class RollbackForTest extends Error {
  constructor() {
    super("ROLLBACK_FOR_TEST");
    this.name = "RollbackForTest";
  }
}

function createMockAuthUser(): SupabaseAuthUser {
  const id = randomUUID();
  return {
    id,
    aud: "authenticated",
    role: "authenticated",
    email: `gamefi-e2e-${Date.now()}@verify.local`,
    phone: "",
    confirmation_sent_at: undefined,
    confirmed_at: new Date().toISOString(),
    last_sign_in_at: undefined,
    app_metadata: { provider: "email" },
    user_metadata: { full_name: "GameFi E2E Verify" },
    identities: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_anonymous: false,
  };
}

async function assertProvisionGrantsInitialGems(): Promise<void> {
  const prisma = getPrisma();
  const mockAuthUser = createMockAuthUser();

  try {
    await prisma.$transaction(async (tx) => {
      const { user, wallet } = await provisionUserWithWallet(mockAuthUser, tx);

      if (user.authSubjectId !== mockAuthUser.id) {
        throw new Error(`authSubjectId 不符：${user.authSubjectId}`);
      }
      if (wallet.gems !== INITIAL_WALLET_GEMS) {
        throw new Error(`wallet.gems 應為 ${INITIAL_WALLET_GEMS}，實際 ${wallet.gems}`);
      }

      const ledgers = await tx.walletLedger.findMany({
        where: { walletId: wallet.id },
      });
      if (ledgers.length !== 1) {
        throw new Error(`ledger 筆數應為 1，實際 ${ledgers.length}`);
      }
      const [entry] = ledgers;
      if (entry.gemChange !== INITIAL_WALLET_GEMS) {
        throw new Error(`gemChange 應為 ${INITIAL_WALLET_GEMS}，實際 ${entry.gemChange}`);
      }
      if (entry.balanceAfter !== INITIAL_WALLET_GEMS) {
        throw new Error(
          `balanceAfter 應為 ${INITIAL_WALLET_GEMS}，實際 ${entry.balanceAfter}`,
        );
      }
      if (entry.actionType !== "INITIAL_GRANT") {
        throw new Error(`actionType 應為 INITIAL_GRANT，實際 ${entry.actionType}`);
      }

      throw new RollbackForTest();
    });
  } catch (error) {
    if (error instanceof RollbackForTest) {
      return;
    }
    throw error;
  }
}

async function main(): Promise<void> {
  if (!process.env.DATABASE_URL?.trim()) {
    throw new Error("DATABASE_URL 未設定，無法執行 GameFi E2E 測試");
  }

  console.log("🧪 GameFi E2E：provisionUserWithWallet（transaction rollback）…");
  await assertProvisionGrantsInitialGems();
  console.log("✅ 新用戶錢包初始化與 1000 gems INITIAL_GRANT 驗證通過。");
}

main()
  .catch((error: unknown) => {
    console.error("❌ GameFi E2E 測試失敗：", error);
    process.exit(1);
  })
  .finally(async () => {
    await getPrisma().$disconnect();
  });
