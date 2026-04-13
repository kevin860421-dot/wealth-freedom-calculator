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

const SLUG = "painpoint-8-inflation-is-silent-tax" as const;
const _registryEntry = getBlogPostBySlug(SLUG);
if (!_registryEntry) {
  throw new Error(`[blog] registry 缺少 slug：${SLUG}（請編輯 app/blog/posts/registry.ts）`);
}
const entry: BlogPostRegistryEntry = _registryEntry;

const ARTICLE_PATH = blogPostPath(SLUG);

const publishedArticleMetadata: Metadata = {
  title: "痛點短評（13）｜通膨是最安靜的稅｜財富自由計算機",
  description:
    "你以為你存得很穩，其實購買力在慢慢掉。通膨像安靜的稅，讓『同一個目標』越來越貴。把目標放回時間軸試算才看得見。僅供參考。",
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

function Painpoint8Published() {
  return (
    <article className={styles.wrap}>
      <div className={styles.postMetaRow}>
        <Link href="/blog" className={styles.back}>
          ← 部落格列表
        </Link>
        <span className={styles.seriesPill}>部落格｜痛點短評 · 13</span>
      </div>
      <h1 className={styles.title}>通膨是最安靜的稅</h1>
      <p className={styles.subtitle}>
        你會覺得越存越焦慮，很多時候不是你不努力，而是你拿「過去的物價」在追「未來的生活」。
      </p>

      <PainpointHero
        no={13}
        title="通膨是最安靜的稅"
        subtitle="你追的不是固定數字，是未來的生活。名目不變、購買力會掉，目標就會越來越貴。"
      />

      <div className={styles.article}>
        <h2>同一個目標，會越來越貴</h2>
        <p className={styles.grafTight}>
          月領 50,000 的目標，看起來很直覺。但如果你用今天的數字去想 10 年後的生活，你其實是在用「錯的尺」量未來。
        </p>

        <PainpointInteractiveCard
          title="互動：你的目標是『名目』還是『購買力』？"
          prompt="選一個你現在最常用的想法。"
          choices={[
            {
              id: "nominal",
              label: "我只想一個固定數字（例如月領 50,000）。",
              resultTitle: "把目標改成『購買力版本』",
              resultBody:
                "同一個名目數字，未來買到的東西會變少。先做一個保守情境，把目標拉成區間，才不會越走越焦慮。",
            },
            {
              id: "real",
              label: "我在意的是生活品質（買菜、房租、孩子教育）。",
              resultTitle: "你已經在做對的事了",
              resultBody:
                "把生活品質拆成幾個主要支出項目，丟進試算的『每期須扣除』與現金流，你會更清楚該補的是投入還是年期。",
            },
            {
              id: "dont-know",
              label: "我不知道要怎麼算，只能靠感覺。",
              resultTitle: "先用『兩個版本』就夠",
              resultBody:
                "先跑一版不含通膨、一版保守含通膨（或提高目標），比較達標年期差多少。看懂差距，比精準更重要。",
            },
          ]}
        />

        <h2>焦慮的來源：你只看資產，沒看購買力</h2>
        <p className={styles.grafTight}>
          很多人把「資產變大」當成安全感來源，但真正的安全感是：扣完稅費後，你的現金流能不能撐住生活成本的上升。
        </p>

        <h2>把通膨放回試算：你才知道要補哪一塊</h2>
        <ul>
          <li>把目標拆成「現在想過的生活」與「未來需要的數字」。</li>
          <li>把稅、二代健保、手續費放進每期扣除。</li>
          <li>用保守情境跑一次，不要只看最樂觀版本。</li>
        </ul>

        <Link id={WF_BLOG_CALCULATOR_CTA_ID} href="/" className={styles.cta} target="_blank" rel="noopener noreferrer">
          前往財富自由計算機（另開分頁）→
        </Link>

        <div className={styles.disclaimer}>
          <p>
            <strong>免責聲明：</strong>本文為一般性資訊分享，不構成投資、稅務或法律建議；通膨與報酬為情境假設，請依個人狀況調整。
          </p>
        </div>
      </div>

      <ArticlePublishStamp publishAtIso={entry.publishAtIso} />
    </article>
  );
}

export default function Painpoint8() {
  if (!isBlogPostPublished(entry.publishAtIso)) {
    return <BlogScheduledPlaceholder publishAtIso={entry.publishAtIso} />;
  }
  return <Painpoint8Published />;
}

