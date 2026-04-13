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

const SLUG = "painpoint-7-no-buffer-is-real-risk" as const;
const _registryEntry = getBlogPostBySlug(SLUG);
if (!_registryEntry) {
  throw new Error(`[blog] registry 缺少 slug：${SLUG}（請編輯 app/blog/posts/registry.ts）`);
}
const entry: BlogPostRegistryEntry = _registryEntry;

const ARTICLE_PATH = blogPostPath(SLUG);

const publishedArticleMetadata: Metadata = {
  title: "痛點短評（12）｜真正的風險不是下跌，是你沒有緩衝｜財富自由計算機",
  description:
    "真正把人擊倒的不是市場波動，而是現金流沒有緩衝，讓你被迫在最差時點做決策。用時間軸把每期扣除攤開，才知道緩衝要多大。僅供參考。",
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

function Painpoint7Published() {
  return (
    <article className={styles.wrap}>
      <div className={styles.postMetaRow}>
        <Link href="/blog" className={styles.back}>
          ← 部落格列表
        </Link>
        <span className={styles.seriesPill}>部落格｜痛點短評 · 12</span>
      </div>
      <h1 className={styles.title}>真正的風險不是下跌，是你沒有緩衝</h1>
      <p className={styles.subtitle}>
        中年失業、家人生病、房租上漲……它們不一定會發生，但一旦發生，沒有緩衝的人只能被迫「賣在最差的時候」。
      </p>

      <PainpointHero
        no={12}
        title="真正的風險不是下跌，是你沒有緩衝"
        subtitle="市場波動不可怕；可怕的是你被迫在最差時點做決策。緩衝要用『月份』來算，不要用感覺。"
      />

      <div className={styles.article}>
        <h2>緩衝不是存款多寡，是「你能撐多久」</h2>
        <p className={styles.grafTight}>
          你可以把緩衝想成一種能力：當收入中斷時，你能不能讓投資規劃不被迫變形。
        </p>
        <p className={styles.grafTight}>
          真實世界會扣掉很多東西：稅、健保、手續費、生活支出。你若只用「稅前」想像現金流，緩衝會被高估。
        </p>

        <PainpointInteractiveCard
          title="互動：你最怕哪種『被迫賣出』？"
          prompt="選一個最有感的情境。你會更清楚緩衝要放在哪裡。"
          choices={[
            {
              id: "job-loss",
              label: "收入突然少一半，撐不住生活費。",
              resultTitle: "把緩衝寫成『月份』",
              resultBody:
                "先訂一個能撐 6～12 個月的現金流緩衝，再去談投資配置；不然下跌時你會被迫賣在最差時點。",
            },
            {
              id: "family-health",
              label: "家人生病，支出暴增、時間也被吃掉。",
              resultTitle: "緩衝不只錢，還有時間",
              resultBody:
                "把『每期須扣除』與生活支出攤開，預留一段「不用賣資產也能活」的時間，家裡才不會因事故做出最差決策。",
            },
            {
              id: "rent-up",
              label: "房租/房貸上升，固定支出卡死。",
              resultTitle: "先救現金流，再談報酬率",
              resultBody:
                "固定支出一旦卡死，你的投資彈性就沒了。先用保守情境跑一次，確保每期扣除後仍有餘裕。",
            },
          ]}
        />

        <h2>最簡單的做法：把「每期扣除」攤開</h2>
        <ul>
          <li>不要只看期末總資產。</li>
          <li>把每期須扣除（稅/二代健保/手續費）攤開，緩衝才算得出來。</li>
          <li>用保守情境跑一次：年化降低、股息降低、支出上升。</li>
        </ul>

        <Link id={WF_BLOG_CALCULATOR_CTA_ID} href="/" className={styles.cta} target="_blank" rel="noopener noreferrer">
          前往財富自由計算機（另開分頁）→
        </Link>

        <div className={styles.disclaimer}>
          <p>
            <strong>免責聲明：</strong>本文為一般性資訊分享，不構成投資、稅務或法律建議；請依個人狀況評估風險承受度與緊急預備金。
          </p>
        </div>
      </div>

      <ArticlePublishStamp publishAtIso={entry.publishAtIso} />
    </article>
  );
}

export default function Painpoint7() {
  if (!isBlogPostPublished(entry.publishAtIso)) {
    return <BlogScheduledPlaceholder publishAtIso={entry.publishAtIso} />;
  }
  return <Painpoint7Published />;
}

