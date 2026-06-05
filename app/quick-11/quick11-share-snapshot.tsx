"use client";

import { useCallback, useRef, useState, type RefObject } from "react";
import { captureElementToJpegDataUrl } from "@/app/capture-element-screenshot";
import { formatMoney } from "./logic";
import { markQuick11ShareUnlocked } from "./quick11-share-unlock";

export type Quick11ShareSnapshotData = {
  loanAmount: number;
  annualRate: number;
  loanYears: number;
  monthlyIncome: number;
  methodLabel: string;
  monthlyPayment: number;
  totalInterest: number;
  dtiPct: number;
  warningLabel: string;
  warningMessage: string;
};

type Quick11ShareSnapshotButtonProps = {
  snapshotRef: RefObject<HTMLDivElement | null>;
  isLight?: boolean;
};

async function shareOrDownloadImage(dataUrl: string, filename: string): Promise<"shared" | "downloaded"> {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  const file = new File([blob], filename, { type: "image/jpeg" });

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
    return "shared";
  }

  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  a.click();
  return "downloaded";
}

export function Quick11ShareSnapshotCard({
  data,
  isLight = false,
}: {
  data: Quick11ShareSnapshotData;
  isLight?: boolean;
}) {
  const totalRepayment = data.loanAmount + data.totalInterest;
  return (
    <div
      className={`rounded-xl border p-3 ${
        isLight ? "border-slate-200 bg-white text-slate-900" : "border-slate-600 bg-[#0b1220] text-slate-100"
      }`}
    >
      <p className={`text-[11px] font-bold tracking-[0.14em] ${isLight ? "text-sky-700" : "text-sky-300"}`}>
        破產計算機 · 試算快照
      </p>
      <p className="mt-1 text-[15px] font-black leading-snug">信貸房貸壓力測試｜{data.methodLabel}</p>
      <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[12px]">
        <span className={isLight ? "text-slate-600" : "text-slate-400"}>貸款本金</span>
        <span className="text-right font-bold tabular-nums">NT$ {formatMoney(data.loanAmount)}</span>
        <span className={isLight ? "text-slate-600" : "text-slate-400"}>年利率／年期</span>
        <span className="text-right font-bold tabular-nums">
          {data.annualRate}%／{data.loanYears} 年
        </span>
        <span className={isLight ? "text-slate-600" : "text-slate-400"}>每月繳款</span>
        <span className="text-right font-black tabular-nums text-sky-300">NT$ {formatMoney(data.monthlyPayment)}</span>
        <span className={isLight ? "text-slate-600" : "text-slate-400"}>總繳利息</span>
        <span className="text-right font-black tabular-nums">NT$ {formatMoney(data.totalInterest)}</span>
        <span className={isLight ? "text-slate-600" : "text-slate-400"}>總繳金額</span>
        <span className="text-right font-bold tabular-nums">NT$ {formatMoney(totalRepayment)}</span>
        <span className={isLight ? "text-slate-600" : "text-slate-400"}>DTI</span>
        <span className="text-right font-black tabular-nums">{data.dtiPct.toFixed(1)}%</span>
      </div>
      <p className={`mt-2 rounded-md px-2 py-1.5 text-[11px] font-bold leading-snug ${isLight ? "bg-amber-50 text-amber-900" : "bg-amber-500/15 text-amber-100"}`}>
        {data.warningLabel}：{data.warningMessage}
      </p>
      <p className={`mt-2 text-[10px] ${isLight ? "text-slate-500" : "text-slate-500"}`}>
        wealth-freedom-calculator.vercel.app/quick-11
      </p>
    </div>
  );
}

export function Quick11ShareSnapshotButton({ snapshotRef, isLight = false }: Quick11ShareSnapshotButtonProps) {
  const [state, setState] = useState<"idle" | "busy" | "shared" | "downloaded" | "fail">("idle");

  const onShare = useCallback(async () => {
    const el = snapshotRef.current;
    if (!el || state === "busy") return;
    setState("busy");
    try {
      const dataUrl = await captureElementToJpegDataUrl(el);
      if (!dataUrl) {
        setState("fail");
        window.setTimeout(() => setState("idle"), 1400);
        return;
      }
      const stamp = new Date().toISOString().slice(0, 10);
      const result = await shareOrDownloadImage(dataUrl, `quick11-dti-${stamp}.jpg`);
      markQuick11ShareUnlocked();
      setState(result);
      window.setTimeout(() => setState("idle"), 1600);
    } catch {
      setState("fail");
      window.setTimeout(() => setState("idle"), 1400);
    }
  }, [snapshotRef, state]);

  const label =
    state === "busy"
      ? "產生中…"
      : state === "shared"
        ? "已分享"
        : state === "downloaded"
          ? "已存到相簿"
          : state === "fail"
            ? "請再試一次"
            : "📸 分享試算結果（截圖）";

  return (
    <button
      type="button"
      onClick={() => void onShare()}
      disabled={state === "busy"}
      className={`min-h-[48px] w-full rounded-xl border px-3 py-2.5 text-[15px] font-black transition active:scale-[0.99] disabled:opacity-70 ${
        isLight
          ? "border-emerald-400/70 bg-emerald-50 text-emerald-950 hover:bg-emerald-100"
          : "border-emerald-400/50 bg-emerald-500/12 text-emerald-100 hover:bg-emerald-500/20"
      }`}
    >
      {label}
    </button>
  );
}

/** 螢幕外渲染供 html2canvas 擷取 */
export function Quick11ShareSnapshotCapture({
  snapshotRef,
  data,
}: {
  snapshotRef: RefObject<HTMLDivElement | null>;
  data: Quick11ShareSnapshotData;
}) {
  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        left: -9999,
        top: 0,
        width: 360,
        pointerEvents: "none",
        opacity: 0,
        zIndex: -1,
      }}
    >
      <div ref={snapshotRef}>
        <Quick11ShareSnapshotCard data={data} />
      </div>
    </div>
  );
}

export function useQuick11ShareSnapshotRef() {
  return useRef<HTMLDivElement | null>(null);
}
