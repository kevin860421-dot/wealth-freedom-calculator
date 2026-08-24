-- 002_init_wallets
CREATE TYPE "WalletStatus" AS ENUM ('ACTIVE', 'BLOCKED', 'AUDIT_HOLD');

CREATE TABLE "user_wallets" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "gems" INTEGER NOT NULL,
    "status" "WalletStatus" NOT NULL DEFAULT 'ACTIVE',
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_wallets_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "user_wallets_user_id_key" ON "user_wallets"("user_id");

ALTER TABLE "user_wallets" ADD CONSTRAINT "user_wallets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
