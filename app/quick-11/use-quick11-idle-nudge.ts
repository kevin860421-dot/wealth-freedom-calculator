"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { QUICK11_IDLE_NUDGE_AFTER_MS } from "@/lib/quick11-marketing";
import {
  dismissQuick11IdleNudge,
  hasQuick11IdleNudgeDismissed,
  QUICK11_IDLE_NUDGE_DISMISS_KEY,
} from "./quick11-idle-nudge-card";
import { useQuick11SimulationResetSync } from "./quick11-simulation-reset";
import { readQuick11WizardProgress, QUICK11_WIZARD_EVENT } from "./quick11-wizard-state";

type UseQuick11IdleNudgeOptions = {
  enabled?: boolean;
  wizardOpen: boolean;
  /** 45 秒／返回已觸發過 Excel Wizard */
  exitIntentTriggered: boolean;
  /** 本機預覽可改短；正式站 3 分鐘 */
  afterMs?: number;
};

/**
 * 底部浮動卡：Wizard 關閉後，若「45 秒／返回」或「尚未分享」→ 一律等 3 分鐘再顯示。
 */
export function useQuick11IdleNudge({
  enabled = true,
  wizardOpen,
  exitIntentTriggered,
  afterMs = QUICK11_IDLE_NUDGE_AFTER_MS,
}: UseQuick11IdleNudgeOptions) {
  const [visible, setVisible] = useState(false);
  const [shareDone, setShareDone] = useState(false);
  const delayTimerRef = useRef<number | null>(null);
  const prevWizardOpenRef = useRef(wizardOpen);
  const exitIntentRef = useRef(exitIntentTriggered);

  const clearTimers = useCallback(() => {
    if (delayTimerRef.current) {
      window.clearTimeout(delayTimerRef.current);
      delayTimerRef.current = null;
    }
  }, []);

  const refreshShareDone = useCallback(() => {
    setShareDone(readQuick11WizardProgress().shareDone);
  }, []);

  const tryShow = useCallback(() => {
    if (!enabled || wizardOpen || hasQuick11IdleNudgeDismissed()) return;
    setVisible(true);
  }, [enabled, wizardOpen]);

  const dismiss = useCallback(() => {
    dismissQuick11IdleNudge();
    setVisible(false);
    clearTimers();
  }, [clearTimers]);

  useEffect(() => {
    exitIntentRef.current = exitIntentTriggered;
  }, [exitIntentTriggered]);

  useEffect(() => {
    refreshShareDone();
    const onProgress = () => refreshShareDone();
    window.addEventListener(QUICK11_WIZARD_EVENT, onProgress);
    return () => window.removeEventListener(QUICK11_WIZARD_EVENT, onProgress);
  }, [refreshShareDone]);

  useEffect(() => {
    if (wizardOpen) setVisible(false);
  }, [wizardOpen]);

  useEffect(() => {
    const wasOpen = prevWizardOpenRef.current;
    prevWizardOpenRef.current = wizardOpen;

    if (!wasOpen || wizardOpen) return;

    const progress = readQuick11WizardProgress();
    const shouldSchedule = exitIntentRef.current || !progress.shareDone;
    if (!shouldSchedule) return;

    clearTimers();
    delayTimerRef.current = window.setTimeout(() => {
      delayTimerRef.current = null;
      tryShow();
    }, afterMs);
  }, [wizardOpen, tryShow, clearTimers, afterMs]);

  useEffect(
    () => () => {
      clearTimers();
    },
    [clearTimers],
  );

  useQuick11SimulationResetSync(() => {
    clearTimers();
    setVisible(false);
    refreshShareDone();
    prevWizardOpenRef.current = false;
    exitIntentRef.current = false;
  });

  return { visible, dismiss, shareDone };
}

export { QUICK11_IDLE_NUDGE_DISMISS_KEY };
