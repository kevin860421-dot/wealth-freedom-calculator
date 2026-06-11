"use client";

import { useEffect, useRef, useState } from "react";

/**
 * 延後更新值，用於拖曳滑桿時降低重算頻率（版面不變）。
 * @param enabled false 時不更新 debounced（用於 localStorage 還原前凍結）
 */
export function useDebouncedValue<T>(
  value: T,
  delayMs = 280,
  enabled = true,
  /** 內容相等時不觸發（避免物件參考變動造成多餘試算） */
  serialize: (v: T) => string = (v) => JSON.stringify(v),
): T {
  const [debounced, setDebounced] = useState(value);
  const isFirstEffectRef = useRef(true);
  const valueKey = serialize(value);

  useEffect(() => {
    if (!enabled) {
      isFirstEffectRef.current = true;
      return;
    }
    // 啟用當下或首次啟用：立即同步，不等待 delayMs
    if (isFirstEffectRef.current) {
      isFirstEffectRef.current = false;
      setDebounced(value);
      return;
    }
    const id = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(id);
  }, [valueKey, value, delayMs, enabled]);

  return debounced;
}
