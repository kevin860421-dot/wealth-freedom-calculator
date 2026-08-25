"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Package, Swords, X } from "lucide-react";
import { useGameFi } from "@/lib/gamefi/context/gamefi-context";

export function FloatingBattlePanel() {
  const { totalAttack, cards, cardsLoading, clickCount } = useGameFi();
  const [packOpen, setPackOpen] = useState(false);

  const closePack = useCallback(() => setPackOpen(false), []);

  useEffect(() => {
    if (!packOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closePack();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [packOpen, closePack]);

  return (
    <>
      <motion.button
        type="button"
        data-gamefi-ignore
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setPackOpen(true)}
        className="fixed right-3 top-3 z-[9990] rounded-xl border border-amber-500/80 bg-[#0B132B]/90 px-3 py-2 text-left shadow-lg shadow-amber-500/20 backdrop-blur-md"
        aria-label="查看卡包與總攻擊力"
      >
        <p className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-amber-400/90">
          <Swords className="h-3 w-3" aria-hidden />
          Combat
        </p>
        <p className="text-sm font-semibold text-[#f0ebe5]">
          ⚔️ 總攻擊力: {cardsLoading ? "…" : totalAttack}
        </p>
        <p className="text-[10px] text-[#8f857b]">探索進度 {clickCount}/3</p>
      </motion.button>

      <AnimatePresence>
        {packOpen && (
          <motion.div
            className="fixed inset-0 z-[9997] flex items-start justify-end p-3 pt-14"
            data-gamefi-ignore
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              type="button"
              className="absolute inset-0 bg-[#0B132B]/70 backdrop-blur-sm"
              aria-label="關閉卡包"
              onClick={closePack}
            />
            <motion.aside
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 24 }}
              className="relative z-10 max-h-[70vh] w-full max-w-sm overflow-hidden rounded-2xl border border-amber-500/60 bg-[#0B132B]/95 shadow-2xl shadow-amber-500/10 backdrop-blur-xl"
            >
              <div className="flex items-center justify-between border-b border-amber-500/30 px-4 py-3">
                <div>
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-[#f0ebe5]">
                    <Package className="h-4 w-4 text-amber-400" aria-hidden />
                    我的卡包
                  </h3>
                  <p className="text-xs text-[#b8aea4]">
                    總攻擊力 {totalAttack} · 共 {cards.length} 張
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closePack}
                  className="rounded-lg p-1 text-[#b8aea4] hover:bg-white/5"
                  aria-label="關閉"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="max-h-[55vh] overflow-y-auto p-3">
                {cards.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-white/10 px-3 py-6 text-center text-sm text-[#8f857b]">
                    尚未召喚任何卡片。再試算 3 次，能量就夠了。
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {cards.map((card) => (
                      <li
                        key={card.id}
                        className="rounded-xl border border-amber-500/30 bg-[#121d38]/90 p-3"
                      >
                        <p className="text-sm font-semibold text-[#f0ebe5]">
                          【{card.cardName}】Lv.{card.level}
                        </p>
                        <p className="mt-1 text-xs text-amber-300">
                          攻擊 +{card.attack} · 防禦 +{card.defensePct}%
                        </p>
                        <p className="mt-2 text-xs italic text-[#8f857b]">
                          {card.story}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
