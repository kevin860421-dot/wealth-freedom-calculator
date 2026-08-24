-- 003_init_wallet_ledger
CREATE TYPE "WalletLedgerActionType" AS ENUM ('INITIAL_GRANT');

CREATE TABLE "wallet_ledger" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "wallet_id" UUID NOT NULL,
    "action_type" "WalletLedgerActionType" NOT NULL,
    "gem_change" INTEGER NOT NULL,
    "balance_after" INTEGER NOT NULL,
    "target_id" TEXT,
    "request_id" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallet_ledger_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "wallet_ledger_wallet_request_uidx" ON "wallet_ledger"("wallet_id", "request_id");
CREATE INDEX "wallet_ledger_wallet_created_idx" ON "wallet_ledger"("wallet_id", "created_at");
CREATE INDEX "wallet_ledger_user_created_idx" ON "wallet_ledger"("user_id", "created_at");

ALTER TABLE "wallet_ledger" ADD CONSTRAINT "wallet_ledger_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "wallet_ledger" ADD CONSTRAINT "wallet_ledger_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "user_wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
