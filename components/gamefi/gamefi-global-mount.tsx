"use client";

import { GameFiProvider } from "@/lib/gamefi/context/gamefi-context";
import { GameFiActionListener } from "@/components/gamefi/gamefi-action-listener";

/** 抽卡尚未完成，正式版先不掛。 */
export function GameFiGlobalMount() {
  return (
    <GameFiProvider>
      <GameFiActionListener />
    </GameFiProvider>
  );
}
