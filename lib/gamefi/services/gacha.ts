import { randomUUID } from "node:crypto";
import type { UserCard } from "@prisma/client";
import { getPrisma, type PrismaTx } from "@/lib/db/client";
import {
  GACHA_ATTACK_PER_LEVEL,
  getCardTemplateBySlug,
  pickRandomCardTemplate,
  type GachaCardTemplate,
} from "@/lib/gamefi/cards/catalog";
import { GameFiServiceError } from "@/lib/gamefi/services/errors";

export type SummonGachaResult = {
  card: UserCard;
  leveledUp: boolean;
  template: GachaCardTemplate;
};

export type SummonGachaOptions = {
  cardSlug?: string;
  requestId?: string;
};

async function upsertCardInTransaction(
  tx: PrismaTx,
  userId: string,
  template: GachaCardTemplate,
): Promise<{ card: UserCard; leveledUp: boolean }> {
  const existing = await tx.userCard.findUnique({
    where: {
      userId_cardSlug: {
        userId,
        cardSlug: template.slug,
      },
    },
  });

  if (existing) {
    const card = await tx.userCard.update({
      where: { id: existing.id },
      data: {
        level: existing.level + 1,
        attack: existing.attack + GACHA_ATTACK_PER_LEVEL,
      },
    });
    return { card, leveledUp: true };
  }

  const card = await tx.userCard.create({
    data: {
      userId,
      cardSlug: template.slug,
      level: 1,
      attack: template.baseAttack,
    },
  });
  return { card, leveledUp: false };
}

/** 於既有 transaction 內召喚（供整合測試 rollback 使用） */
export async function summonGachaCardInTx(
  tx: PrismaTx,
  userId: string,
  options: SummonGachaOptions = {},
): Promise<SummonGachaResult> {
  const template = options.cardSlug
    ? getCardTemplateBySlug(options.cardSlug)
    : pickRandomCardTemplate();

  if (!template) {
    throw new GameFiServiceError(`未知卡片 slug：${options.cardSlug}`);
  }

  const wallet = await tx.userWallet.findUnique({ where: { userId } });
  if (!wallet) {
    throw new GameFiServiceError("找不到用戶錢包");
  }
  if (wallet.status !== "ACTIVE") {
    throw new GameFiServiceError(`錢包狀態不可用：${wallet.status}`);
  }

  const { card, leveledUp } = await upsertCardInTransaction(
    tx,
    userId,
    template,
  );

  const requestId = options.requestId ?? `GACHA_${randomUUID()}`;

  await tx.walletLedger.create({
    data: {
      userId,
      walletId: wallet.id,
      actionType: "GACHA_SUMMON",
      gemChange: 0,
      balanceAfter: wallet.gems,
      requestId,
      targetId: card.id,
      metadata: {
        cardSlug: template.slug,
        level: card.level,
        leveledUp,
        free: true,
      },
    },
  });

  return { card, leveledUp, template };
}

/**
 * 免費召喚抽卡（操作累積觸發）：寫入 user_cards + GACHA_SUMMON ledger。
 * 重複抽到同一 slug → level +1、attack +150（不新增資料列）。
 */
export async function summonGachaCard(
  userId: string,
  options: SummonGachaOptions = {},
): Promise<SummonGachaResult> {
  if (!userId?.trim()) {
    throw new GameFiServiceError("userId 不可為空");
  }

  return getPrisma().$transaction((tx) =>
    summonGachaCardInTx(tx, userId, options),
  );
}

export type DrawGachaResult = {
  userId: string;
  count: number;
  cards: SummonGachaResult[];
};

export async function drawGacha(
  userId: string,
  count: number,
): Promise<DrawGachaResult> {
  if (!Number.isInteger(count) || count < 1 || count > 10) {
    throw new GameFiServiceError("count 必須為 1–10 的整數");
  }

  const cards: SummonGachaResult[] = [];
  for (let i = 0; i < count; i += 1) {
    cards.push(await summonGachaCard(userId));
  }

  return { userId, count, cards };
}

export async function listUserCards(userId: string): Promise<UserCard[]> {
  return getPrisma().userCard.findMany({
    where: { userId },
    orderBy: [{ attack: "desc" }, { updatedAt: "desc" }],
  });
}

export function sumCardAttack(cards: Pick<UserCard, "attack">[]): number {
  return cards.reduce((sum, card) => sum + card.attack, 0);
}
