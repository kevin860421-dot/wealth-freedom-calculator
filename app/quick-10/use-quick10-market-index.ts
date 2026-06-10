"use client";

import { useEffect, useState } from "react";
import { DEFAULT_TAIEX_INDEX } from "@/lib/quick10-taiex-fetch";

const STORAGE_KEY = "quick10_taiex_index_v1";
const TAIPEI_TZ = "Asia/Taipei";
const REFRESH_AFTER_HOUR = 18;

type CachedTaiex = {
  index: number;
  taipeiDate: string;
  fetchedAt: string;
  source?: string;
};

function taipeiClock(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TAIPEI_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const date = `${get("year")}-${get("month")}-${get("day")}`;
  const hour = Number(get("hour"));
  return { date, hour: Number.isFinite(hour) ? hour : 0 };
}

function readCache(): CachedTaiex | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedTaiex;
    if (!parsed || typeof parsed.index !== "number" || !parsed.taipeiDate) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(payload: CachedTaiex) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* quota / private mode */
  }
}

function shouldFetchFresh(cache: CachedTaiex | null, now = new Date()) {
  const { date, hour } = taipeiClock(now);
  if (hour < REFRESH_AFTER_HOUR) return false;
  if (!cache) return true;
  return cache.taipeiDate !== date;
}

export function useQuick10MarketIndex() {
  const [index, setIndex] = useState(DEFAULT_TAIEX_INDEX);
  const [status, setStatus] = useState<"idle" | "cached" | "live" | "fallback">("idle");

  useEffect(() => {
    const cache = readCache();
    if (cache) {
      setIndex(cache.index);
      setStatus("cached");
    }

    if (!shouldFetchFresh(cache)) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/quick-10/taiex", { cache: "no-store" });
        if (!res.ok) throw new Error("fetch failed");
        const data = (await res.json()) as {
          index?: number;
          source?: string;
          fetchedAt?: string;
        };
        const next = Math.round(Number(data.index));
        if (!Number.isFinite(next) || next <= 0) throw new Error("bad index");
        if (cancelled) return;
        const { date } = taipeiClock();
        const payload: CachedTaiex = {
          index: next,
          taipeiDate: date,
          fetchedAt: data.fetchedAt ?? new Date().toISOString(),
          source: data.source,
        };
        writeCache(payload);
        setIndex(next);
        setStatus(data.source === "fallback" ? "fallback" : "live");
      } catch {
        if (!cancelled && !cache) {
          setIndex(DEFAULT_TAIEX_INDEX);
          setStatus("fallback");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { marketIndex: index, status };
}
