import type { TopicSeed } from "@/app/mini-blog/posts/topic-types";

/**
 * 人性化開場（煽情／痛點）啟用門檻：發布日「晚於 2026/5/12」（即自 2026/5/13 起）。
 * 敘述可用同事、學弟等身邊角色帶入，讀起來像真人對話；仍為情境改寫，不宣稱可指涉之特定當事人。
 */
const HUMAN_STORY_OPENING_MS = Date.parse("2026-05-13T00:00:00+08:00");

export function publishAtUsesHumanStoryOpening(publishAtIso: string): boolean {
  const t = Date.parse(publishAtIso);
  return Number.isFinite(t) && t >= HUMAN_STORY_OPENING_MS;
}

/** mini-blog／試算專文：情境註記（短，放段首或段末一次即可） */
export const HUMAN_STORY_ANON_NOTE_INVESTING =
  "（以下以身邊常見角色——如同事、學弟——帶入情境寫作，非特定可指涉之真人真事；數字與稅負以試算頁及法令為準。）";

export const HUMAN_STORY_ANON_NOTE_LOAN =
  "（以下以身邊常見角色帶入借貸情境，非特定可指涉之真人真事；利率、月付與契約以金融機構為準。）";

/** quick-1～10 專文：前言首段（口語、痛點、含 SEO 錨詞） */
export function miniBlogInvestingHumanPreamble(seed: TopicSeed): string {
  return `同事或學弟聊天時最常出現的句型，不是不懂「${seed.focus}」，是帳面數字看久了，心裡會自己幫忙「鍍金」：薪水進帳那天覺得還行，月底一對帳又覺得白忙。${HUMAN_STORY_ANON_NOTE_INVESTING}這種落差最常跟「${seed.keywordA}」「${seed.keywordB}」綁在一起——因為你把結果想得很快，把扣款、等待與「${seed.keywordC}」想得太少。`;
}

/** 部落格延伸系列（/blog/[slug]）：首屏前導一段 */
export function extendedBlogHumanLeadParagraph(
  post: { seriesLabel: string; seriesNo: number },
  registry: { listDescription: string },
): string {
  return `先別急著找標準答案。${registry.listDescription}很多人不是不想算，是怕一算就要承認自己先前太樂觀；但你會點進「${post.seriesLabel}（${post.seriesNo}）」這種題，通常代表你已經準備好把數字攤開。（敘述為同事、學弟之類常見對話情境之改寫，非特定可指涉之當事人；試算僅供參考。）`;
}
