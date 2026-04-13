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

const SLUG = "painpoint-6-anxiety-about-retirement" as const;
const _registryEntry = getBlogPostBySlug(SLUG);
if (!_registryEntry) {
  throw new Error(`[blog] registry 缺少 slug：${SLUG}（請編輯 app/blog/posts/registry.ts）`);
}
const entry: BlogPostRegistryEntry = _registryEntry;

const ARTICLE_PATH = blogPostPath(SLUG);

const publishedArticleMetadata: Metadata = {
  title: "痛點短評（11）｜退休焦慮其實是一種未知成本｜財富自由計算機",
  description:
    "買不起房、勞保、失業都很真實；但最折磨人的往往是『我到底還差多少』。用可對帳的方式把稅費與每期扣除攤開。僅供參考。",
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

function Painpoint6Published() {
  return (
    <article className={styles.wrap}>
      <div className={styles.postMetaRow}>
        <Link href="/blog" className={styles.back}>
          ← 部落格列表
        </Link>
        <span className={styles.seriesPill}>部落格｜痛點短評 · 11</span>
      </div>
      <h1 className={styles.title}>退休焦慮其實是一種「未知成本」</h1>
      <p className={styles.subtitle}>
        你不是怕努力沒回報。你是怕扣完稅、扣完費、扣完健保後，剩下的數字小得不敢看。
      </p>

      <PainpointHero
        no={11}
        title="退休焦慮其實是一種「未知成本」"
        subtitle="不是努力沒回報，是你不知道扣完後還剩多少。先把未知變成區間，焦慮才會變成選項。"
      />

      <div className={styles.article}>
        <h2>焦慮不是問題，不敢算清楚才是</h2>
        <p className={styles.grafTight}>
          買不起房、勞保、失業、家庭支出……每一個都可能是真的。問題是：你把它們混成一坨情緒，就永遠只能用「感覺」做決策。
        </p>
        <p className={styles.grafTight}>
          你需要的是一個能把<strong>每期扣除</strong>攤開的試算：稅、二代健保、手續費，讓你看到「扣完還剩多少」。
        </p>

        <PainpointInteractiveCard
          title="互動：你現在的焦慮長什麼樣？"
          prompt="選一個最像你的版本。我會用一句話把它翻成『可行動的下一步』。"
          choices={[
            {
              id: "unknown-gap",
              label: "我不知道『差多少』，所以一直拖著不算。",
              resultTitle: "下一步：把『未知』改成區間",
              resultBody:
                "先不要追求精準。把稅、二代健保、手續費放進同一套試算，得到『每期可再投入』的區間，焦慮會立刻降一級。",
            },
            {
              id: "fear-of-small",
              label: "我怕看到扣完後很小，乾脆先不看。",
              resultTitle: "下一步：把現金流當主角",
              resultBody:
                "你不是怕小，你是怕沒控制感。先把目標改成『稅後月領』，再看哪個扣除把年期拉長，才知道該補哪裡。",
            },
            {
              id: "too-many-variables",
              label: "我覺得變數太多，算了也沒用。",
              resultTitle: "下一步：一次只改一個變數",
              resultBody:
                "變數多沒關係，方法要對。每次只改年化或每期投入其中一項，做 2～3 個情境對照，你會很快知道哪個最關鍵。",
            },
          ]}
        />

        <h2>今晚只做一件事：把未知變成可被討論</h2>
        <ul>
          <li>把你的目標寫成「稅後」月領數字，而不是稅前幻想。</li>
          <li>把每期扣除攤開，別只看期末資產。</li>
          <li>每次只改一個變數，看達標年期差幾年。</li>
        </ul>

        <Link id={WF_BLOG_CALCULATOR_CTA_ID} href="/" className={styles.cta} target="_blank" rel="noopener noreferrer">
          前往財富自由計算機（另開分頁）→
        </Link>

        <div className={styles.disclaimer}>
          <p>
            <strong>免責聲明：</strong>本文為一般性資訊分享，不構成投資、稅務或法律建議；實際稅費與個案以法令與您的情況為準。
          </p>
        </div>
      </div>

      <ArticlePublishStamp publishAtIso={entry.publishAtIso} />
    </article>
  );
}

export default function Painpoint6() {
  if (!isBlogPostPublished(entry.publishAtIso)) {
    return <BlogScheduledPlaceholder publishAtIso={entry.publishAtIso} />;
  }
  return <Painpoint6Published />;
}

