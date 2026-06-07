"use client";

import { useCallback, useRef, useSyncExternalStore, useState } from "react";
import {
  QUICK11_EXIT_INTENT_MIN_DWELL_MS,
  QUICK11_EXCEL_PREVIEW_PATH,
  QUICK11_IDLE_NUDGE_AFTER_MS,
  QUICK11_IDLE_NUDGE_ENGAGED_AFTER_MS,
} from "@/lib/quick11-marketing";
import { Quick11ExcelLeadBlock } from "../quick11-excel-lead-block";
import { Quick11ExcelWizardModal } from "../quick11-excel-wizard-modal";
import { Quick11IdleNudgeCard, QUICK11_IDLE_NUDGE_DISMISS_KEY } from "../quick11-idle-nudge-card";
import {
  Quick11ShareSnapshotCapture,
  useQuick11ShareSnapshotRef,
  type Quick11ShareSnapshotData,
} from "../quick11-share-snapshot";
import { resetQuick11SimulationState } from "../quick11-simulation-reset";

const DEMO_SNAPSHOT: Quick11ShareSnapshotData = {
  loanAmount: 12_000_000,
  annualRate: 2.2,
  loanYears: 30,
  monthlyIncome: 80_000,
  method: "equalPrincipal",
  monthlyPayment: 45_564,
  monthlyInterest: 22_000,
  totalInterest: 4_403_076,
  totalRepayment: 16_403_076,
  dtiPct: 57.0,
  warningLabel: "警戒區",
  warningMessage: "月付偏高，建議降貸款或拉長年期再試。",
  warningWrapClass: "border-orange-500/70 bg-orange-500/15 text-orange-100",
  warningMeterClass: "bg-orange-500",
};

/** 預覽用：浮動卡 3 分鐘 → 5 秒；高意圖 90 秒 → 3 秒 */
const PREVIEW_IDLE_AFTER_MS = 5_000;
const PREVIEW_IDLE_ENGAGED_AFTER_MS = 3_000;

const DEMO_NUDGE_COPY = {
  title: "厭倦了被銀行抽走利息？",
  subtitle: "你的試算結果顯示：",
  highlight: "最高可少付 NT$432,076",
  body: "",
  button: "前往存股複利計算機",
};

function subscribeClient(onStoreChange: () => void): () => void {
  onStoreChange();
  return () => {};
}

/** 四步驟 Wizard + 底部浮動卡預覽（純手動，不掛正式倒數／離開意圖 hook） */
export function Quick11ExitModalPreviewClient() {
  const isClient = useSyncExternalStore(subscribeClient, () => true, () => false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [nudgeVisible, setNudgeVisible] = useState(false);
  const [modalKey, setModalKey] = useState(0);
  const idleTimerRef = useRef<number | null>(null);
  const snapshotRef = useQuick11ShareSnapshotRef();

  const clearIdleTimer = useCallback(() => {
    if (idleTimerRef.current) {
      window.clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
  }, []);

  const scheduleNudge = useCallback(() => {
    clearIdleTimer();
    idleTimerRef.current = window.setTimeout(() => {
      idleTimerRef.current = null;
      setNudgeVisible(true);
    }, PREVIEW_IDLE_ENGAGED_AFTER_MS);
  }, [clearIdleTimer]);

  const resetPreview = useCallback(() => {
    clearIdleTimer();
    try {
      sessionStorage.removeItem("quick11-exit-intent-v5");
      sessionStorage.removeItem(QUICK11_IDLE_NUDGE_DISMISS_KEY);
    } catch {
      /* ignore */
    }
    resetQuick11SimulationState();
    setWizardOpen(false);
    setNudgeVisible(false);
    setModalKey((k) => k + 1);
  }, [clearIdleTimer]);

  const closeWizard = useCallback(() => {
    setWizardOpen(false);
    scheduleNudge();
  }, [scheduleNudge]);

  if (!isClient) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#0b0f14] text-[14px] font-semibold text-slate-400">
        載入預覽…
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#0b0f14] pb-28">
      <div className="sticky top-0 z-[90] flex flex-wrap items-center justify-between gap-2 border-b border-amber-500/40 bg-amber-400/95 px-3 py-2.5 text-[13px] font-bold text-amber-950">
        <span>🛠 quick-11 轉化預覽</span>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setWizardOpen(true)}
            className="rounded-lg border border-amber-950/30 bg-white/90 px-3 py-1.5 text-[12px] font-black text-amber-950 hover:bg-white"
          >
            開 Wizard
          </button>
          <button
            type="button"
            onClick={() => {
              setNudgeVisible(false);
              setWizardOpen(true);
            }}
            className="rounded-lg border border-amber-950/30 bg-white/90 px-3 py-1.5 text-[12px] font-black text-amber-950 hover:bg-white"
          >
            模擬 45 秒後關閉
          </button>
          <a
            href={QUICK11_EXCEL_PREVIEW_PATH}
            className="rounded-lg border border-amber-950/30 bg-white/90 px-3 py-1.5 text-[12px] font-black text-amber-950 hover:bg-white no-underline"
          >
            Excel 視覺預覽
          </a>
          <button
            type="button"
            onClick={() => setNudgeVisible(true)}
            className="rounded-lg border border-amber-950/30 bg-white/90 px-3 py-1.5 text-[12px] font-black text-amber-950 hover:bg-white"
          >
            立即看浮動卡
          </button>
          <button
            type="button"
            onClick={resetPreview}
            className="rounded-lg border border-amber-950/30 bg-white/90 px-3 py-1.5 text-[12px] font-black text-amber-950 hover:bg-white"
          >
            重置
          </button>
          <button
            type="button"
            onClick={resetPreview}
            className="rounded-lg bg-rose-700 px-3 py-1.5 text-[12px] font-black text-white hover:bg-rose-800"
          >
            🧹 清除模擬資料
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-lg px-3 pt-6">
        <div className="mb-4 space-y-3">
          <div className="rounded-xl border border-sky-500/35 bg-sky-950/40 px-4 py-3 text-[13px] leading-relaxed text-sky-100">
            <p className="font-black text-sky-300">① Excel Wizard（45 秒／返回）</p>
            <p className="mt-1">
              正式站 {QUICK11_EXIT_INTENT_MIN_DWELL_MS / 1000} 秒自動開啟 · 本頁請按「開 Wizard」或「模擬 45 秒後關閉」。
            </p>
          </div>
          <div className="rounded-xl border border-emerald-500/35 bg-emerald-950/35 px-4 py-3 text-[13px] leading-relaxed text-emerald-100">
            <p className="font-black text-emerald-300">② 底部浮動卡（quick-1）</p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-[12px] text-emerald-200/90">
              <li>
                <strong>閒置</strong>：{PREVIEW_IDLE_AFTER_MS / 1000} 秒無操作（正式站 3 分鐘）
              </li>
              <li>
                <strong>高 DTI／深度試算</strong>（換分頁、調參數、明細表）：{PREVIEW_IDLE_ENGAGED_AFTER_MS / 1000}{" "}
                秒（正式站 {QUICK11_IDLE_NUDGE_ENGAGED_AFTER_MS / 1000} 秒）
              </li>
              <li>
                <strong>關 Wizard</strong>：零／半進度 {PREVIEW_IDLE_ENGAGED_AFTER_MS / 1000} 秒；已分享{" "}
                {PREVIEW_IDLE_AFTER_MS / 1000} 秒（正式站 {QUICK11_IDLE_NUDGE_ENGAGED_AFTER_MS / 1000}／
                {QUICK11_IDLE_NUDGE_AFTER_MS / 1000 / 60} 分鐘）
              </li>
            </ul>
            <p className="mt-2 text-[12px] text-emerald-200/85">
              按 × 關閉後，再次閒置仍會出現。按「模擬 45 秒後關閉」→ 關 Wizard 等 {PREVIEW_IDLE_ENGAGED_AFTER_MS / 1000}{" "}
              秒；或「立即看浮動卡」。
            </p>
          </div>
        </div>

        <Quick11ExcelLeadBlock onOpenWizard={() => setWizardOpen(true)} />
      </div>

      <Quick11ShareSnapshotCapture snapshotRef={snapshotRef} data={DEMO_SNAPSHOT} />
      <Quick11ExcelWizardModal
        key={modalKey}
        open={wizardOpen}
        onClose={closeWizard}
        snapshotRef={snapshotRef}
      />
      <Quick11IdleNudgeCard
        visible={nudgeVisible}
        copy={DEMO_NUDGE_COPY}
        onDismiss={() => {
          setNudgeVisible(false);
          scheduleNudge();
        }}
      />
    </div>
  );
}
