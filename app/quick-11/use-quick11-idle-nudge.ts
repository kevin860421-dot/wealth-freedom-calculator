"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  QUICK11_IDLE_NUDGE_AFTER_MS,
  QUICK11_IDLE_NUDGE_ENGAGED_AFTER_MS,
} from "@/lib/quick11-marketing";
import { QUICK11_IDLE_NUDGE_DISMISS_KEY } from "./quick11-idle-nudge-card";
import { useQuick11SimulationResetSync } from "./quick11-simulation-reset";
import { readQuick11WizardProgress } from "./quick11-wizard-state";

/** Wizard 關閉後排程浮動卡（重新整理後仍有效） */
export const QUICK11_IDLE_NUDGE_WIZARD_AT_KEY = "quick11-idle-nudge-wizard-at-v1";

const IDLE_ACTIVITY_EVENTS = ["mousedown", "touchstart", "scroll", "keydown", "click", "wheel"] as const;

export type Quick11IdleNudgeEngagement = {
  /** DTI 壓力偏高或破產預警（≥35%） */
  isHighDtiWarning: boolean;
  /** 換過 ≥2 個分頁 */
  deepTabCompare: boolean;
  /** 調過核心貸款參數（相對進站初始值） */
  paramsTouched: boolean;
  /** 曾開啟明細表或利率對照 */
  detailDeepUsed: boolean;
};

type UseQuick11IdleNudgeOptions = {
  enabled?: boolean;
  wizardOpen: boolean;
  engagement?: Quick11IdleNudgeEngagement;
  /** 本機預覽可改短；正式站 3 分鐘 */
  afterMs?: number;
  /** 高意圖縮短等待；正式站 90 秒 */
  engagedAfterMs?: number;
};

function readWizardNudgeAtMs(): number | null {
  try {
    const raw = sessionStorage.getItem(QUICK11_IDLE_NUDGE_WIZARD_AT_KEY);
    const parsed = raw ? Number(raw) : NaN;
    return Number.isFinite(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function writeWizardNudgeAtMs(atMs: number): void {
  try {
    sessionStorage.setItem(QUICK11_IDLE_NUDGE_WIZARD_AT_KEY, String(atMs));
  } catch {
    /* ignore */
  }
}

function clearWizardNudgeAtMs(): void {
  try {
    sessionStorage.removeItem(QUICK11_IDLE_NUDGE_WIZARD_AT_KEY);
  } catch {
    /* ignore */
  }
}

function isDeepEngaged(engagement: Quick11IdleNudgeEngagement): boolean {
  return engagement.deepTabCompare || engagement.paramsTouched || engagement.detailDeepUsed;
}

function resolveIdleDelayMs(
  engagement: Quick11IdleNudgeEngagement,
  afterMs: number,
  engagedAfterMs: number,
): number {
  if (isDeepEngaged(engagement) || engagement.isHighDtiWarning) return engagedAfterMs;
  return afterMs;
}

/** Wizard 關閉後：零進度／半進度較短，已分享走 3 分鐘 */
function resolveWizardCloseDelayMs(afterMs: number, engagedAfterMs: number): number {
  const p = readQuick11WizardProgress();
  const any =
    p.screenshotDone || p.shareDone || p.copyDone || p.fbOpened;
  if (!any) return engagedAfterMs;
  if (!p.shareDone && !p.copyDone && !p.fbOpened) return engagedAfterMs;
  return afterMs;
}

/**
 * 底部浮動卡觸發（關閉後若再次閒置可重複出現）：
 * 1. 閒置：無操作；深度試算／高 DTI → 90s，否則 3 分鐘
 * 2. 關 Wizard：零／半進度 → 90s；已分享 → 3 分鐘
 */
export function useQuick11IdleNudge({
  enabled = true,
  wizardOpen,
  engagement = {
    isHighDtiWarning: false,
    deepTabCompare: false,
    paramsTouched: false,
    detailDeepUsed: false,
  },
  afterMs = QUICK11_IDLE_NUDGE_AFTER_MS,
  engagedAfterMs = QUICK11_IDLE_NUDGE_ENGAGED_AFTER_MS,
}: UseQuick11IdleNudgeOptions) {
  const [visible, setVisible] = useState(false);
  const visibleRef = useRef(false);
  const idleTimerRef = useRef<number | null>(null);
  const wizardTimerRef = useRef<number | null>(null);
  const prevWizardOpenRef = useRef(wizardOpen);
  const engagementRef = useRef(engagement);

  visibleRef.current = visible;
  engagementRef.current = engagement;

  const clearIdleTimer = useCallback(() => {
    if (idleTimerRef.current) {
      window.clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
  }, []);

  const clearWizardTimer = useCallback(() => {
    if (wizardTimerRef.current) {
      window.clearTimeout(wizardTimerRef.current);
      wizardTimerRef.current = null;
    }
  }, []);

  const clearAllTimers = useCallback(() => {
    clearIdleTimer();
    clearWizardTimer();
  }, [clearIdleTimer, clearWizardTimer]);

  const tryShow = useCallback(() => {
    if (!enabled || wizardOpen) return;
    setVisible(true);
    clearAllTimers();
    clearWizardNudgeAtMs();
  }, [enabled, wizardOpen, clearAllTimers]);

  const scheduleWizardNudge = useCallback(
    (fireAtMs: number) => {
      clearWizardTimer();
      writeWizardNudgeAtMs(fireAtMs);
      const delay = Math.max(0, fireAtMs - Date.now());
      wizardTimerRef.current = window.setTimeout(() => {
        wizardTimerRef.current = null;
        tryShow();
      }, delay);
    },
    [clearWizardTimer, tryShow],
  );

  const armIdleTimer = useCallback(() => {
    if (!enabled || wizardOpen || visibleRef.current) return;
    clearIdleTimer();
    const delay = resolveIdleDelayMs(engagementRef.current, afterMs, engagedAfterMs);
    idleTimerRef.current = window.setTimeout(() => {
      idleTimerRef.current = null;
      tryShow();
    }, delay);
  }, [enabled, wizardOpen, afterMs, engagedAfterMs, clearIdleTimer, tryShow]);

  const dismiss = useCallback(() => {
    visibleRef.current = false;
    setVisible(false);
    clearAllTimers();
    clearWizardNudgeAtMs();
    armIdleTimer();
  }, [clearAllTimers, armIdleTimer]);

  useEffect(() => {
    if (wizardOpen) {
      setVisible(false);
      clearIdleTimer();
      return;
    }
    armIdleTimer();
  }, [wizardOpen, armIdleTimer, clearIdleTimer]);

  useEffect(() => {
    if (!enabled || wizardOpen) return;
    armIdleTimer();
  }, [
    enabled,
    wizardOpen,
    engagement.isHighDtiWarning,
    engagement.deepTabCompare,
    engagement.paramsTouched,
    engagement.detailDeepUsed,
    armIdleTimer,
  ]);

  useEffect(() => {
    if (!enabled || wizardOpen) return;

    const onActivity = () => armIdleTimer();
    for (const event of IDLE_ACTIVITY_EVENTS) {
      window.addEventListener(event, onActivity, { passive: true });
    }
    armIdleTimer();

    return () => {
      for (const event of IDLE_ACTIVITY_EVENTS) {
        window.removeEventListener(event, onActivity);
      }
      clearIdleTimer();
    };
  }, [enabled, wizardOpen, armIdleTimer, clearIdleTimer]);

  useEffect(() => {
    if (!enabled || wizardOpen) return;

    const fireAt = readWizardNudgeAtMs();
    if (fireAt == null) return;

    if (Date.now() >= fireAt) {
      tryShow();
      return;
    }

    scheduleWizardNudge(fireAt);
  }, [enabled, wizardOpen, scheduleWizardNudge, tryShow]);

  useEffect(() => {
    const wasOpen = prevWizardOpenRef.current;
    prevWizardOpenRef.current = wizardOpen;

    if (!enabled || !wasOpen || wizardOpen) return;

    const delay = resolveWizardCloseDelayMs(afterMs, engagedAfterMs);
    scheduleWizardNudge(Date.now() + delay);
  }, [enabled, wizardOpen, afterMs, engagedAfterMs, scheduleWizardNudge]);

  useEffect(
    () => () => {
      clearAllTimers();
    },
    [clearAllTimers],
  );

  useQuick11SimulationResetSync(() => {
    clearAllTimers();
    clearWizardNudgeAtMs();
    setVisible(false);
    prevWizardOpenRef.current = false;
  });

  /** 45 秒／返回觸發 Wizard 後：關閉時再排程底部浮動卡 */
  const notifyExitIntentTriggered = useCallback(() => {
    if (!enabled) return;
    clearIdleTimer();
    const delay = resolveWizardCloseDelayMs(afterMs, engagedAfterMs);
    scheduleWizardNudge(Date.now() + delay);
  }, [enabled, afterMs, engagedAfterMs, clearIdleTimer, scheduleWizardNudge]);

  return { visible, dismiss, notifyExitIntentTriggered };
}

export { QUICK11_IDLE_NUDGE_DISMISS_KEY };
