"use client";

import { useState, type ReactNode } from "react";
import expandStyles from "./home-footer-expand.module.css";
import { useMobileHomeLayout } from "./use-mobile-home-layout";

type Props = {
  expandLabel: string;
  collapseLabel: string;
  tone?: "default" | "gold";
  children: ReactNode;
};

/**
 * 手機：標題＋摘要下方顯示展開按鈕；桌機一律完整展開。
 * 內容保留在 DOM（SEO／螢幕助讀）。
 */
export function HomeFooterMobileExpand({
  expandLabel,
  collapseLabel,
  tone = "default",
  children,
}: Props) {
  const mobileLayout = useMobileHomeLayout();
  const [expanded, setExpanded] = useState(false);
  const isOpen = !mobileLayout || expanded;
  const btnClass =
    tone === "gold" ? `${expandStyles.expandBtn} ${expandStyles.expandBtnGold}` : expandStyles.expandBtn;

  return (
    <>
      {mobileLayout ? (
        <button
          type="button"
          className={btnClass}
          aria-expanded={expanded}
          onClick={() => setExpanded((o) => !o)}
        >
          {expanded ? collapseLabel : expandLabel}
        </button>
      ) : null}
      <div
        className={`${expandStyles.collapsePanel} ${isOpen ? expandStyles.collapsePanelOpen : ""}`}
        aria-hidden={mobileLayout && !expanded}
      >
        <div className={expandStyles.collapseInner}>{children}</div>
      </div>
    </>
  );
}
