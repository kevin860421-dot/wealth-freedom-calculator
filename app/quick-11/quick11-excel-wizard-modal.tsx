"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { captureElementToJpegDataUrl } from "@/app/capture-element-screenshot";
import {
  QUICK11_EXCEL_DISPLAY_NAME,
  QUICK11_EXCEL_FB_KEYWORDS,
  QUICK11_EXCEL_UNLOCK_CODE,
  isQuick11FbMessengerConfigured,
} from "@/lib/quick11-marketing";
import { copyQuick11UnlockCode, openQuick11FbMessenger } from "./quick11-excel-actions";
import styles from "./quick11-excel-wizard-modal.module.css";
import { readQuick11WizardSnapshot, saveQuick11WizardSnapshot } from "./quick11-share-snapshot";
import {
  completeQuick11WizardCopy,
  completeQuick11WizardFb,
  completeQuick11WizardScreenshot,
  completeQuick11WizardShare,
  isQuick11WizardStepDone,
  isQuick11WizardStepEnabled,
  useQuick11WizardProgress,
} from "./quick11-wizard-state";

type Quick11ExcelWizardModalProps = {
  open: boolean;
  onClose: () => void;
  snapshotRef: RefObject<HTMLDivElement | null>;
};

const STEPS = [
  { n: 1 as const, label: "截圖" },
  { n: 2 as const, label: "分享" },
  { n: 3 as const, label: "密碼" },
  { n: 4 as const, label: "粉專" },
] as const;

const FEATURES = [
  { icon: "🧮", iconBg: "bg-sky-500/25 ring-1 ring-sky-400/30", title: "DTI 試算表", desc: "掌握負債比狀況" },
  { icon: "📊", iconBg: "bg-emerald-500/25 ring-1 ring-emerald-400/30", title: "ETF 月配息表", desc: "計算每月現金流" },
  { icon: "💰", iconBg: "bg-violet-500/25 ring-1 ring-violet-400/30", title: "股利試算表", desc: "估算年領股利" },
] as const;

const TRUST_BADGES = [
  { icon: "🛡️", title: "100% 免費", desc: "完全免費，無需付費" },
  { icon: "🔒", title: "安全無風險", desc: "不需提供個資" },
  { icon: "📥", title: "可重複使用", desc: "永久保存，隨時可用" },
] as const;

async function shareSnapshotFile(dataUrl: string): Promise<void> {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  const file = new File([blob], `quick11-dti-${new Date().toISOString().slice(0, 10)}.jpg`, { type: "image/jpeg" });
  const nav = navigator as Navigator & {
    share?: (data: ShareData) => Promise<void>;
    canShare?: (data?: ShareData) => boolean;
  };

  if (typeof nav.share === "function" && typeof nav.canShare === "function" && nav.canShare({ files: [file] })) {
    await nav.share({
      files: [file],
      title: "破產計算機試算結果",
      text: "信貸房貸壓力測試與 DTI 破產預警（我的財富自由計算機）",
    });
    return;
  }

  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = file.name;
  a.click();
}

function stepDotClasses(step: 1 | 2 | 3 | 4, progress: ReturnType<typeof useQuick11WizardProgress>["progress"]): string {
  const base = `${styles.stepDot} flex h-8 w-8 items-center justify-center rounded-full text-[12px] font-black sm:h-9 sm:w-9 sm:text-[13px]`;
  if (isQuick11WizardStepDone(step, progress)) return `${base} ${styles.stepDotDone}`;
  if (progress.activeStep === step) return `${base} ${styles.stepDotActive}`;
  return `${base} ${styles.stepDotLocked}`;
}

function stepRowClass(step: 1 | 2 | 3 | 4, progress: ReturnType<typeof useQuick11WizardProgress>["progress"]): string {
  if (isQuick11WizardStepDone(step, progress)) return `${styles.stepRow} ${styles.stepRowDone} rounded-xl p-3`;
  if (progress.activeStep === step) return `${styles.stepRow} ${styles.stepRowActive} rounded-xl p-3`;
  return `${styles.stepRow} rounded-xl p-3 opacity-75`;
}

export function Quick11ExcelWizardModal({ open, onClose, snapshotRef }: Quick11ExcelWizardModalProps) {
  const { progress, refresh } = useQuick11WizardProgress();
  const [busy, setBusy] = useState<null | 1 | 2 | 3 | 4>(null);
  const [snapshotPreview, setSnapshotPreview] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [copyFlash, setCopyFlash] = useState(false);
  const sharePendingRef = useRef(false);
  const fbReady = isQuick11FbMessengerConfigured();

  useEffect(() => {
    if (!open) {
      setPreviewOpen(false);
      return;
    }
    refresh();
    const saved = readQuick11WizardSnapshot();
    if (saved) setSnapshotPreview(saved);
  }, [open, refresh]);

  useEffect(() => {
    if (!open) return;
    const onVis = () => {
      if (document.visibilityState !== "visible" || !sharePendingRef.current) return;
      sharePendingRef.current = false;
      completeQuick11WizardShare();
      refresh();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [open, refresh]);

  const onScreenshot = useCallback(async () => {
    const el = snapshotRef.current;
    if (!el || busy) return;
    setBusy(1);
    try {
      const dataUrl = await captureElementToJpegDataUrl(el);
      if (!dataUrl) return;
      setSnapshotPreview(dataUrl);
      saveQuick11WizardSnapshot(dataUrl);
      completeQuick11WizardScreenshot();
      refresh();
    } finally {
      setBusy(null);
    }
  }, [snapshotRef, busy, refresh]);

  const onShare = useCallback(async () => {
    if (!snapshotPreview || busy || !isQuick11WizardStepEnabled(2, progress)) return;
    setBusy(2);
    sharePendingRef.current = true;
    try {
      await shareSnapshotFile(snapshotPreview);
    } catch {
      /* 無法偵測是否真分享；按過即完成 */
    } finally {
      sharePendingRef.current = false;
      completeQuick11WizardShare();
      refresh();
      setBusy(null);
    }
  }, [snapshotPreview, busy, progress, refresh]);

  const onCopyPassword = useCallback(async () => {
    if (!isQuick11WizardStepEnabled(3, progress) || busy) return;
    setBusy(3);
    const ok = await copyQuick11UnlockCode();
    if (ok) {
      setCopyFlash(true);
      completeQuick11WizardCopy();
      refresh();
      window.setTimeout(() => setCopyFlash(false), 1800);
    }
    setBusy(null);
  }, [progress, busy, refresh]);

  const onGoFanPage = useCallback(() => {
    if (!isQuick11WizardStepEnabled(4, progress) || busy) return;
    setBusy(4);
    openQuick11FbMessenger();
    completeQuick11WizardFb();
    refresh();
    setBusy(null);
  }, [progress, busy, refresh]);

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
            onClick={onClose}
          />
          <div className="pointer-events-none fixed inset-0 z-[81] flex items-center justify-center p-3 sm:p-4">
            <motion.div
              role="dialog"
              aria-modal
              aria-labelledby="quick11-wizard-title"
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ duration: 0.22 }}
              className={`${styles.shell} ${styles.panel} pointer-events-auto relative rounded-2xl border border-slate-600/80 bg-[#161b22] text-slate-100 shadow-[0_24px_80px_rgba(0,0,0,0.6)]`}
            >
              <button
                type="button"
                aria-label="關閉視窗"
                onClick={onClose}
                className="absolute right-2.5 top-2.5 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-slate-800/95 text-xl leading-none text-slate-200 transition hover:bg-slate-700 hover:text-white"
              >
                ×
              </button>

              <div className="px-4 pb-5 pt-4 sm:px-5">
                {/* 行銷頭部（對齊設計稿） */}
                <p className="pr-8 text-center text-[12px] font-bold text-[#ff7b7b] sm:text-[13px]">⏰ 限時開放 · 24 小時內有效</p>
                <h2 id="quick11-wizard-title" className="mt-2 text-balance text-center text-[19px] font-black leading-snug text-white sm:text-[22px]">
                  免費取得【{QUICK11_EXCEL_DISPLAY_NAME}】
                </h2>
                <p className={`${styles.muted} mt-2 text-center text-[12px] leading-relaxed sm:text-[13px]`}>
                  搜尋排名每天都在變，今天不領，明天可能就找不到了。
                </p>

                <p className={`${styles.sectionTitle} mt-4 text-[14px] font-bold sm:text-[15px]`}>這份 Excel 能幫你：</p>
                <div className="mt-2 grid grid-cols-3 gap-1.5 sm:gap-2">
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

                <p className={`${styles.muted} mt-3 text-center text-[13px] leading-relaxed`}>
                  我自己每天都在用的工具，現在
                  <span className="font-black text-[#fde047]">免費</span>
                  分享給你！
                </p>

                {/* 四步驟進度 */}
                <div className={`${styles.stepDivider} mt-4 pt-4`}>
                  <p className="text-center text-[13px] font-black text-sky-300">四步驟領取（完成一步，下一步亮起）</p>
                  <div className="mt-3 flex items-center justify-between gap-1 px-1">
                    {STEPS.map((s) => (
                      <div key={s.n} className="flex min-w-0 flex-1 flex-col items-center">
                        <div className={stepDotClasses(s.n, progress)}>{isQuick11WizardStepDone(s.n, progress) ? "✓" : s.n}</div>
                        <p className="mt-1 truncate text-[10px] font-bold text-slate-300 sm:text-[11px]">{s.label}</p>
                      </div>
                    ))}
                  </div>
                  <p className="mt-1.5 text-center text-[11px] font-semibold text-sky-300/90">步驟 {Math.min(progress.activeStep, 4)} / 4</p>
                </div>

                <div className="mt-3 space-y-2.5">
                  <div className={stepRowClass(1, progress)}>
                    <p className="text-[13px] font-black text-white">第一步：按下截圖</p>
                    <p className={`${styles.muted} mt-1 text-[12px] leading-relaxed`}>產生含 DTI、月付的試算圖，供下一步分享。</p>
                    {snapshotPreview ? (
                      <button
                        type="button"
                        onClick={() => setPreviewOpen(true)}
                        className={`${styles.previewWrap} mx-auto mt-2 block w-full`}
                        aria-label="點擊放大預覽試算截圖"
                      >
                        <img src={snapshotPreview} alt="試算截圖預覽" className={`${styles.preview} mx-auto block`} />
                        <span className={styles.previewHint}>🔍 點擊放大預覽</span>
                      </button>
                    ) : null}
                    <button
                      type="button"
                      disabled={busy === 1 || isQuick11WizardStepDone(1, progress)}
                      onClick={() => void onScreenshot()}
                      className="mt-2.5 min-h-[44px] w-full rounded-lg bg-sky-600 px-3 py-2 text-[14px] font-black text-white disabled:opacity-50"
                    >
                      {isQuick11WizardStepDone(1, progress) ? "✅ 截圖已完成" : busy === 1 ? "產生中…" : "📸 按下截圖"}
                    </button>
                  </div>

                  <div className={stepRowClass(2, progress)}>
                    <p className="text-[13px] font-black text-white">第二步：分享至 LINE／FB</p>
                    <p className={`${styles.muted} mt-1 text-[12px] leading-relaxed`}>
                      會跳出手機分享分頁；按過分享或返回本頁，第三步就會亮起。
                    </p>
                    <button
                      type="button"
                      disabled={!isQuick11WizardStepEnabled(2, progress) || busy === 2 || isQuick11WizardStepDone(2, progress)}
                      onClick={() => void onShare()}
                      className="mt-2.5 min-h-[44px] w-full rounded-lg bg-emerald-600 px-3 py-2 text-[14px] font-black text-white disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {isQuick11WizardStepDone(2, progress) ? "✅ 分享步驟已完成" : busy === 2 ? "開啟分享…" : "📤 分享試算截圖"}
                    </button>
                  </div>

                  <div className={stepRowClass(3, progress)}>
                    <p className="text-[13px] font-black text-white">第三步：複製專屬密碼</p>
                    <div className={`${styles.unlockBox} mt-2 rounded-xl px-3 py-3 ${!isQuick11WizardStepEnabled(3, progress) ? "opacity-50" : ""}`}>
                      <p className="flex items-center justify-center gap-1.5 text-[13px] font-bold text-slate-200">
                        <span aria-hidden>🔑</span>
                        解鎖碼
                      </p>
                      <p className={`${styles.code} mt-1 text-center text-[28px] font-black text-[#fde047] sm:text-[34px]`}>
                        {QUICK11_EXCEL_UNLOCK_CODE}
                      </p>
                      {copyFlash || isQuick11WizardStepDone(3, progress) ? (
                        <p className="mt-1.5 flex items-center justify-center gap-1 text-[12px] font-semibold text-[#4ade80]">
                          <span aria-hidden>✅</span>
                          已自動複製到剪貼簿
                        </p>
                      ) : (
                        <p className={`${styles.muted} mt-1.5 text-center text-[11px]`}>
                          也可私訊 {QUICK11_EXCEL_FB_KEYWORDS.join("／")}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      disabled={!isQuick11WizardStepEnabled(3, progress) || busy === 3}
                      onClick={() => void onCopyPassword()}
                      className="mt-2.5 min-h-[44px] w-full rounded-lg bg-amber-500 px-3 py-2 text-[14px] font-black text-amber-950 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {copyFlash || isQuick11WizardStepDone(3, progress) ? "✅ 密碼已複製" : busy === 3 ? "複製中…" : "📋 複製專屬密碼"}
                    </button>
                  </div>

                  <div className={stepRowClass(4, progress)}>
                    <p className="text-[13px] font-black text-white">第四步：前往粉絲專頁留言</p>
                    <p className={`${styles.muted} mt-1 text-[12px] leading-relaxed`}>貼上密碼或傳關鍵字，自動回覆附上 Excel。</p>
                    <button
                      type="button"
                      disabled={!isQuick11WizardStepEnabled(4, progress) || busy === 4}
                      onClick={onGoFanPage}
                      className="mt-2.5 min-h-[50px] w-full rounded-xl bg-gradient-to-r from-[#38bdf8] to-[#2563eb] px-3 py-3 text-[15px] font-black text-white shadow-[0_0_20px_rgba(56,189,248,0.35)] disabled:cursor-not-allowed disabled:opacity-40 sm:text-[16px]"
                    >
                      {isQuick11WizardStepDone(4, progress) ? "✅ 已前往粉專（可再開一次）" : "🎁 立即領取 Excel >"}
                    </button>
                    <p className={`${styles.muted} mt-2 flex items-start justify-center gap-1.5 text-center text-[11px] leading-relaxed sm:text-[12px]`}>
                      <span className="mt-0.5 shrink-0" aria-hidden>
                        🛡️
                      </span>
                      <span>前往粉絲專頁輸入解鎖碼，即可免費取得</span>
                    </p>
                    {!fbReady && process.env.NODE_ENV === "development" ? (
                      <p className="mt-1 text-center text-[11px] text-amber-200/90">本機請設 NEXT_PUBLIC_FB_PAGE_URL</p>
                    ) : null}
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-1.5 border-t border-slate-700/80 pt-3.5 sm:gap-2">
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

                {progress.activeStep >= 5 ? (
                  <p className="mt-3 text-center text-[12px] font-bold text-emerald-400">🎉 四步驟完成！到粉專留言即可收到 Excel。</p>
                ) : (
                  <p className={`${styles.footerNote} mt-3 text-center text-[12px] leading-relaxed sm:text-[13px]`}>
                    <span aria-hidden>❤️ </span>
                    希望這份工具，能幫助你更快達成財富自由！
                  </p>
                )}
              </div>
            </motion.div>
          </div>
        </>
      ) : null}
      {previewOpen && snapshotPreview ? (
        <>
          <button
            type="button"
            aria-label="關閉預覽"
            className="fixed inset-0 z-[90] bg-black/90"
            onClick={() => setPreviewOpen(false)}
          />
          <div className="pointer-events-none fixed inset-0 z-[91] flex items-center justify-center p-4">
            <div className={`${styles.lightbox} pointer-events-auto max-h-[92dvh] overflow-auto`}>
              <button
                type="button"
                aria-label="關閉"
                onClick={() => setPreviewOpen(false)}
                className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-slate-800/95 text-xl text-slate-200 hover:bg-slate-700"
              >
                ×
              </button>
              <img src={snapshotPreview} alt="試算截圖大圖" className={styles.lightboxImg} />
            </div>
          </div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
