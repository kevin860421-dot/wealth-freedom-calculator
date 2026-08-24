import { Suspense } from "react";
import type { Metadata } from "next";
import { GamefiWalletShell } from "./gamefi-wallet-shell";

export const metadata: Metadata = {
  title: "GameFi 錢包",
  description: "登入 Google 帳號，查看寶石錢包餘額（財富自由計算機 GameFi 試玩）",
  robots: { index: false, follow: false },
};

export default function GamefiPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-lg px-4 py-12 text-center text-sm" style={{ color: "var(--morandi-text-soft)" }}>
          載入中…
        </main>
      }
    >
      <GamefiWalletShell />
    </Suspense>
  );
}
