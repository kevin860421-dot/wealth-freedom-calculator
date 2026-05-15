"use client";

import { useEffect, useRef, useState } from "react";

/**
 * 延後更新值，用於拖曳滑桿時降低重算頻率（版面不變）。
 * @param enabled false 時不更新 debounced（用於 localStorage 還原前凍結）
 */
export function useDebouncedValue<T>(value: T, delayMs = 280, enabled = true): T {
  const [debounced, setDebounced] = useState(value);
  const isFirstEffectRef = useRef(true);

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
  }, [value, delayMs, enabled]);

  return debounced;
}
