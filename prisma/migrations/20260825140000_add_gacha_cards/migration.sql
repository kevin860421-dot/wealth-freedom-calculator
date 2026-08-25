-- add_gacha_cards: 對齊 user_cards 規格（card_slug、attack 預設 100）
ALTER TABLE "user_cards" RENAME COLUMN "card_key" TO "card_slug";

ALTER TABLE "user_cards" DROP COLUMN IF EXISTS "card_name";
ALTER TABLE "user_cards" DROP COLUMN IF EXISTS "defense_pct";
ALTER TABLE "user_cards" DROP COLUMN IF EXISTS "story";

ALTER TABLE "user_cards" ALTER COLUMN "attack" SET DEFAULT 100;

DROP INDEX IF EXISTS "user_cards_user_card_key_uidx";
CREATE UNIQUE INDEX "user_cards_user_card_slug_uidx" ON "user_cards"("user_id", "card_slug");
