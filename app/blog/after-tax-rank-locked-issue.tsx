import type { Metadata } from "next";
import { BlogScheduledPlaceholder } from "./blog-scheduled-placeholder";
import { getBlogPostBySlug } from "./posts/registry";

/** 快照未到的月報。跟 10 月總排行同一套：直接開網址只顯示準備中，不填數字。 */
export function lockedRankMetadata(slug: string): Metadata {
  if (!getBlogPostBySlug(slug)) throw new Error(`[blog] registry 缺少 slug：${slug}`);
  return {
    title: "文章準備中｜財富自由計算機",
    description: "本篇將於指定時間公開，敬請期待。",
    robots: { index: false, follow: false },
  };
}

export function LockedRankPage({ slug }: { slug: string }) {
  const entry = getBlogPostBySlug(slug);
  if (!entry) throw new Error(`[blog] registry 缺少 slug：${slug}`);
  return <BlogScheduledPlaceholder publishAtIso={entry.publishAtIso} />;
}
