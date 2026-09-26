import type { Metadata } from "next";
import Link from "next/link";
import { absoluteUrl } from "@/lib/site-origin";
import { getPublishedQuick1ExclusivePosts } from "./posts/quick1-exclusive";
import styles from "../blog/blog.module.css";

const publishedPosts = getPublishedQuick1ExclusivePosts();

export const metadata: Metadata = {
  title: "小計算機專屬文章｜小計算機專區",
  description: `小計算機專屬文章列表：已公開 ${publishedPosts.length} 篇，涵蓋 quick-1 ~ quick-12 的試算情境與規劃。`,
  alternates: { canonical: "/mini-blog" },
};

export default function MiniBlogIndexPage() {
  const listJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "小計算機專屬文章",
    description: `已公開 ${publishedPosts.length} 篇試算情境。`,
    url: absoluteUrl("/mini-blog"),
    inLanguage: "zh-Hant",
  };
  return (
    <div className={styles.wrap}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(listJsonLd).replace(/</g, "\\u003c") }}
      />
      <Link href="/quick-1" className={styles.back} prefetch={false}>
        ← 回到存股複利計算機
      </Link>
      <h1 className={styles.title}>小計算機專屬文章</h1>
      <p className={styles.subtitle}>這裡只放小計算機延伸內容（已公開 {publishedPosts.length} 篇），不與主部落格混在一起。</p>

      <ul className={styles.listIndex}>
        {publishedPosts.map((post, idx) => (
          <li key={post.slug}>
            <Link href={`/mini-blog/${post.slug}`} prefetch={false} style={{ color: "var(--morandi-accent, #c4b5a3)", fontSize: "1rem" }}>
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
