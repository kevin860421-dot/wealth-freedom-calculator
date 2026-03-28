import Link from "next/link";
import { formatPublishLabel } from "./posts/registry";
import styles from "./blog.module.css";

type Props = {
  publishAtIso: string;
};

/**
 * 未到 publishAtIso 時顯示的「準備中」頁（各篇文章共用）。
 */
export function BlogScheduledPlaceholder({ publishAtIso }: Props) {
  const when = formatPublishLabel(publishAtIso);
  return (
    <article className={styles.wrap}>
      <div className={styles.postMetaRow}>
        <Link href="/blog" className={styles.back}>
          ← 部落格列表
        </Link>
      </div>
      <h1 className={styles.title}>文章準備中</h1>
      <p className={styles.subtitle}>
        本篇預計於 <strong>{when}</strong> 公開。時間到之後重新整理頁面即可閱讀全文。
      </p>
      <div className={styles.scheduledTeaser} role="note">
        <p className={styles.scheduledTeaserTitle}>等待期間可先試算</p>
        <p className={styles.scheduledTeaserBody}>
          回到首頁使用財富自由計算機，或到首頁下方「我的自選股」按「新增自選股」，先把代號與重點填上。
        </p>
      </div>
      <p style={{ marginTop: "1rem", fontSize: "0.95rem", color: "var(--morandi-text-soft, #b8aea4)" }}>
        <Link href="/" className={styles.cta} target="_blank" rel="noopener noreferrer">
          回到財富自由計算機（另開分頁）→
        </Link>
      </p>
    </article>
  );
}
