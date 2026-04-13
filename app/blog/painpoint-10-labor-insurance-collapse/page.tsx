import type { Metadata } from "next";
import Link from "next/link";
import { WF_BLOG_CALCULATOR_CTA_ID } from "../blog-calculator-cta";
import { ArticlePublishStamp } from "../article-publish-stamp";
import { BlogScheduledPlaceholder } from "../blog-scheduled-placeholder";
import { PainpointInteractiveCard } from "../painpoint-interactive-card";
import { PainpointHero } from "../painpoint-hero";
import type { BlogPostRegistryEntry } from "../posts/registry";
import { blogPostPath, getBlogPostBySlug, isBlogPostPublished } from "../posts/registry";
import styles from "../blog.module.css";

export const dynamic = "force-dynamic";

const SLUG = "painpoint-10-labor-insurance-collapse" as const;
const _registryEntry = getBlogPostBySlug(SLUG);
if (!_registryEntry) {
  throw new Error(`[blog] registry 缺少 slug：${SLUG}（請編輯 app/blog/posts/registry.ts）`);
}
const entry: BlogPostRegistryEntry = _registryEntry;

const ARTICLE_PATH = blogPostPath(SLUG);

const publishedArticleMetadata: Metadata = {
  title: "痛點短評（15）｜勞保破產焦慮：你該做的不是轉發貼文｜財富自由計算機",
  description:
    "勞保破產的焦慮很真實，但你該做的不是轉發貼文，而是把自己的缺口量出來：要補的是錢、時間，還是風險承受度。僅供參考。",
  alternates: { canonical: ARTICLE_PATH },
  robots: { index: true, follow: true },
};

export function generateMetadata(): Metadata {
  if (!isBlogPostPublished(entry.publishAtIso)) {
    return {
      title: "文章準備中｜財富自由計算機",
      description: "本篇將於指定時間公開，敬請期待。",
      robots: { index: false, follow: false },
    };
  }
  return publishedArticleMetadata;
}

function Painpoint10Published() {
  return (
    <article className={styles.wrap}>
      <div className={styles.postMetaRow}>
        <Link href="/blog" className={styles.back}>
          ← 部落格列表
        </Link>
        <span className={styles.seriesPill}>部落格｜痛點短評 · 15</span>
      </div>
      <h1 className={styles.title}>勞保破產焦慮：你該做的不是轉發貼文</h1>
      <p className={styles.subtitle}>
        你轉發一百次也不會多出一塊退休金。你能做的，是把自己的缺口量出來，然後用可執行的方式補上。
      </p>

      <PainpointHero
        no={15}
        title="勞保破產焦慮：你該做的不是轉發貼文"
        subtitle="先別吵制度。先把你自己的缺口量出來：要補的是錢、時間，還是風險承受度？"
      />

      <div className={styles.article}>
        <h2>先把焦慮翻成一個問題</h2>
        <p className={styles.grafTight}>
          你要問的不是「會不會破產」，而是：<strong>如果我拿不到原本預期的那一段，我的退休現金流缺口是多少？</strong>
        </p>

        <PainpointInteractiveCard
          title="互動：你想補的其實是哪一種缺口？"
          prompt="選一個最像你。不同缺口，做法完全不同。"
          choices={[
            {
              id: "money",
              label: "我怕的是『錢不夠』。",
              resultTitle: "把缺口變成『每月要補多少』",
              resultBody:
                "先用稅後月現金流當目標，再回推每期可投入要多少，才知道是提高投入、延長年期，或調整目標。",
            },
            {
              id: "time",
              label: "我怕的是『時間不夠』。",
              resultTitle: "先做兩版年期對照",
              resultBody:
                "跑一版保守、一版中性，看達標差幾年。你會很快知道『提早退休』是想法，還是可執行的計畫。",
            },
            {
              id: "risk",
              label: "我怕的是『風險太大』，不敢提高報酬假設。",
              resultTitle: "先把緩衝做厚",
              resultBody:
                "風險不是報酬率，是你撐不撐得住波動。先把每期扣除攤開、把緩衝資金算出來，風險承受度自然會清楚。",
            },
          ]}
        />

        <h2>缺口通常有三種：錢、時間、風險承受度</h2>
        <ul>
          <li>
            <strong>錢：</strong>你需要補多少資產，才能支撐同樣的稅後月領。
          </li>
          <li>
            <strong>時間：</strong>你能不能接受延後幾年達標（或延後退休）。
          </li>
          <li>
            <strong>風險承受度：</strong>你願不願意用更高波動換取更快達標。
          </li>
        </ul>

        <h2>最務實的一步：把「稅後現金流」放回時間軸</h2>
        <p className={styles.grafTight}>
          許多人的缺口不是因為不投資，而是因為只看稅前、只看期末總資產。把稅、二代健保、手續費放進每期扣除，你才知道自己真正能再投入多少。
        </p>

        <Link id={WF_BLOG_CALCULATOR_CTA_ID} href="/" className={styles.cta} target="_blank" rel="noopener noreferrer">
          前往財富自由計算機（另開分頁）→
        </Link>

        <div className={styles.disclaimer}>
          <p>
            <strong>免責聲明：</strong>本文為一般性資訊分享，不構成投資、稅務或法律建議；勞保與退休制度以官方公告與法規為準。
          </p>
        </div>
      </div>

      <ArticlePublishStamp publishAtIso={entry.publishAtIso} />
    </article>
  );
}

export default function Painpoint10() {
  if (!isBlogPostPublished(entry.publishAtIso)) {
    return <BlogScheduledPlaceholder publishAtIso={entry.publishAtIso} />;
  }
  return <Painpoint10Published />;
}

