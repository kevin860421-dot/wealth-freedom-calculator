"use client";

import { useCallback, useEffect, useRef } from "react";
import { QUICK11_EXIT_INTENT_MIN_DWELL_MS } from "@/lib/quick11-marketing";
import { useQuick11SimulationResetSync } from "./quick11-simulation-reset";

export const QUICK11_EXIT_INTENT_STORAGE_KEY = "quick11-exit-intent-v5";

type Quick11ExitIntentModalProps = {
  enabled?: boolean;
  /** Wizard 已開啟時不再觸發 */
  blocked?: boolean;
  /** 本機預覽可改短（毫秒）；正式站用預設 45 秒 */
  dwellMs?: number;
  /** 45 秒／返回已觸發（供底部浮動卡 3 分鐘計時） */
  onTriggered?: () => void;
  onOpenWizard: () => void;
};

function hasSeenExitIntent(): boolean {
  try {
    return sessionStorage.getItem(QUICK11_EXIT_INTENT_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function markExitIntentSeen(): void {
  try {
    sessionStorage.setItem(QUICK11_EXIT_INTENT_STORAGE_KEY, "1");
  } catch {
    /* ignore */
  }
}

/** 45 秒或離開意圖 → 直接開四步驟 Excel Wizard（無額外中間卡片） */
export function Quick11ExitIntentModal({
  enabled = true,
  blocked = false,
  dwellMs = QUICK11_EXIT_INTENT_MIN_DWELL_MS,
  onTriggered,
  onOpenWizard,
}: Quick11ExitIntentModalProps) {
  const enteredAtRef = useRef<number>(Date.now());
  const openedRef = useRef(false);

  const tryOpenWizard = useCallback(() => {
    if (!enabled || blocked || hasSeenExitIntent() || openedRef.current) return;
    openedRef.current = true;
    markExitIntentSeen();
    onTriggered?.();
    onOpenWizard();
  }, [enabled, blocked, onOpenWizard, onTriggered]);

  const onSimReset = useCallback(() => {
    openedRef.current = false;
    enteredAtRef.current = Date.now();
  }, []);

  useQuick11SimulationResetSync(onSimReset);

  useEffect(() => {
    if (!enabled || hasSeenExitIntent()) return;

    enteredAtRef.current = Date.now();

    try {
      window.history.pushState({ quick11Exit: true }, "");
    } catch {
      /* ignore */
    }

    const dwellTimer = window.setTimeout(() => {
      tryOpenWizard();
    }, dwellMs);

    const onMouseLeave = (e: MouseEvent) => {
      if (e.clientY > 12) return;
      tryOpenWizard();
    };

    const onPopState = () => {
      tryOpenWizard();
      if (!hasSeenExitIntent()) {
        try {
          window.history.pushState({ quick11Exit: true }, "");
        } catch {
          /* ignore */
        }
      }
    };

    document.addEventListener("mouseleave", onMouseLeave);
    window.addEventListener("popstate", onPopState);

    return () => {
      window.clearTimeout(dwellTimer);
      document.removeEventListener("mouseleave", onMouseLeave);
      window.removeEventListener("popstate", onPopState);
    };
  }, [enabled, tryOpenWizard, dwellMs]);

  return null;
}
