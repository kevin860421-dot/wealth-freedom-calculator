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

const SLUG = "painpoint-12-stop-playing-pretend" as const;
const _registryEntry = getBlogPostBySlug(SLUG);
if (!_registryEntry) {
  throw new Error(`[blog] registry 缺少 slug：${SLUG}（請編輯 app/blog/posts/registry.ts）`);
}
const entry: BlogPostRegistryEntry = _registryEntry;

const ARTICLE_PATH = blogPostPath(SLUG);

const publishedArticleMetadata: Metadata = {
  title: "痛點短評（17）｜別再假裝沒事｜財富自由計算機",
  description:
    "焦慮不是問題；不敢面對數字才是。把風險攤開、把每期扣除攤開，你才有選擇權。僅供參考。",
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

function Painpoint12Published() {
  return (
    <article className={styles.wrap}>
      <div className={styles.postMetaRow}>
        <Link href="/blog" className={styles.back}>
          ← 部落格列表
        </Link>
        <span className={styles.seriesPill}>部落格｜痛點短評 · 17</span>
      </div>
      <h1 className={styles.title}>別再假裝「沒事」</h1>
      <p className={styles.subtitle}>
        你不用每天焦慮，但你也不該每天逃避。真正的安全感，來自你知道「自己扛得住什麼」。
      </p>

      <PainpointHero
        no={17}
        title="別再假裝「沒事」"
        subtitle="你不用每天焦慮，但你也不該每天逃避。把不確定拆成清單，你才有選擇權。"
      />

      <div className={styles.article}>
        <h2>焦慮其實在提醒你：有一段風險你沒看見</h2>
        <p className={styles.grafTight}>
          買不起房、勞保、失業、通膨——你不需要把它們全部解決，你需要的是把它們拆開，變成可以被處理的清單。
        </p>

        <PainpointInteractiveCard
          title="互動：你最常用哪一種『假裝沒事』？"
          prompt="選一個最像你。你會知道自己真正逃避的是什麼。"
          choices={[
            {
              id: "busy",
              label: "我很忙，等有空再算。",
              resultTitle: "你不是忙，是不想看到真相",
              resultBody:
                "把試算縮成 10 分鐘：先填目標（稅後月領）與每期投入，先得到年期區間；有區間，就有行動。",
            },
            {
              id: "optimistic",
              label: "反正長期會漲，之後自然會好。",
              resultTitle: "長期會好，但你要撐得住波動",
              resultBody:
                "把每期扣除與生活支出攤開，確認緩衝厚度。撐不住時，長期報酬率對你沒有意義。",
            },
            {
              id: "numbers-hate",
              label: "我不喜歡數字，算了更焦慮。",
              resultTitle: "焦慮來自『不確定』，不是數字",
              resultBody:
                "你不需要精準，只需要區間。用保守/中性兩版做對照，焦慮會從情緒變成選項。",
            },
          ]}
        />

        <h2>把「不確定」拆成三個可控項</h2>
        <ul>
          <li>
            <strong>現金流：</strong>你每期真正能再投入多少（扣完稅/健保/手續費後）。
          </li>
          <li>
            <strong>時間：</strong>你是否能接受達標往後移幾年。
          </li>
          <li>
            <strong>選項：</strong>收入來源、支出彈性、緩衝資金。
          </li>
        </ul>

        <h2>你只要做一件事：把每期扣除攤開</h2>
        <p className={styles.grafTight}>
          多數人的盲點不是不努力，而是只看期末資產。當你把每期扣除攤開，焦慮會變成「下一步要做什麼」。
        </p>

        <Link id={WF_BLOG_CALCULATOR_CTA_ID} href="/" className={styles.cta} target="_blank" rel="noopener noreferrer">
          前往財富自由計算機（另開分頁）→
        </Link>

        <div className={styles.disclaimer}>
          <p>
            <strong>免責聲明：</strong>本文為一般性資訊分享，不構成投資、稅務或法律建議；請依個人狀況評估風險承受度與規劃。
          </p>
        </div>
      </div>

      <ArticlePublishStamp publishAtIso={entry.publishAtIso} />
    </article>
  );
}

export default function Painpoint12() {
  if (!isBlogPostPublished(entry.publishAtIso)) {
    return <BlogScheduledPlaceholder publishAtIso={entry.publishAtIso} />;
  }
  return <Painpoint12Published />;
}

