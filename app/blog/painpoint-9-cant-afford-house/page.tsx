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

const SLUG = "painpoint-9-cant-afford-house" as const;
const _registryEntry = getBlogPostBySlug(SLUG);
if (!_registryEntry) {
  throw new Error(`[blog] registry 缺少 slug：${SLUG}（請編輯 app/blog/posts/registry.ts）`);
}
const entry: BlogPostRegistryEntry = _registryEntry;

const ARTICLE_PATH = blogPostPath(SLUG);

const publishedArticleMetadata: Metadata = {
  title: "痛點短評（14）｜買不起房不是你不努力｜財富自由計算機",
  description:
    "買不起房不是你不努力；但用『我先不算』逃避，只會讓時間成本更硬。先把稅後現金流與可投入金額算清楚，再決定路線。僅供參考。",
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

function Painpoint9Published() {
  return (
    <article className={styles.wrap}>
      <div className={styles.postMetaRow}>
        <Link href="/blog" className={styles.back}>
          ← 部落格列表
        </Link>
        <span className={styles.seriesPill}>部落格｜痛點短評 · 14</span>
      </div>
      <h1 className={styles.title}>買不起房不是你不努力</h1>
      <p className={styles.subtitle}>
        但你更不能用「我先不算」來逃避。時間一過，成本不會變溫柔，只會更硬。
      </p>

      <PainpointHero
        no={14}
        title="買不起房不是你不努力"
        subtitle="你真正要選的是路線，不是情緒。先把『扣完後的可投入』算清楚，你才知道是速度問題，還是方向問題。"
      />

      <div className={styles.article}>
        <h2>你真正要選的是「路線」，不是情緒</h2>
        <p className={styles.grafTight}>
          有人選先租後買、有人選不買、有人選搬到負擔得起的城市。每條路都可以，但前提是：你要用同一套數字看清楚自己的承受度。
        </p>

        <PainpointInteractiveCard
          title="互動：你現在卡住的是哪一種？"
          prompt="先選一個最像你的狀態。"
          choices={[
            {
              id: "downpayment",
              label: "頭期款永遠追不到，存了又被生活吃掉。",
              resultTitle: "先把『每期可投入』算到位",
              resultBody:
                "不要只看薪水。把稅、健保、固定支出攤開，得到每期真正可投入的數字，才知道頭期款是『速度問題』還是『路線問題』。",
            },
            {
              id: "mortgage-fear",
              label: "我怕房貸把人生鎖死，不敢做決定。",
              resultTitle: "把風險寫成『緩衝』",
              resultBody:
                "先訂緊急預備金與保守情境（年化降低/支出上升），看『最差情境』你能不能撐住。能撐住，你才有談判權。",
            },
            {
              id: "peer-pressure",
              label: "我不是非買不可，但會被同儕/家人壓力逼著走。",
              resultTitle: "用同一套數字溝通",
              resultBody:
                "把目標改成『稅後月現金流』，用情境對照：買/不買/晚買，達標年期差多少。你不是在辯論，你是在對帳。",
            },
          ]}
        />

        <h2>最常見的錯誤：只算收入，不算扣完後的可投入</h2>
        <p className={styles.grafTight}>
          你以為你每月能存下 X，但稅、健保、手續費與生活成本會把 X 變成另一個數字。差異一拉長，就會變成「買得起/買不起」的分水嶺。
        </p>

        <h2>你可以從這三步開始</h2>
        <ul>
          <li>先把目標寫成「月現金流」：你需要的不是房子，是更穩的生活。</li>
          <li>把每期扣除攤開：稅、二代健保、手續費。</li>
          <li>用保守情境跑一次：別只看最樂觀版本。</li>
        </ul>

        <Link id={WF_BLOG_CALCULATOR_CTA_ID} href="/" className={styles.cta} target="_blank" rel="noopener noreferrer">
          前往財富自由計算機（另開分頁）→
        </Link>

        <div className={styles.disclaimer}>
          <p>
            <strong>免責聲明：</strong>本文為一般性資訊分享，不構成投資、稅務或法律建議；買房決策需綜合家庭、貸款與風險承受度。
          </p>
        </div>
      </div>

      <ArticlePublishStamp publishAtIso={entry.publishAtIso} />
    </article>
  );
}

export default function Painpoint9() {
  if (!isBlogPostPublished(entry.publishAtIso)) {
    return <BlogScheduledPlaceholder publishAtIso={entry.publishAtIso} />;
  }
  return <Painpoint9Published />;
}

