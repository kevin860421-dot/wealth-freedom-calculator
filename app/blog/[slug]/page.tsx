import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { WF_BLOG_CALCULATOR_CTA_ID } from "../blog-calculator-cta";
import { BlogMiniCalculatorEmbed } from "../blog-mini-calculator-embed";
import { BlogScheduledPlaceholder } from "../blog-scheduled-placeholder";
import { CalculatorHeroPreview } from "../calculator-hero-preview";
import { ArticlePublishStamp } from "../article-publish-stamp";
import { getExtendedSeriesPostBySlug, type ExtendedSeriesPost } from "../posts/extended-series";
import {
  blogPostPath,
  getBlogPostBySlug,
  isBlogPostPublished,
  type BlogPostRegistryEntry,
} from "../posts/registry";
import styles from "../blog.module.css";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
};

function resolveContent(slug: string): { post: ExtendedSeriesPost; registry: BlogPostRegistryEntry } | null {
  const post = getExtendedSeriesPostBySlug(slug);
  if (!post) return null;
  const registry = getBlogPostBySlug(slug);
  if (!registry) {
    throw new Error(`[blog] registry 缺少 slug：${slug}（請編輯 app/blog/posts/registry.ts）`);
  }
  return { post, registry };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const content = resolveContent(slug);
  if (!content) return {};
  const { post, registry } = content;
  if (!isBlogPostPublished(registry.publishAtIso)) {
    return {
      title: "文章準備中｜財富自由計算機",
      description: "本篇將於指定時間公開，敬請期待。",
      robots: { index: false, follow: false },
    };
  }
  return {
    title: post.seoTitle,
    description: post.metaDescription,
    alternates: { canonical: blogPostPath(slug) },
    robots: { index: true, follow: true },
    openGraph: {
      title: post.seoTitle.replace("｜財富自由計算機", ""),
      description: post.metaDescription,
      type: "article",
      url: blogPostPath(slug),
      locale: "zh_TW",
      siteName: "財富自由計算機",
      publishedTime: registry.publishAtIso,
    },
  };
}

export default async function ExtendedSeriesPage({ params }: PageProps) {
  const { slug } = await params;
  const content = resolveContent(slug);
  if (!content) {
    notFound();
  }
  const { post, registry } = content;

  if (!isBlogPostPublished(registry.publishAtIso)) {
    return <BlogScheduledPlaceholder publishAtIso={registry.publishAtIso} />;
  }

  return (
    <article className={styles.wrap}>
      <div className={styles.postMetaRow}>
        <Link href="/blog" className={styles.back}>
          ← 部落格列表
        </Link>
        <span className={styles.seriesPill}>
          部落格｜{post.seriesLabel} · {post.seriesNo}
        </span>
      </div>

      <h1 className={styles.title}>{post.title}</h1>
      <p className={styles.subtitle}>{post.subtitle}</p>

      <CalculatorHeroPreview />

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

        <p className={styles.grafTight}>
          你可以在<strong>財富自由計算機</strong>把每期須扣除、稅費與達標年期放在同一條時間軸比較，避免只看一個報酬率數字做決策。
        </p>

        <Link id={WF_BLOG_CALCULATOR_CTA_ID} href="/" className={styles.cta} target="_blank" rel="noopener noreferrer">
          前往財富自由計算機（另開分頁）→
        </Link>

        <p className={styles.grafTight}>{post.closeQuestion}</p>

        <div className={styles.disclaimer}>
          <p>
            <strong>免責聲明：</strong>
            {post.disclaimer}
          </p>
        </div>
      </div>

      <ArticlePublishStamp publishAtIso={registry.publishAtIso} />
    </article>
  );
}

