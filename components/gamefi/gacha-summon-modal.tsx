"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import confetti from "canvas-confetti";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, Swords, X } from "lucide-react";
import {
  useGameFi,
  type GameFiCardView,
} from "@/lib/gamefi/context/gamefi-context";

type SummonPhase = "prompt" | "summoning" | "reveal";

function fireSummonConfetti() {
  void confetti({
    particleCount: 120,
    spread: 72,
    origin: { y: 0.62 },
    colors: ["#f59e0b", "#fbbf24", "#f0ebe5", "#0B132B"],
  });
}

export function GachaSummonModal() {
  const {
    showGachaModal,
    setShowGachaModal,
    applySummonResult,
    refreshCards,
  } = useGameFi();
  const [phase, setPhase] = useState<SummonPhase>("prompt");
  const [revealedCard, setRevealedCard] = useState<GameFiCardView | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setPhase("prompt");
    setRevealedCard(null);
    setError(null);
  }, []);

  useEffect(() => {
    if (!showGachaModal) reset();
  }, [showGachaModal, reset]);

  if (!showGachaModal) return null;

  const close = () => {
    setShowGachaModal(false);
    reset();
  };

  const handleSummon = async () => {
    setError(null);
    setPhase("summoning");
    try {
      const res = await fetch("/api/gamefi/gacha", {
        method: "POST",
        credentials: "include",
        headers: { Accept: "application/json" },
      });
      const body = (await res.json()) as {
        success?: boolean;
        card?: GameFiCardView;
        error?: string;
      };

      if (!res.ok) {
        if (res.status === 401) {
          setError("請先登入後再召喚卡片");
          setPhase("prompt");
          return;
        }
        throw new Error(body.error ?? "召喚失敗");
      }

      if (!body.card) {
        throw new Error("召喚回應異常");
      }

      setRevealedCard(body.card);
      applySummonResult(body.card);
      setPhase("reveal");
      fireSummonConfetti();
      void refreshCards();
    } catch (err) {
      setError(err instanceof Error ? err.message : "召喚失敗");
      setPhase("prompt");
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[9998] flex items-center justify-center p-4"
        data-gamefi-ignore
        role="dialog"
        aria-modal="true"
        aria-labelledby="gacha-modal-title"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <button
          type="button"
          className="absolute inset-0 bg-[#0B132B]/85 backdrop-blur-md"
          aria-label="關閉召喚視窗"
          onClick={close}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 16 }}
          transition={{ type: "spring", stiffness: 260, damping: 22 }}
          className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border-2 border-amber-500 bg-[#0B132B]/95 shadow-2xl shadow-amber-500/25 backdrop-blur-xl"
          data-gamefi-ignore
        >
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-transparent" />

          {phase === "prompt" && (
            <div className="relative p-6">
              <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-amber-400/90">
                <Sparkles className="h-3.5 w-3.5" aria-hidden />
                Gacha Protocol
              </p>
              <h2
                id="gacha-modal-title"
                className="mt-2 text-lg font-semibold leading-relaxed text-[#f0ebe5]"
              >
                偵測到您的財務探索意念！已凝聚足夠能量，獲得一次免費抽卡機會！
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-[#b8aea4]">
                三次試算調整，足以在虛空中召喚一張財務人格卡片。
              </p>
              {error && (
                <p className="mt-3 rounded-lg border border-red-500/40 bg-red-950/40 px-3 py-2 text-sm text-red-200">
                  {error}
                  {error.includes("登入") && (
                    <Link
                      href="/gamefi"
                      className="ml-2 text-amber-300 underline"
                    >
                      前往登入
                    </Link>
                  )}
                </p>
              )}
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={handleSummon}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-amber-500 bg-amber-500/20 px-4 py-3 text-sm font-semibold text-amber-200 transition hover:bg-amber-500/30"
                >
                  <Swords className="h-4 w-4" aria-hidden />
                  啟動召喚
                </button>
                <button
                  type="button"
                  onClick={close}
                  className="rounded-xl border border-white/10 px-4 py-3 text-sm text-[#b8aea4] hover:bg-white/5"
                >
                  稍後
                </button>
              </div>
            </div>
          )}

          {phase === "summoning" && (
            <div className="relative flex flex-col items-center py-10">
              <motion.div
                animate={{ rotateY: [0, 180, 360], scale: [1, 1.08, 1] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                className="h-32 w-24 rounded-xl border-2 border-amber-500 bg-gradient-to-b from-amber-500/35 to-[#0B132B] shadow-lg shadow-amber-500/30"
              />
              <p className="mt-4 text-sm text-amber-300">能量凝聚中…</p>
            </div>
          )}

          {phase === "reveal" && revealedCard && (
            <div className="relative p-6">
              <motion.div
                initial={{ rotateY: 90, opacity: 0 }}
                animate={{ rotateY: 0, opacity: 1 }}
                transition={{ duration: 0.65, ease: "easeOut" }}
                className="mx-auto flex h-48 w-36 flex-col justify-between rounded-xl border-2 border-amber-500 bg-gradient-to-br from-amber-500/30 via-[#1a2744] to-[#0B132B] p-3 shadow-xl shadow-amber-500/30"
              >
                <p className="text-[10px] uppercase tracking-widest text-amber-400/80">
                  Summoned
                </p>
                <div>
                  <p className="text-sm font-bold leading-snug text-[#f0ebe5]">
                    【{revealedCard.cardName}】
                  </p>
                  <p className="mt-1 text-xs text-amber-300">
                    Lv.{revealedCard.level}
                  </p>
                </div>
                <div className="text-xs">
                  <p className="text-amber-300">攻擊力 +{revealedCard.attack}</p>
                  <p className="text-emerald-300/90">
                    防禦力 +{revealedCard.defensePct}%
                  </p>
                </div>
              </motion.div>
              <p className="mt-4 text-center text-sm italic leading-relaxed text-[#b8aea4]">
                「{revealedCard.story}」
              </p>
              <button
                type="button"
                onClick={close}
                className="mt-6 w-full rounded-xl border border-amber-500 bg-amber-500/20 px-4 py-3 text-sm font-semibold text-amber-200 hover:bg-amber-500/30"
              >
                收入卡包
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
