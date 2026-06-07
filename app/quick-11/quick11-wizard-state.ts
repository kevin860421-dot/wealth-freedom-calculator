"use client";

import { clearQuick11WizardSnapshot } from "./quick11-share-snapshot";

import { useCallback, useEffect, useState } from "react";
import { QUICK11_SHARE_UNLOCK_COOKIE } from "@/lib/quick11-marketing";
import { markQuick11ShareUnlocked } from "./quick11-share-unlock";

const STORAGE_KEY = "quick11-wizard-v1";
export const QUICK11_WIZARD_EVENT = "quick11-wizard-progress";

/** 1=截圖 2=分享 3=複製密碼 4=粉專留言；5=全流程完成 */
export type Quick11WizardStep = 1 | 2 | 3 | 4 | 5;

export type Quick11WizardProgress = {
  /** 目前可操作的步驟（1～4） */
  activeStep: Quick11WizardStep;
  screenshotDone: boolean;
  shareDone: boolean;
  copyDone: boolean;
  fbOpened: boolean;
};

function defaultProgress(): Quick11WizardProgress {
  return {
    activeStep: 1,
    screenshotDone: false,
    shareDone: false,
    copyDone: false,
    fbOpened: false,
  };
}

function deriveActiveStep(p: Omit<Quick11WizardProgress, "activeStep">): Quick11WizardStep {
  if (p.fbOpened) return 5;
  if (p.copyDone) return 4;
  if (p.shareDone) return 3;
  if (p.screenshotDone) return 2;
  return 1;
}

export function readQuick11WizardProgress(): Quick11WizardProgress {
  if (typeof window === "undefined") return defaultProgress();
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultProgress();
    const parsed = JSON.parse(raw) as Partial<Quick11WizardProgress>;
    const base = {
      screenshotDone: Boolean(parsed.screenshotDone),
      shareDone: Boolean(parsed.shareDone),
      copyDone: Boolean(parsed.copyDone),
      fbOpened: Boolean(parsed.fbOpened),
    };
    return { ...base, activeStep: deriveActiveStep(base) };
  } catch {
    return defaultProgress();
  }
}

export function writeQuick11WizardProgress(next: Quick11WizardProgress): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  if (next.copyDone) {
    document.cookie = `${QUICK11_SHARE_UNLOCK_COOKIE}=1; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
    markQuick11ShareUnlocked();
  }
  window.dispatchEvent(new Event(QUICK11_WIZARD_EVENT));
}

export function completeQuick11WizardScreenshot(): Quick11WizardProgress {
  const prev = readQuick11WizardProgress();
  const next = {
    ...prev,
    screenshotDone: true,
    activeStep: 2 as Quick11WizardStep,
  };
  writeQuick11WizardProgress(next);
  return next;
}

export function completeQuick11WizardShare(): Quick11WizardProgress {
  const prev = readQuick11WizardProgress();
  const next = {
    ...prev,
    screenshotDone: true,
    shareDone: true,
    activeStep: 3 as Quick11WizardStep,
  };
  writeQuick11WizardProgress(next);
  return next;
}

export function completeQuick11WizardCopy(): Quick11WizardProgress {
  const prev = readQuick11WizardProgress();
  const next = {
    ...prev,
    screenshotDone: true,
    shareDone: true,
    copyDone: true,
    activeStep: 4 as Quick11WizardStep,
  };
  writeQuick11WizardProgress(next);
  return next;
}

export function completeQuick11WizardFb(): Quick11WizardProgress {
  const prev = readQuick11WizardProgress();
  const next = {
    ...prev,
    screenshotDone: true,
    shareDone: true,
    copyDone: true,
    fbOpened: true,
    activeStep: 5 as Quick11WizardStep,
  };
  writeQuick11WizardProgress(next);
  return next;
}

export function resetQuick11WizardProgress(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
  clearQuick11WizardSnapshot();
  window.dispatchEvent(new Event(QUICK11_WIZARD_EVENT));
}

export function isQuick11WizardStepEnabled(step: 1 | 2 | 3 | 4, progress: Quick11WizardProgress): boolean {
  if (step === 1) return true;
  if (step === 2) return progress.screenshotDone;
  if (step === 3) return progress.shareDone;
  if (step === 4) return progress.copyDone;
  return false;
}

export function isQuick11WizardStepDone(step: 1 | 2 | 3 | 4, progress: Quick11WizardProgress): boolean {
  if (step === 1) return progress.screenshotDone;
  if (step === 2) return progress.shareDone;
  if (step === 3) return progress.copyDone;
  if (step === 4) return progress.fbOpened;
  return false;
}

export function useQuick11WizardProgress(): {
  progress: Quick11WizardProgress;
  refresh: () => void;
} {
  const [progress, setProgress] = useState<Quick11WizardProgress>(defaultProgress);

  const refresh = useCallback(() => {
    setProgress(readQuick11WizardProgress());
  }, []);

  useEffect(() => {
    refresh();
    window.addEventListener(QUICK11_WIZARD_EVENT, refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.removeEventListener(QUICK11_WIZARD_EVENT, refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [refresh]);

  return { progress, refresh };
}
