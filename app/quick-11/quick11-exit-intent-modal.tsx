"use client";

import { useCallback, useEffect, useRef } from "react";
import { QUICK11_EXIT_INTENT_MIN_DWELL_MS } from "@/lib/quick11-marketing";
import { useQuick11SimulationResetSync } from "./quick11-simulation-reset";

export const QUICK11_EXIT_INTENT_STORAGE_KEY = "quick11-exit-intent-v5";

const HISTORY_STATE_KEY = "quick11Exit";

type Quick11ExitIntentModalProps = {
  enabled?: boolean;
  /** Wizard 已開啟時不再觸發 */
  blocked?: boolean;
  /** 本機預覽可改短（毫秒）；正式站用預設 45 秒 */
  dwellMs?: number;
  /** 45 秒／返回已觸發（供底部浮動卡 3 分鐘計時） */
  onTriggered?: () => void;
  /** 電腦版頁面 × 按鈕：註冊 tryOpen 回呼 */
  onRegisterTryOpen?: (tryOpen: () => void) => void;
  onOpenWizard: () => void;
};

export function hasQuick11ExitIntentSeen(): boolean {
  return hasSeenExitIntent();
}

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

function getHistoryUrl(): string {
  const { pathname, search, hash } = window.location;
  return `${pathname}${search}${hash}`;
}

/** 手機返回攔截：須帶完整 URL，空字串在 iOS／部分 WebView 會失效 */
function armExitHistoryTrap(): void {
  try {
    window.history.pushState({ [HISTORY_STATE_KEY]: true }, "", getHistoryUrl());
  } catch {
    /* ignore */
  }
}

/** 45 秒／手機返回／電腦版頁面 × → 直接開四步驟 Excel Wizard（無額外中間卡片） */
export function Quick11ExitIntentModal({
  enabled = true,
  blocked = false,
  dwellMs = QUICK11_EXIT_INTENT_MIN_DWELL_MS,
  onTriggered,
  onRegisterTryOpen,
  onOpenWizard,
}: Quick11ExitIntentModalProps) {
  const enteredAtRef = useRef<number>(Date.now());
  const openedRef = useRef(false);
  const blockedRef = useRef(blocked);
  const onOpenWizardRef = useRef(onOpenWizard);
  const onTriggeredRef = useRef(onTriggered);

  blockedRef.current = blocked;
  onOpenWizardRef.current = onOpenWizard;
  onTriggeredRef.current = onTriggered;

  const tryOpenWizard = useCallback(() => {
    if (!enabled || blockedRef.current || hasSeenExitIntent() || openedRef.current) return;
    openedRef.current = true;
    markExitIntentSeen();
    onTriggeredRef.current?.();
    onOpenWizardRef.current();
  }, [enabled]);

  const onSimReset = useCallback(() => {
    openedRef.current = false;
    enteredAtRef.current = Date.now();
  }, []);

  useQuick11SimulationResetSync(onSimReset);

  useEffect(() => {
    onRegisterTryOpen?.(tryOpenWizard);
    return () => onRegisterTryOpen?.(() => {});
  }, [onRegisterTryOpen, tryOpenWizard]);

  useEffect(() => {
    if (!enabled || hasSeenExitIntent()) return;

    enteredAtRef.current = Date.now();
    armExitHistoryTrap();

    const dwellTimer = window.setTimeout(() => {
      tryOpenWizard();
    }, dwellMs);

    const onPopState = () => {
      if (hasSeenExitIntent()) return;
      // 先重新塞 history，手機按返回才會留在本頁並彈 Wizard
      armExitHistoryTrap();
      tryOpenWizard();
    };

    const onPageShow = (event: PageTransitionEvent) => {
      if (!event.persisted || hasSeenExitIntent()) return;
      armExitHistoryTrap();
    };

    window.addEventListener("popstate", onPopState);
    window.addEventListener("pageshow", onPageShow);

    return () => {
      window.clearTimeout(dwellTimer);
      window.removeEventListener("popstate", onPopState);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, [enabled, dwellMs, tryOpenWizard]);

  return null;
}
