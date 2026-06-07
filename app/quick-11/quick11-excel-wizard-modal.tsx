"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState, type MouseEvent, type RefObject } from "react";
import { captureElementToJpegDataUrl } from "@/app/capture-element-screenshot";
import {
  QUICK11_EXCEL_UNLOCK_CODE,
  getQuick11FbMessengerUrl,
  isQuick11FbMessengerConfigured,
} from "@/lib/quick11-marketing";
import { copyQuick11UnlockCode } from "./quick11-excel-actions";
import { Quick11Excel24hCountdown } from "./quick11-excel-24h-countdown";
import styles from "./quick11-excel-wizard-modal.module.css";
import { readQuick11WizardSnapshot, saveQuick11WizardSnapshot } from "./quick11-share-snapshot";
import { Quick11ShareDesktopPanel } from "./quick11-share-desktop-panel";
import {
  applyQuick11ScreenshotAfterCapture,
  dataUrlToShareFile,
  getQuick11ScreenshotPostCaptureHint,
  openQuick11SystemSharePage,
} from "./quick11-share-image";
import { Quick11WizardConfirm } from "./quick11-wizard-confirm";
import { Quick11WizardToast, useQuick11WizardToast } from "./quick11-wizard-toast";
import { prefersNativeShareSheet } from "./quick11-share-platform";
import { useQuick11SimulationResetSync } from "./quick11-simulation-reset";
import {
  completeQuick11WizardCopy,
  completeQuick11WizardFb,
  completeQuick11WizardScreenshot,
  completeQuick11WizardShare,
  isQuick11WizardStepDone,
  isQuick11WizardStepEnabled,
  readQuick11WizardProgress,
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
  const [desktopShareOpen, setDesktopShareOpen] = useState(false);
  const [fanPageConfirmOpen, setFanPageConfirmOpen] = useState(false);
  const shareFileRef = useRef<File | null>(null);
  const shareUnlockTimerRef = useRef<number | null>(null);
  const { toastMessage, showToast } = useQuick11WizardToast();

  const SHARE_UNLOCK_DELAY_MS = 2500;

  const syncShareFile = useCallback((dataUrl: string | null) => {
    shareFileRef.current = dataUrl ? dataUrlToShareFile(dataUrl) : null;
  }, []);

  const clearWizardUi = useCallback(() => {
    setSnapshotPreview(null);
    setPreviewOpen(false);
    setCopyFlash(false);
    setDesktopShareOpen(false);
    setFanPageConfirmOpen(false);
    if (shareUnlockTimerRef.current) {
      window.clearTimeout(shareUnlockTimerRef.current);
      shareUnlockTimerRef.current = null;
    }
    setBusy(null);
    shareFileRef.current = null;
    refresh();
  }, [refresh]);

  useQuick11SimulationResetSync(clearWizardUi);

  useEffect(() => {
    if (!open) {
      setPreviewOpen(false);
      setBusy(null);
      return;
    }
    refresh();
    const prog = readQuick11WizardProgress();
    const saved = readQuick11WizardSnapshot();
    if (saved && prog.screenshotDone) {
      setSnapshotPreview(saved);
      syncShareFile(saved);
    } else {
      setSnapshotPreview(null);
      syncShareFile(null);
    }
  }, [open, refresh, syncShareFile]);

  const onScreenshot = useCallback(async () => {
    const el = snapshotRef.current;
    if (!el || busy) return;
    setBusy(1);
    try {
      const dataUrl = await captureElementToJpegDataUrl(el);
      if (!dataUrl) return;
      setSnapshotPreview(dataUrl);
      saveQuick11WizardSnapshot(dataUrl);
      syncShareFile(dataUrl);
      completeQuick11WizardScreenshot();
      refresh();
      const postCapture = await applyQuick11ScreenshotAfterCapture(dataUrl);
      showToast(getQuick11ScreenshotPostCaptureHint(postCapture));
    } finally {
      setBusy(null);
    }
  }, [snapshotRef, busy, refresh, syncShareFile, showToast]);

  const scheduleShareUnlock = useCallback(() => {
    if (shareUnlockTimerRef.current) window.clearTimeout(shareUnlockTimerRef.current);
    shareUnlockTimerRef.current = window.setTimeout(() => {
      shareUnlockTimerRef.current = null;
      const prog = readQuick11WizardProgress();
      if (prog.shareDone) return;
      completeQuick11WizardShare();
      setDesktopShareOpen(false);
      refresh();
      showToast("✅ 分享完成，第三步已解鎖");
    }, SHARE_UNLOCK_DELAY_MS);
  }, [refresh, showToast]);

  const onShare = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (busy === 2) return;
    if (!progress.screenshotDone && !snapshotPreview) return;

    scheduleShareUnlock();
    showToast("📤 分享已啟動，稍候解鎖第三步");

    if (prefersNativeShareSheet()) {
      let file = shareFileRef.current;
      if (!file && snapshotPreview) {
        file = dataUrlToShareFile(snapshotPreview);
        shareFileRef.current = file;
      }

      const sharePromise = openQuick11SystemSharePage(file);
      setBusy(2);

      void sharePromise.finally(() => setBusy(null));
      return;
    }

    setDesktopShareOpen(true);
  };

  const step4FanPageReady = isQuick11FbMessengerConfigured();
  const step4MessengerUrl = getQuick11FbMessengerUrl();
  const step4Enabled = isQuick11WizardStepEnabled(4, progress);
  const step4BtnClass =
    "mt-2.5 flex min-h-[50px] w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#38bdf8] to-[#2563eb] px-3 py-3 text-center text-[15px] font-black text-white shadow-[0_0_20px_rgba(56,189,248,0.35)] no-underline disabled:cursor-not-allowed sm:text-[16px]";

  const onCopyPassword = useCallback(async () => {
    if (!isQuick11WizardStepEnabled(3, progress) || busy) return;
    setBusy(3);
    const ok = await copyQuick11UnlockCode();
    if (ok) {
      setCopyFlash(true);
      completeQuick11WizardCopy();
      refresh();
      showToast("✅ 成功複製專屬密碼");
      window.setTimeout(() => setCopyFlash(false), 1800);
    }
    setBusy(null);
  }, [progress, busy, refresh, showToast]);

  const onConfirmGoFanPage = useCallback(() => {
    setFanPageConfirmOpen(false);
    void navigator.clipboard.writeText(QUICK11_EXCEL_UNLOCK_CODE).catch(() => {
      void copyQuick11UnlockCode();
    });
    showToast("✅ 密碼已複製，正在前往粉專…");
    completeQuick11WizardFb();
    refresh();
    window.open(step4MessengerUrl, "_blank", "noopener,noreferrer");
  }, [refresh, showToast, step4MessengerUrl]);

  const onFanPageClick = useCallback(() => {
    if (!step4Enabled || !step4FanPageReady) return;
    setFanPageConfirmOpen(true);
  }, [step4Enabled, step4FanPageReady]);

  return (
    <>
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            key="quick11-wizard-backdrop"
            type="button"
            aria-label="關閉"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] bg-black/82 backdrop-blur-[3px]"
            onClick={onClose}
          />
          <div key="quick11-wizard-shell" className="pointer-events-none fixed inset-0 z-[81] flex items-center justify-center p-3 sm:p-4">
            <motion.div
              role="dialog"
              aria-modal
              aria-labelledby="quick11-wizard-title"
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ duration: 0.22 }}
              className={`${styles.shell} ${styles.panel} pointer-events-auto rounded-2xl border border-slate-600/80 bg-[#161b22] text-slate-100 shadow-[0_24px_80px_rgba(0,0,0,0.6)]`}
            >
              <button
                type="button"
                aria-label="關閉視窗"
                onClick={onClose}
                className={styles.closeBtn}
              >
                ×
              </button>

              <div className={styles.panelScroll}>
              <div className="px-4 pb-5 pt-4 sm:px-5">
                <Quick11Excel24hCountdown size="large" />

                <h2
                  id="quick11-wizard-title"
                  className="mt-4 pr-8 text-center text-[30px] font-black leading-tight tracking-[0.02em] text-white sm:text-[36px]"
                >
                  免費取得 <span className="text-emerald-400">EXCEL</span>
                </h2>

                <div className={`${styles.stepDivider} mt-5 pt-1`}>
                  <div className="flex items-center justify-between gap-1 px-1">
                    {STEPS.map((s) => (
                      <div key={s.n} className="flex min-w-0 flex-1 flex-col items-center">
                        <div className={stepDotClasses(s.n, progress)}>{isQuick11WizardStepDone(s.n, progress) ? "✓" : s.n}</div>
                        <p className="mt-1 truncate text-[10px] font-bold text-slate-300 sm:text-[11px]">{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-3 space-y-2.5">
                  <div className={stepRowClass(1, progress)}>
                    <p className="text-[13px] font-black text-white">第一步：按下截圖</p>
                    {snapshotPreview ? (
                      <button
                        type="button"
                        onClick={() => setPreviewOpen(true)}
                        className={`${styles.previewWrap} mx-auto mt-2 block w-full`}
                        aria-label="點擊放大預覽試算截圖"
                      >
                        <img src={snapshotPreview} alt="試算截圖預覽" className={`${styles.preview} mx-auto block`} />
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

                  <div className={styles.shareMaskZone}>
                    <div className={stepRowClass(2, progress)}>
                      <p className="text-[13px] font-black text-white">第二步：分享至 LINE / FB</p>
                      <button
                        type="button"
                        disabled={(!progress.screenshotDone && !snapshotPreview) || busy === 2}
                        onClick={onShare}
                        className="relative z-10 mt-2.5 min-h-[48px] w-full touch-manipulation rounded-lg bg-emerald-600 px-3 py-2.5 text-[14px] font-black text-white disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {busy === 2 ? "開啟分享…" : "📤 分享試算截圖"}
                      </button>
                    </div>

                    <div className={stepRowClass(3, progress)}>
                      <p className="text-[13px] font-black text-white">第三步：複製專屬密碼</p>
                      <div className={`${styles.unlockBox} mt-2 rounded-xl px-3 py-3 ${!isQuick11WizardStepEnabled(3, progress) ? "opacity-50" : ""}`}>
                        <p className="flex items-center justify-center gap-1.5 text-[14px] font-bold text-slate-100">
                          <span aria-hidden>🔑</span>
                          解鎖碼
                        </p>
                        <p className={`${styles.code} mt-1.5 text-center text-[30px] font-black leading-none text-[#fde047] sm:text-[36px]`}>
                          {QUICK11_EXCEL_UNLOCK_CODE}
                        </p>
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

                    <Quick11ShareDesktopPanel open={desktopShareOpen} onClose={() => setDesktopShareOpen(false)} />
                  </div>

                  <div className={stepRowClass(4, progress)}>
                    <p className="text-[13px] font-black text-white">第四步：前往粉絲專頁留言</p>
                    {step4FanPageReady ? (
                      <button
                        type="button"
                        disabled={!step4Enabled}
                        onClick={onFanPageClick}
                        className={`${step4BtnClass} ${!step4Enabled ? "opacity-40" : ""}`}
                      >
                        {isQuick11WizardStepDone(4, progress) ? "✅ 已前往粉專（可再開一次）" : "🎁 立即領取 Excel >"}
                      </button>
                    ) : (
                      <button type="button" disabled className={`${step4BtnClass} opacity-40`}>
                        🎁 立即領取 Excel &gt;
                      </button>
                    )}
                  </div>
                </div>
              </div>
              </div>

              <Quick11WizardToast message={toastMessage} />
              <Quick11WizardConfirm
                open={fanPageConfirmOpen}
                title="前往粉絲專頁？"
                body="進入 App 需等待幾秒"
                cancelLabel="返回"
                confirmLabel="立即前往"
                onCancel={() => setFanPageConfirmOpen(false)}
                onConfirm={onConfirmGoFanPage}
              />
            </motion.div>
          </div>
        </>
      ) : null}
    </AnimatePresence>
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
    </>
  );
}
