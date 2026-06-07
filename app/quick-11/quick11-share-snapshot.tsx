"use client";

import { useRef, type RefObject } from "react";
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
