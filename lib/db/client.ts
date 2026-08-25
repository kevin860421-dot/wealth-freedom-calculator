import { PrismaClient } from "@prisma/client";
import { walletLedgerAppendOnlyExtension } from "@/lib/db/ledger-append-only";

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createExtendedPrismaClient> | undefined;
};

function createExtendedPrismaClient() {
  const base = new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["error", "warn"]
        : ["error"],
  });

  return base.$extends(walletLedgerAppendOnlyExtension);
}

export type ExtendedPrismaClient = ReturnType<typeof createExtendedPrismaClient>;

/** 擴充後 Prisma Client 的 interactive transaction 參數型別 */
export type PrismaTx = Parameters<
  Parameters<ExtendedPrismaClient["$transaction"]>[0]
>[0];

/** 懶載入 Prisma 單例（含 wallet_ledger append-only 擴充） */
export function getPrisma(): ExtendedPrismaClient {
  if (!process.env.DATABASE_URL?.trim()) {
    throw new Error("DATABASE_URL 未設定，無法使用資料庫");
  }
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createExtendedPrismaClient();
  }
  return globalForPrisma.prisma;
}

export function isDatabaseEnabled(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}
