import type { Metadata } from "next";
import Link from "next/link";
import { WF_BLOG_CALCULATOR_CTA_ID } from "../blog-calculator-cta";
import { ArticlePublishStamp } from "../article-publish-stamp";
import { BlogScheduledPlaceholder } from "../blog-scheduled-placeholder";
import { CalculatorHeroPreview } from "../calculator-hero-preview";
import { PainpointInteractiveCard } from "../painpoint-interactive-card";
import type { BlogPostRegistryEntry } from "../posts/registry";
import { blogPostPath, getBlogPostBySlug, isBlogPostPublished } from "../posts/registry";
import styles from "../blog.module.css";

export const dynamic = "force-dynamic";

const SLUG = "painpoint-18-parent-care-cost" as const;
const _registryEntry = getBlogPostBySlug(SLUG);
if (!_registryEntry) {
  throw new Error(`[blog] registry 缺少 slug：${SLUG}（請編輯 app/blog/posts/registry.ts）`);
}
const entry: BlogPostRegistryEntry = _registryEntry;

const ARTICLE_PATH = blogPostPath(SLUG);

const publishedArticleMetadata: Metadata = {
  title: "痛點短評（18）｜長照費用最殘酷的是「不確定」｜財富自由計算機",
  description:
    "長照不是一筆錢而已，是一段不確定的時間。把『每月會燒多少』『可能燒多久』寫成區間，才有機會做選擇。僅供參考。",
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

function Painpoint18Published() {
  return (
    <article className={styles.wrap}>
      <div className={styles.postMetaRow}>
        <Link href="/blog" className={styles.back}>
          ← 部落格列表
        </Link>
        <span className={styles.seriesPill}>部落格｜痛點短評 · 18</span>
      </div>
      <h1 className={styles.title}>長照費用最殘酷的是「不確定」</h1>
      <p className={styles.subtitle}>
        不是每月多少錢最可怕，是你不知道要燒多久。未知會把人逼到「不敢算」，但不算只會讓你更被動。
      </p>

      <CalculatorHeroPreview />

      <div className={styles.article}>
        <h2>把長照拆成兩個區間</h2>
        <ul>
          <li>
            <strong>每月成本區間：</strong>從補助後自付、看護、耗材，到交通與家人時間成本。
          </li>
          <li>
            <strong>期間區間：</strong>6 個月、2 年、5 年——你不需要預言，你需要預留方案。
          </li>
        </ul>

        <PainpointInteractiveCard
          title="互動：你現在最不確定的是哪一塊？"
          prompt="先選一個。你會更知道該從哪裡開始做情境。"
          choices={[
            {
              id: "monthly",
              label: "我不知道每月會燒多少。",
              resultTitle: "先做『每月成本』三段式",
              resultBody:
                "用低/中/高三段區間估（看護、耗材、交通、家人時間），先求能討論，不求一次精準。",
            },
            {
              id: "duration",
              label: "我不知道會燒多久。",
              resultTitle: "先做『期間』兩版就夠",
              resultBody:
                "先用 6–12 個月做短版，再用 2–3 年做長版。把差距放進同一條時間軸，你才知道緩衝要多厚。",
            },
            {
              id: "family-talk",
              label: "我不知道怎麼跟家人談，怕吵架。",
              resultTitle: "用同一套數字當共識",
              resultBody:
                "先把稅後現金流、每期扣除、緩衝寫成『區間』，再把長照當成情境變數；有共同數字，討論會比情緒更少。",
            },
          ]}
        />

        <h2>你真正要守住的是現金流</h2>
        <p className={styles.grafTight}>
          很多人資產不小，但現金流一拉長就崩。原因通常不是投資做錯，而是「每期扣除」與生活成本沒有被放進同一條時間軸。
        </p>

        <h2>用同一套假設，讓家人可以一起討論</h2>
        <p className={styles.grafTight}>
          你可以用<strong>財富自由計算機</strong>先把稅、二代健保、手續費攤開，得到「每期真正可再投入」的數字，再把長照支出當成情境變數去比：達標年期差多少、緩衝要多厚。
        </p>

        <Link id={WF_BLOG_CALCULATOR_CTA_ID} href="/" className={styles.cta} target="_blank" rel="noopener noreferrer">
          前往財富自由計算機（另開分頁）→
        </Link>

        <div className={styles.disclaimer}>
          <p>
            <strong>免責聲明：</strong>本文為一般性資訊分享，不構成投資、保險、稅務或法律建議；長照資源與補助以官方公告與個案評估為準。
          </p>
        </div>
      </div>

      <ArticlePublishStamp publishAtIso={entry.publishAtIso} />
    </article>
  );
}

export default function Painpoint18() {
  if (!isBlogPostPublished(entry.publishAtIso)) {
    return <BlogScheduledPlaceholder publishAtIso={entry.publishAtIso} />;
  }
  return <Painpoint18Published />;
}

