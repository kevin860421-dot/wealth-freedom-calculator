"use client";

import { useEffect, useState } from "react";
import styles from "./article-publish-stamp.module.css";

type Props = {
  /** ISO 8601，例：2026-03-15T09:00:00+08:00 */
  publishAtIso: string;
};

function formatZhTW(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/**
 * 固定在視窗右下角的發布／預計發布時間（依讀者裝置時間與 publishAt 比較）。
 */
export function ArticlePublishStamp({ publishAtIso }: Props) {
  const [line, setLine] = useState<string | null>(null);

  useEffect(() => {
    const target = new Date(publishAtIso);
    if (Number.isNaN(target.getTime())) {
      setLine(`發布時間設定有誤：${publishAtIso}`);
      return;
    }
    const now = new Date();
    const formatted = formatZhTW(publishAtIso);
    if (now < target) {
      setLine(`預計發布時間：${formatted}`);
    } else {
      setLine(`發布時間：${formatted}`);
    }
  }, [publishAtIso]);

  if (!line) {
    return (
      <div className={styles.stamp} aria-hidden>
        …
      </div>
    );
  }

  return (
    <div className={styles.stamp} role="status" aria-live="polite">
      <time dateTime={publishAtIso}>{line}</time>
    </div>
  );
}
