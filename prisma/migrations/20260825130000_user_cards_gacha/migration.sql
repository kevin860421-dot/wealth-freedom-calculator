-- user_cards + GACHA_SUMMON ledger action
ALTER TYPE "WalletLedgerActionType" ADD VALUE IF NOT EXISTS 'GACHA_SUMMON';

CREATE TABLE "user_cards" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "card_key" TEXT NOT NULL,
    "card_name" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "attack" INTEGER NOT NULL,
    "defense_pct" DOUBLE PRECISION NOT NULL,
    "story" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_cards_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "user_cards_user_card_key_uidx" ON "user_cards"("user_id", "card_key");
CREATE INDEX "user_cards_user_idx" ON "user_cards"("user_id");

ALTER TABLE "user_cards" ADD CONSTRAINT "user_cards_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
