/** Prisma 初始化與 GameFi DB 存取（統一入口） */
export {
  getPrisma,
  isDatabaseEnabled,
  type ExtendedPrismaClient,
  type PrismaTx,
} from "./db/client";
export {
  isWalletLedgerAppendOnlyError,
  WALLET_LEDGER_APPEND_ONLY_ERROR,
} from "./db/ledger-append-only";
