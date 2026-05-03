import type { Metadata } from "next";
import Link from "next/link";
import { QUICK1_EXCLUSIVE_POSTS } from "./posts/quick1-exclusive";
import styles from "../blog/blog.module.css";

export const metadata: Metadata = {
  title: "存股複利計算機專屬文章｜小計算機專區",
  description: `存股複利計算機專屬文章列表：${QUICK1_EXCLUSIVE_POSTS.length} 篇主題，涵蓋月投、第一桶金、退休月領與長期規劃。`,
};

export default function MiniBlogIndexPage() {
  return (
    <div className={styles.wrap}>
      <Link href="/quick-1" className={styles.back}>
        ← 回到存股複利計算機
      </Link>
      <h1 className={styles.title}>存股複利計算機專屬文章</h1>
      <p className={styles.subtitle}>這裡只放存股複利計算機的延伸內容（共 {QUICK1_EXCLUSIVE_POSTS.length} 篇），不與主部落格混在一起。</p>

      <ul className={styles.listIndex}>
        {QUICK1_EXCLUSIVE_POSTS.map((post, idx) => (
          <li key={post.slug}>
            <Link href={`/mini-blog/${post.slug}`} style={{ color: "var(--morandi-accent, #c4b5a3)", fontSize: "1rem" }}>
              {idx + 1}. {post.title}
            </Link>
            <p style={{ margin: "0.35rem 0 0", fontSize: "0.875rem", color: "var(--morandi-text-soft, #b8aea4)" }}>
              {post.subtitle}
            </p>
            <p style={{ margin: "0.25rem 0 0", fontSize: "0.8rem", color: "var(--morandi-text-soft, #a9a099)", opacity: 0.9 }}>
              預計發布：{post.publishAtIso.slice(0, 10).replaceAll("-", "/")}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
