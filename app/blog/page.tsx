import type { Metadata } from "next";
import Link from "next/link";
import styles from "./blog.module.css";

export const metadata: Metadata = {
  title: "部落格｜財富自由計算機",
  description:
    "存股、股利課稅、財富自由與被動收入相關文章。資訊僅供參考，不構成投資或稅務建議。",
};

export default function BlogIndexPage() {
  return (
    <div className={styles.wrap}>
      <Link href="/" className={styles.back} target="_blank" rel="noopener noreferrer">
        ← 回到財富自由計算機（另開分頁）
      </Link>
      <h1 className={styles.title}>部落格</h1>
      <p className={styles.subtitle}>用數據聊被動收入、稅負與長期規劃。</p>
      <ul className={styles.listIndex}>
        <li>
          <Link href="/blog/2026-dividend-tax-guide" style={{ color: "var(--morandi-accent, #c4b5a3)", fontSize: "1rem" }}>
            存股節稅（1）｜2026 股利抵減 8.5% 與實拿
          </Link>
          <p style={{ margin: "0.35rem 0 0", fontSize: "0.875rem", color: "var(--morandi-text-soft, #b8aea4)" }}>
            股利課稅、合併課稅與分離課稅、二代健保與實拿試算觀念。
          </p>
        </li>
      </ul>
    </div>
  );
}
