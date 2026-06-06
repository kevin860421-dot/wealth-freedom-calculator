"use client";

import { useCallback, useRef, useState, type RefObject } from "react";
import { captureElementToJpegDataUrl } from "@/app/capture-element-screenshot";
import { markQuick11ShareUnlocked } from "./quick11-share-unlock";
import { Quick11HomeSnapshotView } from "./quick11-home-snapshot-view";
import type { Quick11ShareSnapshotData } from "./quick11-share-snapshot-data";

export type { Quick11ShareSnapshotData } from "./quick11-share-snapshot-data";

export const QUICK11_WIZARD_SNAPSHOT_KEY = "quick11-wizard-snapshot-v1";

export function saveQuick11WizardSnapshot(dataUrl: string): void {
  try {
    sessionStorage.setItem(QUICK11_WIZARD_SNAPSHOT_KEY, dataUrl);
  } catch {
    /* ignore quota */
  }
}

export function readQuick11WizardSnapshot(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return sessionStorage.getItem(QUICK11_WIZARD_SNAPSHOT_KEY);
  } catch {
    return null;
  }
}

export function clearQuick11WizardSnapshot(): void {
  try {
    sessionStorage.removeItem(QUICK11_WIZARD_SNAPSHOT_KEY);
  } catch {
    /* ignore */
  }
}

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
        width: 440,
        pointerEvents: "none",
        opacity: 0,
        zIndex: -1,
      }}
    >
      <div ref={snapshotRef}>
        <Quick11HomeSnapshotView data={data} />
      </div>
    </div>
  );
}

export function useQuick11ShareSnapshotRef() {
  return useRef<HTMLDivElement | null>(null);
}
