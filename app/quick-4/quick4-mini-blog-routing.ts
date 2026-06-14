/**
 * 第 4 台 mini-blog：已發布／未發布導向
 * - 標的文章已發布 → 自己的 `/mini-blog/{slug}`
 * - 尚未發布 → 最適合的「已發布」第 4 台文章（絕不導向未發布 slug）
 */
import {
  getPublishedQuick1ExclusivePosts,
  isQuick1ExclusivePostPublished,
  type Quick1ExclusivePost,
} from "@/app/mini-blog/posts/quick1-exclusive";
import { findTickerPreset, parseQuick4TickerSlug, quick4TickerSlug, tickerShortName } from "./ticker-scenarios";

export const QUICK4_PILLAR_SLUG = "quick4-etf-monthly-income-simulator-guide";

function scorePublishedPostForTicker(post: Quick1ExclusivePost, tickerId: string, presetLabel: string): number {
  const id = tickerId.toUpperCase();
  let score = 0;
  if (post.slug === quick4TickerSlug(id)) return 10_000;
  const slugTicker = parseQuick4TickerSlug(post.slug);
  if (slugTicker === id) return 9_000;
  if (post.slug.includes(id.toLowerCase()) || post.slug.includes(id)) score += 500;
  const blob = `${post.title} ${post.seoTitle} ${post.metaDescription} ${post.slug}`.toUpperCase();
  if (blob.includes(id)) score += 400;
  const short = presetLabel.toUpperCase();
  if (short.length >= 2 && blob.includes(short.slice(0, Math.min(4, short.length)))) score += 80;
  if (post.slug === QUICK4_PILLAR_SLUG) score += 30;
  if (post.slug.includes("high-dividend") || post.slug.includes("monthly-income")) score += 10;
  return score;
}

/** 給搜尋／下拉／CTA：回傳「現在可公開索引」的 mini-blog 路徑 */
export function resolveQuick4PublishedMiniBlogHref(
  tickerId: string,
  now: Date = new Date(),
): { href: string; slug: string; isOwnArticle: boolean } {
  const id = tickerId.toUpperCase();
  const ownSlug = quick4TickerSlug(id);
  const preset = findTickerPreset(id);
  const label = preset ? tickerShortName(preset) : id;

  const published = getPublishedQuick1ExclusivePosts(now).filter((p) => p.calculatorRoute === "/quick-4");
  const own = published.find((p) => p.slug === ownSlug);
  if (own) return { href: `/mini-blog/${ownSlug}`, slug: ownSlug, isOwnArticle: true };

  let best = published.find((p) => p.slug === QUICK4_PILLAR_SLUG) ?? published[0];
  let bestScore = -1;
  for (const p of published) {
    const s = scorePublishedPostForTicker(p, id, label);
    if (s > bestScore) {
      bestScore = s;
      best = p;
    }
  }
  if (!best) return { href: `/quick-4?code=${encodeURIComponent(id)}`, slug: ownSlug, isOwnArticle: false };
  return { href: `/mini-blog/${best.slug}`, slug: best.slug, isOwnArticle: false };
}

export function isQuick4TickerArticlePublished(tickerId: string, now: Date = new Date()): boolean {
  const slug = quick4TickerSlug(tickerId);
  const posts = getPublishedQuick1ExclusivePosts(now);
  return posts.some((p) => p.slug === slug);
}

export function resolveQuick4CalculatorHref(tickerId: string, extra?: Record<string, string>): string {
  const u = new URLSearchParams({ code: tickerId.toUpperCase(), etf: tickerId.toUpperCase() });
  if (extra) for (const [k, v] of Object.entries(extra)) u.set(k, v);
  return `/quick-4?${u.toString()}`;
}

/** 檢查：計算機 code、文章 slug、對外 href 是否同一檔標的 */
export function assertQuick4TickerConsistency(
  tickerId: string,
  slug: string,
  now: Date = new Date(),
): boolean {
  const id = tickerId.toUpperCase();
  const fromSlug = parseQuick4TickerSlug(slug);
  if (fromSlug && fromSlug !== id) return false;

  const ownSlug = quick4TickerSlug(id);
  const ownPublished = isQuick4TickerArticlePublished(id, now);

  if (ownPublished) {
    return slug === ownSlug;
  }

  if (slug === ownSlug) return false;

  const published = getPublishedQuick1ExclusivePosts(now).filter((p) => p.calculatorRoute === "/quick-4");
  return published.some((p) => p.slug === slug);
}
