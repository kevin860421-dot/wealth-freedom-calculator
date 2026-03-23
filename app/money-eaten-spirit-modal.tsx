"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { playChompSound, playSmallChomp } from "@/lib/play-chomp-sound";
import styles from "./money-eaten-spirit-modal.module.css";

const SESSION_KEY = "wf-blog-money-eaten-splash-v1";

const COINS = ["💵", "🪙", "💰", "💴"] as const;

type BitePhase = "intro" | number | "done";

type Props = {
  active: boolean;
};

/**
 * 進入部落格時：半透明彈窗，錢錢「一口一口」被小精靈吃掉的連續動畫 + 每口短音效（非首頁計算機）。
 */
export function MoneyEatenSpiritModal({ active }: Props) {
  const [open, setOpen] = useState(false);
  const [bitePhase, setBitePhase] = useState<BitePhase>("intro");
  const [chomp, setChomp] = useState(false);

  useEffect(() => {
    if (!active || typeof window === "undefined") return;
    try {
      if (sessionStorage.getItem(SESSION_KEY) === "1") return;
    } catch {
      /* private mode */
    }
    setOpen(true);
  }, [active]);

  /** 開場後延遲再咬第一口，讓面板先出現 */
  useEffect(() => {
    if (!open) {
      setBitePhase("intro");
      return;
    }
    setBitePhase("intro");
    const t = window.setTimeout(() => setBitePhase(0), 520);
    return () => window.clearTimeout(t);
  }, [open]);

  /** 一口一口：每個數字代表「正在吃第幾枚」，音效 + 時間到進下一口 */
  useEffect(() => {
    if (!open || bitePhase === "intro" || bitePhase === "done") return;
    if (typeof bitePhase !== "number") return;

    playSmallChomp();
    setChomp(true);
    const chompOff = window.setTimeout(() => setChomp(false), 520);

    const next = window.setTimeout(() => {
      setBitePhase((b) => {
        if (typeof b !== "number") return b;
        return b < COINS.length - 1 ? b + 1 : "done";
      });
    }, 720);

    return () => {
      window.clearTimeout(chompOff);
      window.clearTimeout(next);
    };
  }, [bitePhase, open]);

  const dismiss = () => {
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      /* ignore */
    }
    setOpen(false);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!active || !open || typeof document === "undefined") return null;

  const biteLabel =
    typeof bitePhase === "number"
      ? `第 ${bitePhase + 1} 口…`
      : bitePhase === "done"
        ? "吃光光了"
        : "準備開動…";

  return createPortal(
    <div
      className={styles.backdrop}
      role="dialog"
      aria-modal="true"
      aria-labelledby="money-eaten-title"
      aria-live="polite"
      onClick={dismiss}
    >
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div className={styles.stage}>
          {/* 精靈在下層，硬幣在上層，才看得到「飛進嘴裡」 */}
          <div className={styles.spiritBounce} aria-hidden>
            <div className={`${styles.spiritInner} ${chomp ? styles.chomp : ""}`}>
              <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <radialGradient id="spiritBodyEat" cx="40%" cy="35%" r="65%">
                    <stop offset="0%" stopColor="#c4b5fd" />
                    <stop offset="55%" stopColor="#7c3aed" />
                    <stop offset="100%" stopColor="#4c1d95" />
                  </radialGradient>
                </defs>
                <ellipse cx="60" cy="68" rx="48" ry="44" fill="url(#spiritBodyEat)" />
                <ellipse cx="60" cy="68" rx="48" ry="44" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
                <ellipse cx="44" cy="58" rx="9" ry="11" fill="#1e1b2e" />
                <ellipse cx="76" cy="58" rx="9" ry="11" fill="#1e1b2e" />
                <ellipse cx="46" cy="56" rx="3" ry="4" fill="#faf5ff" />
                <ellipse cx="78" cy="56" rx="3" ry="4" fill="#faf5ff" />
                <ellipse cx="60" cy="82" rx="22" ry="16" fill="#2e1064" opacity="0.85" />
                <path
                  d="M48 78 Q60 92 72 78"
                  stroke="#fbbf24"
                  strokeWidth="4"
                  strokeLinecap="round"
                  fill="none"
                />
                <ellipse cx="60" cy="28" rx="8" ry="14" fill="#a78bfa" opacity="0.9" />
                <path d="M60 14 L56 6 L64 6 Z" fill="#ddd6fe" />
              </svg>
            </div>
          </div>

          {COINS.map((emoji, i) => {
            const isEaten =
              bitePhase === "done" || (typeof bitePhase === "number" && i < bitePhase);
            const isFlying = typeof bitePhase === "number" && bitePhase === i;
            return (
              <span
                key={i}
                className={[
                  styles.coin,
                  styles[`slot${i}`],
                  isEaten ? styles.gone : isFlying ? styles.flying : styles.waiting,
                ]
                  .filter(Boolean)
                  .join(" ")}
                aria-hidden
              >
                {emoji}
              </span>
            );
          })}

          <span className={styles.biteHint}>{biteLabel}</span>
        </div>

        <h2 id="money-eaten-title" className={styles.title}>
          <span className={styles.titleLine}>你的錢</span>
          <span className={styles.titleLine2}>被吃掉了</span>
        </h2>
        <button
          type="button"
          className={styles.btn}
          onClick={() => {
            playChompSound();
            dismiss();
          }}
        >
          我知道了（點旁邊也可關閉）
        </button>
      </div>
    </div>,
    document.body
  );
}
