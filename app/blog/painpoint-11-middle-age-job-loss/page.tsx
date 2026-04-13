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

const SLUG = "painpoint-11-middle-age-job-loss" as const;
const _registryEntry = getBlogPostBySlug(SLUG);
if (!_registryEntry) {
  throw new Error(`[blog] registry 缺少 slug：${SLUG}（請編輯 app/blog/posts/registry.ts）`);
}
const entry: BlogPostRegistryEntry = _registryEntry;

const ARTICLE_PATH = blogPostPath(SLUG);

const publishedArticleMetadata: Metadata = {
  title: "痛點短評（16）｜中年失業最殘酷的不是收入歸零｜財富自由計算機",
  description:
    "中年失業真正殘酷的是現金流中斷時，你才發現自己沒有可延展的備案。用稅後現金流與每期扣除，把『可撐多久』算清楚。僅供參考。",
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

function Painpoint11Published() {
  return (
    <article className={styles.wrap}>
      <div className={styles.postMetaRow}>
        <Link href="/blog" className={styles.back}>
          ← 部落格列表
        </Link>
        <span className={styles.seriesPill}>部落格｜痛點短評 · 16</span>
      </div>
      <h1 className={styles.title}>中年失業最殘酷的不是收入歸零</h1>
      <p className={styles.subtitle}>
        是你突然發現：你以為自己在累積資產，但其實你沒有建立「可延展的現金流」。
      </p>

      <PainpointHero
        no={16}
        title="中年失業最殘酷的不是收入歸零"
        subtitle="殘酷的是現金流斷掉時，你才知道自己沒有備案。先把『可撐多久』算成月份，不要靠勇氣。"
      />

      <div className={styles.article}>
        <h2>你需要的不只是資產，是能撐住變動的結構</h2>
        <p className={styles.grafTight}>
          失業不是結束，而是讓你被迫重新定價你的時間。如果你只有一條收入來源，失業就會把你的投資與生活一起扯下來。
        </p>

        <PainpointInteractiveCard
          title="互動：你最缺的是哪一種『備案』？"
          prompt="先選一個最像你。"
          choices={[
            {
              id: "cash",
              label: "我缺的是現金：我怕撐不到下一份工作。",
              resultTitle: "先做『可撐多久』的算式",
              resultBody:
                "把固定支出、可動用資金、每期扣除攤開，用『月』來算緩衝，而不是用感覺喊『我應該撐得住』。",
            },
            {
              id: "income",
              label: "我缺的是收入來源：太依賴單一薪水。",
              resultTitle: "把收入拆成兩條線",
              resultBody:
                "一條是必需現金流（先活下來），一條是長期資產（慢慢長大）。先把兩條線分開，你才不會用投資去補急迫現金流。",
            },
            {
              id: "plan",
              label: "我缺的是計畫：我不知道下一步怎麼走。",
              resultTitle: "先用兩個情境把路線定出來",
              resultBody:
                "跑保守/中性兩版，看看達標年期差多少。當你看到差距，你就知道該補投入、補年期，還是調目標。",
            },
          ]}
        />

        <h2>先把問題縮小：你能撐多久？</h2>
        <ul>
          <li>把固定支出寫下來（不要用「大概」）。</li>
          <li>把可動用資金寫下來（不要把長期配置硬當現金）。</li>
          <li>把稅、健保、手續費這些「每期扣除」算進去。</li>
        </ul>

        <h2>把稅後現金流放回時間軸，焦慮就會變小</h2>
        <p className={styles.grafTight}>
          很多人焦慮，是因為用稅前的幻想去規劃稅後的人生。當你把每期扣除攤開，你會更清楚自己是在「哪一年」開始需要備案。
        </p>

        <Link id={WF_BLOG_CALCULATOR_CTA_ID} href="/" className={styles.cta} target="_blank" rel="noopener noreferrer">
          前往財富自由計算機（另開分頁）→
        </Link>

        <div className={styles.disclaimer}>
          <p>
            <strong>免責聲明：</strong>本文為一般性資訊分享，不構成投資、稅務或法律建議；失業與家庭財務規劃請依個人狀況審慎評估。
          </p>
        </div>
      </div>

      <ArticlePublishStamp publishAtIso={entry.publishAtIso} />
    </article>
  );
}

export default function Painpoint11() {
  if (!isBlogPostPublished(entry.publishAtIso)) {
    return <BlogScheduledPlaceholder publishAtIso={entry.publishAtIso} />;
  }
  return <Painpoint11Published />;
}

