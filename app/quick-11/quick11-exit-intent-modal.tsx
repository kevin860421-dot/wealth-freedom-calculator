"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { QUICK11_EXCEL_UNLOCK_CODE, QUICK11_EXIT_INTENT_MIN_DWELL_MS } from "@/lib/quick11-marketing";
import { copyQuick11UnlockAndOpenFb, copyQuick11UnlockCode } from "./quick11-excel-actions";
import styles from "./quick11-exit-intent-modal.module.css";

const STORAGE_KEY = "quick11-exit-intent-v3";

type Quick11ExitIntentModalProps = {
  enabled?: boolean;
  /** 預覽頁：進站即顯示、不寫 session、可反覆打開 */
  previewMode?: boolean;
};

const FEATURES = [
  {
    icon: "🧮",
    iconBg: "bg-sky-500/25 ring-1 ring-sky-400/30",
    title: "DTI 試算表",
    desc: "掌握負債比狀況",
  },
  {
    icon: "📊",
    iconBg: "bg-emerald-500/25 ring-1 ring-emerald-400/30",
    title: "ETF 月配息表",
    desc: "計算每月現金流",
  },
  {
    icon: "💰",
    iconBg: "bg-violet-500/25 ring-1 ring-violet-400/30",
    title: "股利試算表",
    desc: "估算年領股利",
  },
] as const;

const TRUST_BADGES = [
  { icon: "🛡️", title: "100% 免費", desc: "完全免費，無需付費" },
  { icon: "🔒", title: "安全無風險", desc: "不需提供個資" },
  { icon: "📥", title: "可重複使用", desc: "永久保存，隨時可用" },
] as const;

function hasSeenExitIntent(): boolean {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function markExitIntentSeen(): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, "1");
  } catch {}
}

export function Quick11ExitIntentModal({ enabled = true, previewMode = false }: Quick11ExitIntentModalProps) {
  const [open, setOpen] = useState(previewMode);
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");
  const enteredAtRef = useRef<number>(Date.now());
  const historyArmedRef = useRef(false);
  const openedRef = useRef(false);

  const dismiss = useCallback(() => {
    setOpen(false);
    if (!previewMode) markExitIntentSeen();
  }, [previewMode]);

  const openModal = useCallback(async () => {
    setOpen(true);
    const copied = await copyQuick11UnlockCode();
    setCopyState(copied ? "copied" : "idle");
  }, []);

  const tryOpen = useCallback(async () => {
    if (previewMode) return;
    if (!enabled || hasSeenExitIntent() || openedRef.current) return;
    if (Date.now() - enteredAtRef.current < QUICK11_EXIT_INTENT_MIN_DWELL_MS) return;

    openedRef.current = true;
    markExitIntentSeen();
    await openModal();
  }, [enabled, openModal, previewMode]);

  useEffect(() => {
    if (previewMode) {
      void openModal();
      return;
    }
    if (!enabled || hasSeenExitIntent()) return;

    enteredAtRef.current = Date.now();

    const armHistory = () => {
      if (historyArmedRef.current || hasSeenExitIntent()) return;
      historyArmedRef.current = true;
      window.history.pushState({ quick11Exit: true }, "");
    };

    const dwellTimer = window.setTimeout(() => {
      armHistory();
      void tryOpen();
    }, QUICK11_EXIT_INTENT_MIN_DWELL_MS);

    const onMouseLeave = (e: MouseEvent) => {
      if (e.clientY > 12) return;
      void tryOpen();
    };

    const onPopState = () => {
      if (Date.now() - enteredAtRef.current < QUICK11_EXIT_INTENT_MIN_DWELL_MS) return;
      void tryOpen();
      if (!hasSeenExitIntent()) {
        window.history.pushState({ quick11Exit: true }, "");
      }
    };

    document.addEventListener("mouseleave", onMouseLeave);
    window.addEventListener("popstate", onPopState);

    return () => {
      window.clearTimeout(dwellTimer);
      document.removeEventListener("mouseleave", onMouseLeave);
      window.removeEventListener("popstate", onPopState);
    };
  }, [enabled, tryOpen, previewMode, openModal]);

  const onClaimExcel = useCallback(async () => {
    const copied = await copyQuick11UnlockAndOpenFb();
    if (copied) setCopyState("copied");
    dismiss();
  }, [dismiss]);

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            aria-label="關閉"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] bg-black/82 backdrop-blur-[3px]"
            onClick={dismiss}
          />
          <div className="pointer-events-none fixed inset-0 z-[81] flex items-center justify-center p-3 sm:p-4">
            <motion.div
              role="dialog"
              aria-modal
              aria-labelledby="quick11-exit-title"
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ duration: 0.24 }}
              className={`${styles.shell} ${styles.panel} pointer-events-auto rounded-2xl border border-slate-600/80 bg-[#161b22] text-slate-100 shadow-[0_24px_80px_rgba(0,0,0,0.6)]`}
            >
              <button
                type="button"
                aria-label="關閉視窗"
                onClick={dismiss}
                className="sticky top-0 z-10 ml-auto mr-2 mt-2 flex h-9 w-9 items-center justify-center rounded-full bg-slate-800/90 text-xl leading-none text-slate-300 transition hover:bg-slate-700 hover:text-white"
              >
                ×
              </button>

              <div className="px-4 pb-5 pt-0 sm:px-5">
                <p className="text-center text-[13px] font-bold tracking-wide text-[#ff7b7b]">⏰ 限時開放 · 24 小時內有效</p>

                <h2
                  id="quick11-exit-title"
                  className="mt-2.5 text-balance text-center text-[20px] font-black leading-snug text-white sm:text-[23px]"
                >
                  免費取得【退休試算 Excel】
                </h2>
                <p className={`${styles.subtitle} mt-2 text-center text-[13px] leading-relaxed sm:text-[14px]`}>
                  搜尋排名每天都在變，今天不領，明天可能就找不到了。
                </p>

                <p className={`${styles.sectionTitle} mt-4 text-[14px] font-bold sm:text-[15px]`}>這份 Excel 能幫你：</p>
                <div className="mt-2.5 grid grid-cols-3 gap-1.5 sm:gap-2">
                  {FEATURES.map((item) => (
                    <div key={item.title} className="min-w-0 px-0.5 text-center">
                      <div
                        className={`mx-auto flex h-10 w-10 items-center justify-center rounded-xl text-[20px] sm:h-11 sm:w-11 sm:text-[22px] ${item.iconBg}`}
                        aria-hidden
                      >
                        {item.icon}
                      </div>
                      <p className="mt-1.5 text-[11px] font-black leading-snug text-white sm:text-[12px]">{item.title}</p>
                      <p className={`${styles.featureDesc} mt-0.5 text-[11px] leading-snug sm:text-[12px]`}>{item.desc}</p>
                    </div>
                  ))}
                </div>

                <p className={`${styles.subtitle} mt-3.5 text-center text-[13px] leading-relaxed sm:text-[14px]`}>
                  我自己每天都在用的工具，現在
                  <span className="font-black text-[#fde047]">免費</span>
                  分享給你！
                </p>

                <div className="mt-3.5 rounded-xl border border-slate-600/90 bg-[#1c2430] px-3 py-3.5 sm:px-4 sm:py-4">
                  <p className="flex items-center justify-center gap-1.5 text-[13px] font-bold text-slate-200">
                    <span aria-hidden>🔑</span>
                    解鎖碼
                  </p>
                  <p
                    className={`${styles.code} mt-1.5 text-center text-[30px] font-black tracking-wide text-[#fde047] sm:text-[36px]`}
                  >
                    {QUICK11_EXCEL_UNLOCK_CODE}
                  </p>
                  {copyState === "copied" ? (
                    <p className="mt-2 flex items-center justify-center gap-1 text-[12px] font-semibold text-[#4ade80] sm:text-[13px]">
                      <span aria-hidden>✅</span>
                      已自動複製到剪貼簿
                    </p>
                  ) : (
                    <p className={`${styles.hint} mt-2 text-center text-[12px] sm:text-[13px]`}>彈窗開啟時會自動複製解鎖碼</p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => void onClaimExcel()}
                  className="mt-3.5 min-h-[50px] w-full rounded-xl bg-gradient-to-r from-[#38bdf8] to-[#2563eb] px-3 py-3 text-[15px] font-black text-white shadow-[0_0_20px_rgba(56,189,248,0.35)] transition hover:from-[#7dd3fc] hover:to-[#3b82f6] active:scale-[0.99] sm:text-[16px]"
                >
                  🎁 立即領取 Excel &gt;
                </button>

                <p className={`${styles.hint} mt-2.5 flex items-start justify-center gap-1.5 text-center text-[12px] leading-relaxed sm:text-[13px]`}>
                  <span className="mt-0.5 shrink-0" aria-hidden>
                    🛡️
                  </span>
                  <span>前往粉絲專頁輸入解鎖碼，即可免費取得</span>
                </p>

                <div className="mt-4 grid grid-cols-3 gap-1.5 border-t border-slate-700/80 pt-3.5 sm:gap-2 sm:pt-4">
                  {TRUST_BADGES.map((badge) => (
                    <div key={badge.title} className="min-w-0 text-center">
                      <p className="text-[17px] sm:text-[18px]" aria-hidden>
                        {badge.icon}
                      </p>
                      <p className="mt-1 text-[11px] font-black leading-tight text-white sm:text-[12px]">{badge.title}</p>
                      <p className={`${styles.trustDesc} mt-0.5 text-[10px] leading-snug sm:text-[11px]`}>{badge.desc}</p>
                    </div>
                  ))}
                </div>

                <p className={`${styles.footerNote} mt-3.5 text-center text-[12px] leading-relaxed sm:text-[13px]`}>
                  <span aria-hidden>❤️ </span>
                  希望這份工具，能幫助你更快達成財富自由！
                </p>
              </div>
            </motion.div>
          </div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
