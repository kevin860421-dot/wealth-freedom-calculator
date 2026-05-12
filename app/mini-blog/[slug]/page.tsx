import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BlogMiniCalculatorEmbed } from "../../blog/blog-mini-calculator-embed";
import { WF_BLOG_CALCULATOR_CTA_ID } from "../../blog/blog-calculator-cta";
import { BlogScheduledPlaceholder } from "../../blog/blog-scheduled-placeholder";
import {
  getQuick1ExclusivePostBySlug,
  isQuick1ExclusivePostPublished,
  QUICK1_EXCLUSIVE_POSTS,
  type Quick1ExclusivePost,
} from "../posts/quick1-exclusive";
import { QUICK12_DISPLAY_TITLE } from "@/app/quick-12/display-title";
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
  if (!isQuick1ExclusivePostPublished(post.publishAtIso)) {
    return {
      title: "文章準備中｜財富自由計算機",
      description: "本篇將於指定時間公開，敬請期待。",
      robots: { index: false, follow: false },
    };
  }
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
  if (!isQuick1ExclusivePostPublished(post.publishAtIso)) {
    return <BlogScheduledPlaceholder publishAtIso={post.publishAtIso} />;
  }
  const calculatorLabel =
    post.calculatorRoute === "/quick-2"
      ? "財富自由倒數計時器"
      : post.calculatorRoute === "/quick-3"
        ? "夢想月領試算器"
        : post.calculatorRoute === "/quick-4"
          ? "ETF 領息夢想模擬器"
          : post.calculatorRoute === "/quick-5"
            ? "雪球效應：本金 vs 複利"
            : post.calculatorRoute === "/quick-6"
              ? "槓桿抉擇：房產 vs 全球股市"
              : post.calculatorRoute === "/quick-7"
                ? "槓桿抉擇：房貸 vs 全球股市"
                : post.calculatorRoute === "/quick-8"
                  ? "延遲享樂計算機"
                  : post.calculatorRoute === "/quick-9"
                    ? "延遲享樂計算機 2"
                    : post.calculatorRoute === "/quick-10"
                      ? "複利美夢 VS 崩盤現實 計算機"
                      : post.calculatorRoute === "/quick-11"
                        ? "破產計算機"
                        : post.calculatorRoute === "/quick-12"
                          ? QUICK12_DISPLAY_TITLE
        : "存股複利計算機";

  return (
    <article className={styles.wrap} data-mini-blog-route={post.calculatorRoute}>
      <div className={styles.postMetaRow}>
        <Link href="/mini-blog" className={styles.back} prefetch={false}>
          ← 小計算機專屬文章列表
        </Link>
        <span className={styles.seriesPill}>小計算機專區 · 專屬文章</span>
      </div>
      <p style={{ marginTop: 8, marginBottom: 4, fontSize: 13, opacity: 0.8 }}>
        預計發布：{post.publishAtIso.slice(0, 10).replaceAll("-", "/")}
      </p>

      <h1 className={styles.title}>{post.title}</h1>
      <p className={styles.subtitle}>{post.subtitle}</p>

      {(() => {
        const [firstSection, ...restSections] = post.sections;
        return (
          <>
            <div className={styles.article}>
              <section key={firstSection.heading}>
                <h2>{firstSection.heading}</h2>
                {firstSection.paragraphs.map((paragraph, pIdx) => (
                  <p key={`${firstSection.heading}-${pIdx}`} className={styles.grafTight}>
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
              </section>
            </div>

            <div className={styles.articleAdjacentEmbed}>
              <BlogMiniCalculatorEmbed
                route={post.calculatorRoute}
                title={post.calculatorTitle}
                note={post.calculatorNote}
                miniBlogSlug={post.slug}
              />
              <div className={styles.articleAdjacentEmbedFooter}>
                <p className={styles.articleAdjacentEmbedFooterText}>
                  你可以在<strong>財富自由計算機</strong>把每期須扣除、稅費與達標年期放在同一條時間軸比較，避免只看一個報酬率數字做決策。
                </p>
                <Link id={WF_BLOG_CALCULATOR_CTA_ID} href="/" className={styles.cta} target="_blank" rel="noopener noreferrer" prefetch={false}>
                  前往財富自由計算機（另開分頁）→
                </Link>
              </div>
            </div>

            <div className={styles.article}>
              {restSections.map((section) => (
                <section key={section.heading}>
                  <h2>{section.heading}</h2>
                  {section.paragraphs.map((paragraph, pIdx) => (
                    <p key={`${section.heading}-${pIdx}`} className={styles.grafTight}>
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

              <Link href={post.calculatorRoute} className={styles.cta} target="_blank" rel="noopener noreferrer" prefetch={false}>
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
          </>
        );
      })()}
    </article>
  );
}
