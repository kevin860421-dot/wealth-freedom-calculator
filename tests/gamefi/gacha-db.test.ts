/**
 * GameFi 抽卡資料庫整合測試（transaction rollback，不留測試髒資料）
 *
 * 執行：npm run test:gamefi:gacha
 */
import { randomUUID } from "node:crypto";
import { getPrisma } from "@/lib/db/client";
import { summonGachaCardInTx } from "@/lib/gamefi/services/gacha";

const TEST_CARD_SLUG = "mortgage-slave-30y";

class RollbackForTest extends Error {
  constructor() {
    super("ROLLBACK_FOR_TEST");
    this.name = "RollbackForTest";
  }
}

async function assertGachaDatabaseLoop(): Promise<void> {
  const prisma = getPrisma();
  const authSubjectId = randomUUID();
  const email = `gacha-db-${Date.now()}@verify.local`;

  try {
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          authSubjectId,
          email,
          displayName: "Gacha DB Test",
          authProvider: "test",
        },
      });

      const wallet = await tx.userWallet.create({
        data: {
          userId: user.id,
          gems: 1000,
        },
      });

      await tx.walletLedger.create({
        data: {
          userId: user.id,
          walletId: wallet.id,
          actionType: "INITIAL_GRANT",
          gemChange: 1000,
          balanceAfter: 1000,
          requestId: `TEST_INIT_${randomUUID()}`,
        },
      });

      const first = await summonGachaCardInTx(tx, user.id, {
        cardSlug: TEST_CARD_SLUG,
        requestId: `TEST_GACHA_1_${randomUUID()}`,
      });

      if (first.card.level !== 1) {
        throw new Error(`首次抽卡 level 應為 1，實際 ${first.card.level}`);
      }
      if (first.card.attack !== 100) {
        throw new Error(`首次抽卡 attack 應為 100，實際 ${first.card.attack}`);
      }
      if (first.card.cardSlug !== TEST_CARD_SLUG) {
        throw new Error(`card_slug 不符：${first.card.cardSlug}`);
      }

      const countAfterFirst = await tx.userCard.count({
        where: { userId: user.id },
      });
      if (countAfterFirst !== 1) {
        throw new Error(`首次抽卡後應僅 1 筆 user_cards，實際 ${countAfterFirst}`);
      }

      const second = await summonGachaCardInTx(tx, user.id, {
        cardSlug: TEST_CARD_SLUG,
        requestId: `TEST_GACHA_2_${randomUUID()}`,
      });

      if (second.card.level !== 2) {
        throw new Error(`重複抽卡 level 應為 2，實際 ${second.card.level}`);
      }
      if (second.card.attack !== 250) {
        throw new Error(`重複抽卡 attack 應為 250，實際 ${second.card.attack}`);
      }
      if (second.card.id !== first.card.id) {
        throw new Error("重複抽卡應更新同一資料列，而非新增");
      }

      const countAfterSecond = await tx.userCard.count({
        where: { userId: user.id },
      });
      if (countAfterSecond !== 1) {
        throw new Error(
          `@@unique 防線失敗：重複抽卡後應仍為 1 筆，實際 ${countAfterSecond}`,
        );
      }

      const gachaLedgers = await tx.walletLedger.findMany({
        where: {
          userId: user.id,
          actionType: "GACHA_SUMMON",
        },
        orderBy: { createdAt: "asc" },
      });

      if (gachaLedgers.length !== 2) {
        throw new Error(
          `GACHA_SUMMON 流水帳應為 2 筆，實際 ${gachaLedgers.length}`,
        );
      }

      for (const ledger of gachaLedgers) {
        if (ledger.gemChange !== 0) {
          throw new Error(`GACHA_SUMMON gem_change 應為 0，實際 ${ledger.gemChange}`);
        }
        if (ledger.balanceAfter !== 1000) {
          throw new Error(
            `GACHA_SUMMON balance_after 應為 1000，實際 ${ledger.balanceAfter}`,
          );
        }
      }

      throw new RollbackForTest();
    });
  } catch (error) {
    if (error instanceof RollbackForTest) return;
    throw error;
  }
}

async function main(): Promise<void> {
  if (!process.env.DATABASE_URL?.trim()) {
    throw new Error("DATABASE_URL 未設定，無法執行抽卡 DB 測試");
  }

  console.log("🧪 GameFi DB：抽卡 user_cards + GACHA_SUMMON ledger（rollback）…");
  await assertGachaDatabaseLoop();
  console.log("✅ 抽卡寫入、@@unique 升級、流水帳閉環驗證通過。");
}

main()
  .catch((error: unknown) => {
    console.error("❌ GameFi 抽卡 DB 測試失敗：", error);
    process.exit(1);
  })
  .finally(async () => {
    await getPrisma().$disconnect();
  });
