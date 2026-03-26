import type { ReactNode } from "react";
import Link from "next/link";
import styles from "./blog.module.css";
import { blogPostPath, getBlogPostBySlug, isBlogPostPublished } from "./posts/registry";

/**
 * 系列文互相引用：僅在目標篇已達 publishAtIso 時才渲染為連結，否則為純文字（不導向「準備中」）。
 */
export function BlogPublishedLink({ slug, children }: { slug: string; children: ReactNode }) {
  const entry = getBlogPostBySlug(slug);
  const published = entry != null && isBlogPostPublished(entry.publishAtIso);
  if (!published) {
    return <span className={styles.seriesInlinePending}>{children}</span>;
  }
  return (
    <Link href={blogPostPath(slug)} className={styles.seriesInlineLink}>
      {children}
    </Link>
  );
}
