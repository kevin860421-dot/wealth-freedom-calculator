"use client";

import { useCallback, useState } from "react";
import { resetQuick11SimulationState } from "./quick11-simulation-reset";

type Quick11SimResetButtonProps = {
  /** 清除後回呼（例如重開 Wizard、顯示清單） */
  onAfterReset?: (report: ReturnType<typeof resetQuick11SimulationState>) => void;
  /** 頂部工具列用小按鈕 */
  compact?: boolean;
  className?: string;
};

/** 模擬用：一鍵清除 quick-11 本機資料（勿掛在正式 /quick-11 頁） */
export function Quick11SimResetButton({ onAfterReset, compact = false, className = "" }: Quick11SimResetButtonProps) {
  const [done, setDone] = useState(false);

  const onReset = useCallback(() => {
    const report = resetQuick11SimulationState();
    onAfterReset?.(report);
    setDone(true);
    window.setTimeout(() => setDone(false), 2200);
  }, [onAfterReset]);

  if (compact) {
    return (
      <button
        type="button"
        onClick={onReset}
        className={
          className ||
          "rounded-lg bg-rose-700 px-3 py-1.5 text-[12px] font-black text-white hover:bg-rose-800"
        }
      >
        {done ? "✓ 已清除" : "🧹 清除模擬資料"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onReset}
      className={
        className ||
        "min-h-[52px] w-full rounded-xl bg-gradient-to-r from-rose-600 to-orange-600 px-4 py-3 text-[16px] font-black text-white shadow-[0_8px_24px_rgba(225,29,72,0.35)] transition active:scale-[0.99]"
      }
    >
      {done ? "✓ 模擬資料已清除" : "🧹 一鍵清除 Quick-11 模擬資料"}
    </button>
  );
}
