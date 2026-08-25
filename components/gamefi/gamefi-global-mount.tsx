"use client";

import { GameFiProvider } from "@/lib/gamefi/context/gamefi-context";
import { FloatingBattlePanel } from "@/components/gamefi/floating-battle-panel";
import { GameFiActionListener } from "@/components/gamefi/gamefi-action-listener";
import { GachaSummonModal } from "@/components/gamefi/gacha-summon-modal";

/** 全域 GameFi 外掛掛載點（不侵入計算機核心） */
export function GameFiGlobalMount() {
  return (
    <GameFiProvider>
      <GameFiActionListener />
      <FloatingBattlePanel />
      <GachaSummonModal />
    </GameFiProvider>
  );
}
