import { QUICK_SEO_BLOCKS } from "./quick-seo-data";

export const QUICK_CALCULATOR_IDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

/** 每台固定推薦 3 台「主題相關」小計算機（非隨機） */
export const QUICK_CROSS_LINK_RELATED: Record<number, readonly number[]> = {
  1: [2, 3, 5], // 複利 → 達標年、反推月投、雪球對照
  2: [1, 3, 10], // 倒數 → 複利、夢想月領、崩盤壓力
  3: [2, 1, 4], // 反推月投 → 倒數、複利、ETF 領息
  4: [1, 12, 3], // ETF 領息 → 複利、稅務、月領
  5: [1, 10, 2], // 雪球 → 複利、崩盤、倒數
  6: [11, 7, 1], // 房貸 vs 股 → 破產／房貸、買車、複利
  7: [6, 11, 8], // 買車 vs 股 → 房貸、破產、延遲享樂
  8: [9, 7, 1], // 延遲享樂 → 延遲 2、買車、複利
  9: [8, 7, 2], // 延遲 2 → 延遲 1、買車、倒數
  10: [5, 1, 2], // 崩盤壓力 → 雪球、複利、倒數
  11: [6, 7, 12], // 破產／信貸 → 房貸、車貸、稅務
  12: [4, 1, 11], // 稅務 → ETF 領息、複利、破產現金流
};

export type QuickCrossLinkItem = {
  id: number;
  href: string;
  title: string;
  blurb: string;
};

function crossLinkTitle(id: number): string {
  const block = QUICK_SEO_BLOCKS[id];
  if (!block) return `第 ${id} 台小計算機`;
  const head = block.metaTitle.split("｜")[0]?.trim();
  return head || block.summaryLabel.replace(/^延伸閱讀[^：]*：?/, "").trim() || `第 ${id} 台小計算機`;
}

function crossLinkBlurb(id: number): string {
  const block = QUICK_SEO_BLOCKS[id];
  if (!block) return "站內小計算機，點開即可試算。";
  const text = block.metaDescription.trim();
  return text.length > 56 ? `${text.slice(0, 55)}…` : text;
}

export function buildQuickCrossLinkItem(id: number): QuickCrossLinkItem {
  return {
    id,
    href: `/quick-${id}`,
    title: crossLinkTitle(id),
    blurb: crossLinkBlurb(id),
  };
}

function fallbackRelatedIds(currentId: number, count: number): number[] {
  const others = QUICK_CALCULATOR_IDS.filter((id) => id !== currentId);
  const start = (currentId * 3) % others.length;
  const picked: number[] = [];
  for (let i = 0; i < Math.min(count, others.length); i++) {
    picked.push(others[(start + i) % others.length]!);
  }
  return picked;
}

/** 依主題相關表推薦（排除當前台；表內缺漏時用備援順序） */
export function pickQuickCrossLinks(currentId: number, count = 3): QuickCrossLinkItem[] {
  const configured = QUICK_CROSS_LINK_RELATED[currentId] ?? [];
  const ids: number[] = [];
  for (const id of configured) {
    if (id === currentId || ids.includes(id)) continue;
    if (!QUICK_SEO_BLOCKS[id]) continue;
    ids.push(id);
    if (ids.length >= count) break;
  }
  if (ids.length < count) {
    for (const id of fallbackRelatedIds(currentId, count)) {
      if (ids.length >= count) break;
      if (!ids.includes(id)) ids.push(id);
    }
  }
  return ids.map(buildQuickCrossLinkItem);
}
