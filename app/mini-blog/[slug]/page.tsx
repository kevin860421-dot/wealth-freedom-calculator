import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BlogMiniCalculatorEmbed } from "../../blog/blog-mini-calculator-embed";
import {
  getQuick1ExclusivePostBySlug,
  QUICK1_EXCLUSIVE_POSTS,
  type Quick1ExclusivePost,
} from "../posts/quick1-exclusive";
import styles from "../../blog/blog.module.css";

type PageProps = {
  params: Promise<{ slug: string }>;
};

function resolvePost(slug: string): Quick1ExclusivePost | null {
  return getQuick1ExclusivePostBySlug(slug) ?? null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = resolvePost(slug);
  if (!post) return {};
  return {
    title: post.seoTitle,
    description: post.metaDescription,
    alternates: { canonical: `/mini-blog/${post.slug}` },
    robots: { index: true, follow: true },
    openGraph: {
      title: post.seoTitle,
      description: post.metaDescription,
      type: "article",
      url: `/mini-blog/${post.slug}`,
      locale: "zh_TW",
      siteName: "財富自由計算機",
    },
  };
}

export async function generateStaticParams() {
  return QUICK1_EXCLUSIVE_POSTS.map((post) => ({ slug: post.slug }));
}

export default async function MiniBlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = resolvePost(slug);
  if (!post) notFound();
  const calculatorLabel =
    post.calculatorRoute === "/quick-2"
      ? "財富自由倒數計時器"
      : post.calculatorRoute === "/quick-3"
        ? "夢想月領試算器"
        : "存股複利計算機";

  return (
    <article className={styles.wrap}>
      <div className={styles.postMetaRow}>
        <Link href="/mini-blog" className={styles.back}>
          ← 存股複利計算機專屬文章列表
        </Link>
        <span className={styles.seriesPill}>小計算機專區 · 存股複利計算機</span>
      </div>
      <p style={{ marginTop: 8, marginBottom: 4, fontSize: 13, opacity: 0.8 }}>
        預計發布：{post.publishAtIso.slice(0, 10).replaceAll("-", "/")}
      </p>

      <h1 className={styles.title}>{post.title}</h1>
      <p className={styles.subtitle}>{post.subtitle}</p>

      <div className={styles.article}>
        {post.sections.map((section, idx) => (
          <section key={section.heading}>
            <h2>{section.heading}</h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph} className={styles.grafTight}>
                {paragraph}
              </p>
            ))}
            {section.bullets ? (
              <ul>
                {section.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            ) : null}

            {idx === 0 ? (
              <BlogMiniCalculatorEmbed
                route={post.calculatorRoute}
                title={post.calculatorTitle}
                note={post.calculatorNote}
              />
            ) : null}
          </section>
        ))}

        <Link href={post.calculatorRoute} className={styles.cta} target="_blank" rel="noopener noreferrer">
          回到{calculatorLabel}（另開分頁）→
        </Link>

        <p className={styles.grafTight}>{post.closeQuestion}</p>

        <div className={styles.disclaimer}>
          <p>
            <strong>免責聲明：</strong>
            {post.disclaimer}
          </p>
        </div>
      </div>
    </article>
  );
}
