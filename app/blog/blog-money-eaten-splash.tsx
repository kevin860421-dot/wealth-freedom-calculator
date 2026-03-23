"use client";

import { useEffect, useState } from "react";
import { MoneyEatenSpiritModal } from "../money-eaten-spirit-modal";

/**
 * 僅在「進入部落格路由」時掛載：吃錢彈窗（客戶端掛載後才顯示，避免 hydration 問題）。
 */
export function BlogMoneyEatenSplash() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  return <MoneyEatenSpiritModal active={mounted} />;
}
