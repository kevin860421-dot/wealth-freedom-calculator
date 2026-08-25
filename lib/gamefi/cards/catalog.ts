export type GachaCardTemplate = {
  slug: string;
  name: string;
  baseAttack: number;
  defensePct: number;
  story: string;
};

export const GACHA_ATTACK_PER_LEVEL = 150;

export const GACHA_CARD_POOL: GachaCardTemplate[] = [
  {
    slug: "mortgage-slave-30y",
    name: "三十年房貸奴隸",
    baseAttack: 100,
    defensePct: 5,
    story: "每個早晨叫醒你的不是夢想，而是利息...",
  },
  {
    slug: "moonlight-warrior",
    name: "月光族勇士",
    baseAttack: 100,
    defensePct: 3,
    story: "薪水還沒捂熱，房東的訊息就先到了。",
  },
  {
    slug: "compound-believer",
    name: "複利信徒",
    baseAttack: 100,
    defensePct: 8,
    story: "你相信時間是朋友，直到看到帳單上的複利是敵人。",
  },
  {
    slug: "nhi2-evader",
    name: "二代健保逃兵",
    baseAttack: 100,
    defensePct: 12,
    story: "配息超過兩萬的那一瞬間，你聽見了健保署的腳步聲。",
  },
];

export function getCardTemplateBySlug(slug: string): GachaCardTemplate | null {
  return GACHA_CARD_POOL.find((card) => card.slug === slug) ?? null;
}

export function pickRandomCardTemplate(): GachaCardTemplate {
  const index = Math.floor(Math.random() * GACHA_CARD_POOL.length);
  return GACHA_CARD_POOL[index] ?? GACHA_CARD_POOL[0];
}

export function enrichCardView(card: {
  id: string;
  cardSlug: string;
  level: number;
  attack: number;
}) {
  const template = getCardTemplateBySlug(card.cardSlug);
  return {
    id: card.id,
    cardSlug: card.cardSlug,
    cardName: template?.name ?? card.cardSlug,
    level: card.level,
    attack: card.attack,
    defensePct: template?.defensePct ?? 0,
    story: template?.story ?? "",
  };
}
