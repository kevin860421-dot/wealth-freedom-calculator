import { Prisma } from "@prisma/client";

export const WALLET_LEDGER_APPEND_ONLY_ERROR =
  "Security Violation: wallet_ledger is append-only.";

function denyMutation(): never {
  throw new Error(WALLET_LEDGER_APPEND_ONLY_ERROR);
}

/** Prisma Client Extension：wallet_ledger 禁止 update / delete / upsert */
export const walletLedgerAppendOnlyExtension = Prisma.defineExtension({
  name: "walletLedgerAppendOnly",
  query: {
    walletLedger: {
      async update() {
        denyMutation();
      },
      async updateMany() {
        denyMutation();
      },
      async delete() {
        denyMutation();
      },
      async deleteMany() {
        denyMutation();
      },
      async upsert() {
        denyMutation();
      },
    },
  },
});

export function isWalletLedgerAppendOnlyError(error: unknown): boolean {
  return (
    error instanceof Error &&
    error.message === WALLET_LEDGER_APPEND_ONLY_ERROR
  );
}
