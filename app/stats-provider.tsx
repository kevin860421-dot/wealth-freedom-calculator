"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { PublicStats } from "@/lib/stats-store";

const PV_KEY = "wealth_freedom_calc_stats_pv_v1";
const ENG_KEY = "wealth_freedom_calc_stats_eng_v1";

type StatsContextValue = {
  stats: PublicStats;
  refresh: () => Promise<void>;
};

const StatsContext = createContext<StatsContextValue | null>(null);

export function useStats(): StatsContextValue {
  const v = useContext(StatsContext);
  if (!v) throw new Error("useStats must be used within StatsProvider");
  return v;
}

export function StatsProvider({
  initialStats,
  children,
}: {
  initialStats: PublicStats;
  children: ReactNode;
}) {
  const [stats, setStats] = useState<PublicStats>(initialStats);

  const refresh = useCallback(async () => {
    try {
      const r = await fetch("/api/stats", { cache: "no-store" });
      if (r.ok) setStats(await r.json());
    } catch {
      /* ignore */
    }
  }, []);

  /** 工作階段瀏覽：每 session 計一次 */
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(PV_KEY) === "1") return;
    sessionStorage.setItem(PV_KEY, "1");
    void (async () => {
      try {
        const r = await fetch("/api/stats", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "pageview" }),
        });
        if (r.ok) setStats(await r.json());
      } catch {
        /* ignore */
      }
    })();
  }, []);

  /** 有效互動：同一 session 僅計一次；條件為（任滿足其一）停留約 16 秒、下載 Excel、曾編輯表單輸入 */
  useEffect(() => {
    if (typeof window === "undefined") return;

    const markEngage = () => {
      if (sessionStorage.getItem(ENG_KEY) === "1") return;
      sessionStorage.setItem(ENG_KEY, "1");
      void (async () => {
        try {
          const r = await fetch("/api/stats", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "engage" }),
          });
          if (r.ok) setStats(await r.json());
        } catch {
          /* ignore */
        }
      })();
    };

    let timerCleared = false;
    const timer = window.setTimeout(() => {
      if (!timerCleared) markEngage();
    }, 16000);

    const clearTimer = () => {
      if (!timerCleared) {
        timerCleared = true;
        window.clearTimeout(timer);
      }
    };

    const onCustom = () => {
      clearTimer();
      markEngage();
    };

    const onFirstInput = () => {
      clearTimer();
      markEngage();
      document.removeEventListener("input", onFirstInput, true);
    };

    window.addEventListener("calc-engagement", onCustom);
    document.addEventListener("input", onFirstInput, true);

    return () => {
      clearTimer();
      window.removeEventListener("calc-engagement", onCustom);
      document.removeEventListener("input", onFirstInput, true);
    };
  }, []);

  const value: StatsContextValue = { stats, refresh };

  return <StatsContext.Provider value={value}>{children}</StatsContext.Provider>;
}
