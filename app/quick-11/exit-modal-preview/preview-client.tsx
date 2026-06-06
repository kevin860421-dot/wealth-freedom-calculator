"use client";

import { useState } from "react";
import { Quick11ExcelLeadBlock } from "../quick11-excel-lead-block";
import { Quick11ExcelWizardModal } from "../quick11-excel-wizard-modal";
import {
  Quick11ShareSnapshotCapture,
  useQuick11ShareSnapshotRef,
  type Quick11ShareSnapshotData,
} from "../quick11-share-snapshot";
import { resetQuick11WizardProgress } from "../quick11-wizard-state";

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

/** 四步驟轉化彈窗預覽：模擬 /quick-11 頁底 + 彈窗（免等 45 秒） */
export function Quick11ExitModalPreviewClient() {
  const [wizardOpen, setWizardOpen] = useState(true);
  const [modalKey, setModalKey] = useState(0);
  const snapshotRef = useQuick11ShareSnapshotRef();

  return (
    <div className="min-h-[100dvh] bg-[#0b0f14] pb-10">
      <div className="sticky top-0 z-[90] flex flex-wrap items-center justify-between gap-2 border-b border-amber-500/40 bg-amber-400/95 px-3 py-2.5 text-[13px] font-bold text-amber-950">
        <span>🛠 轉化彈窗預覽 · 對齊正式 /quick-11</span>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setWizardOpen(true)}
            className="rounded-lg border border-amber-950/30 bg-white/90 px-3 py-1.5 text-[12px] font-black text-amber-950 hover:bg-white"
          >
            打開彈窗
          </button>
          <button
            type="button"
            onClick={() => {
              resetQuick11WizardProgress();
              setModalKey((k) => k + 1);
              setWizardOpen(true);
            }}
            className="rounded-lg bg-amber-950 px-3 py-1.5 text-[12px] font-black text-amber-100 hover:bg-black"
          >
            重置四步驟
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-lg px-3 pt-6">
        <p className="mb-3 text-center text-[12px] font-semibold text-slate-500">↓ 正式頁底區塊（點按鈕也會打開同一個彈窗）</p>
        <Quick11ExcelLeadBlock onOpenWizard={() => setWizardOpen(true)} />
        <p className="mt-6 text-center text-[12px] leading-relaxed text-slate-600">
          正式站：<strong className="text-slate-400">/quick-11</strong> 停留 45 秒或離開意圖也會自動彈出。
        </p>
      </div>

      <Quick11ShareSnapshotCapture snapshotRef={snapshotRef} data={DEMO_SNAPSHOT} />
      <Quick11ExcelWizardModal
        key={modalKey}
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        snapshotRef={snapshotRef}
      />
    </div>
  );
}
