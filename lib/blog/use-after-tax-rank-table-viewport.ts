"use client";

import { useCallback, useEffect, useState } from "react";

export const AFTER_TAX_RANK_TABLE_MOBILE_MAX_PX = 768;

function readIsMobileLayout(shell: HTMLElement | null): boolean {
  if (typeof window === "undefined") return false;
  const viewportNarrow = window.innerWidth <= AFTER_TAX_RANK_TABLE_MOBILE_MAX_PX;
  if (viewportNarrow) return true;
  if (!shell) return false;
  return shell.getBoundingClientRect().width <= AFTER_TAX_RANK_TABLE_MOBILE_MAX_PX;
}

/**
 * 回傳 [是否手機版, 掛在「不會被 max-content 表撐寬」的外殼上的 ref callback]。
 */
export function useAfterTaxRankTableIsMobile(): [
  boolean,
  (el: HTMLDivElement | null) => void,
] {
  const [shell, setShell] = useState<HTMLDivElement | null>(null);
  const [isMobile, setIsMobile] = useState(() => readIsMobileLayout(null));

  const shellRef = useCallback((el: HTMLDivElement | null) => {
    setShell(el);
    setIsMobile(readIsMobileLayout(el));
  }, []);

  useEffect(() => {
    if (!shell) return;

    const read = () => setIsMobile(readIsMobileLayout(shell));

    read();
    const ro = new ResizeObserver(read);
    ro.observe(shell);
    window.addEventListener("resize", read);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", read);
    };
  }, [shell]);

  return [isMobile, shellRef];
}
