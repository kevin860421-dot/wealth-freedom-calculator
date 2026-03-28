"use client";

import { useEffect } from "react";

/**
 * 僅在 production 註冊 SW，避免 dev 熱重載與快取打架。
 * localhost 仍會註冊，方便本機驗證 PWA 安裝提示。
 */
export function PwaServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production" && window.location.hostname !== "localhost") return;

    const register = () => {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
        /* 靜默失敗：無 SW 時仍可用手動「加入主畫面」說明 */
      });
    };

    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
  }, []);

  return null;
}
