"use client";

import { useCallback, useEffect, useRef } from "react";
import { QUICK11_EXIT_INTENT_MIN_DWELL_MS } from "@/lib/quick11-marketing";
import { useQuick11SimulationResetSync } from "./quick11-simulation-reset";

const STORAGE_KEY = "quick11-exit-intent-v4";

type Quick11ExitIntentModalProps = {
  enabled?: boolean;
  onOpenWizard: () => void;
};

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

/** 45 秒或離開意圖 → 打開四步驟轉化彈窗 */
export function Quick11ExitIntentModal({ enabled = true, onOpenWizard }: Quick11ExitIntentModalProps) {
  const enteredAtRef = useRef<number>(Date.now());
  const historyArmedRef = useRef(false);
  const openedRef = useRef(false);

  const tryOpen = useCallback(() => {
    if (!enabled || hasSeenExitIntent() || openedRef.current) return;
    if (Date.now() - enteredAtRef.current < QUICK11_EXIT_INTENT_MIN_DWELL_MS) return;
    openedRef.current = true;
    markExitIntentSeen();
    onOpenWizard();
  }, [enabled, onOpenWizard]);

  const onSimReset = useCallback(() => {
    openedRef.current = false;
    historyArmedRef.current = false;
    enteredAtRef.current = Date.now();
  }, []);

  useQuick11SimulationResetSync(onSimReset);

  useEffect(() => {
    if (!enabled || hasSeenExitIntent()) return;

    enteredAtRef.current = Date.now();

    const armHistory = () => {
      if (historyArmedRef.current || hasSeenExitIntent()) return;
      historyArmedRef.current = true;
      window.history.pushState({ quick11Exit: true }, "");
    };

    const dwellTimer = window.setTimeout(() => {
      armHistory();
      tryOpen();
    }, QUICK11_EXIT_INTENT_MIN_DWELL_MS);

    const onMouseLeave = (e: MouseEvent) => {
      if (e.clientY > 12) return;
      tryOpen();
    };

    const onPopState = () => {
      if (Date.now() - enteredAtRef.current < QUICK11_EXIT_INTENT_MIN_DWELL_MS) return;
      tryOpen();
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
  }, [enabled, tryOpen]);

  return null;
}
