"use client";

import { useEffect } from "react";

/**
 * 僅在 production 註冊 SW，避免 dev 熱重載與快取打架。
 * localhost 仍會註冊，方便本機驗證 PWA 安裝提示。
 */
export function PwaServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    // 開發環境：不要註冊 SW（會讓你一直看到舊版快取）；若曾註冊過則主動解除。
    if (process.env.NODE_ENV !== "production") {
      void (async () => {
        try {
          const regs = await navigator.serviceWorker.getRegistrations();
          await Promise.all(regs.map((r) => r.unregister()));
          if ("caches" in window) {
            const keys = await caches.keys();
            await Promise.all(keys.map((k) => caches.delete(k)));
          }
        } catch {
          /* ignore */
        }
      })();
      return;
    }

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
