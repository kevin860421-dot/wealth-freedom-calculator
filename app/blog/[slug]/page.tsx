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

      {(() => {
        const [firstSection, ...restSections] = post.sections;
        return (
          <>
            <div className={styles.article}>
              <section key={firstSection.heading}>
                <h2>{firstSection.heading}</h2>
                {firstSection.paragraphs.map((paragraph) => (
                  <p key={paragraph} className={styles.grafTight}>
                    {paragraph}
                  </p>
                ))}
                {firstSection.bullets ? (
                  <ul>
                    {firstSection.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                ) : null}

                {post.calculatorMode === "direct-link" ? (
                  <section aria-label={`計算機連結：${post.calculatorTitle}`}>
                    <h2 style={{ marginTop: 0 }}>{post.calculatorTitle}</h2>
                    <p className={styles.grafTight}>{post.calculatorNote}</p>
                    <Link href={post.calculatorRoute} className={styles.cta} target="_blank" rel="noopener noreferrer">
                      直接打開計算機（另開分頁）→
                    </Link>
                  </section>
                ) : null}
              </section>
            </div>

            {post.calculatorMode !== "direct-link" ? (
              <div className={styles.articleAdjacentEmbed}>
                <BlogMiniCalculatorEmbed
                  route={post.calculatorRoute}
                  title={post.calculatorTitle}
                  note={post.calculatorNote}
                  miniBlogSlug={slug}
                />
              </div>
            ) : null}

            <div className={styles.article}>
              {restSections.map((section) => (
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
          </>
        );
      })()}

      <ArticlePublishStamp publishAtIso={registry.publishAtIso} />
    </article>
  );
}

