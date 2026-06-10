"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./mobile-smart-voice-block.module.css";

const TOAST_MS = 2200;

/**
 * 智慧語音輸入預告區（功能尚未上線）。
 * 規劃方向：台灣繁中 ASR（如 MediaTek Breeze-ASR）＋ TTS（如 BreezyVoice）。
 */
export function MobileSmartVoiceBlock() {
  const [toastOpen, setToastOpen] = useState(false);
  const [pressed, setPressed] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showComingSoon = useCallback(() => {
    setPressed(true);
    setToastOpen(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      setToastOpen(false);
      setPressed(false);
    }, TOAST_MS);
  }, []);

  useEffect(
    () => () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    },
    [],
  );

  return (
    <div className={styles.shell} aria-label="智慧語音輸入（開發中）">
      <div className={styles.copy}>
        <p className={styles.title}>智慧語音輸入</p>
        <p className={styles.sub}>唸出「本金 20 萬、每月存 1 萬」— 自動帶入試算（開發中）</p>
        <p className={styles.techNote}>規劃整合台灣繁中語音辨識與朗讀（Breeze 系列）</p>
      </div>
      <button
        type="button"
        className={`${styles.micBtn} ${pressed ? styles.micBtnPressed : ""}`}
        aria-label="智慧語音輸入，敬請期待"
        onPointerDown={(e) => {
          e.preventDefault();
          showComingSoon();
        }}
      >
        <span aria-hidden>🎤</span>
      </button>
      {toastOpen ? (
        <div className={styles.toast} role="status" aria-live="polite">
          敬請期待
        </div>
      ) : null}
    </div>
  );
}
