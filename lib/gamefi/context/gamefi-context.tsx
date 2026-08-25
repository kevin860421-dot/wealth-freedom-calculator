"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const ACTION_COUNT_KEY = "gamefi:action-count";
const ACTION_THRESHOLD = 3;
const DEBOUNCE_MS = 400;

export type GameFiCardView = {
  id: string;
  cardSlug: string;
  cardName: string;
  level: number;
  attack: number;
  defensePct: number;
  story: string;
};

type GameFiContextValue = {
  clickCount: number;
  showGachaModal: boolean;
  totalAttack: number;
  cards: GameFiCardView[];
  cardsLoading: boolean;
  incrementActionCount: () => void;
  setShowGachaModal: (open: boolean) => void;
  refreshCards: () => Promise<void>;
  applySummonResult: (card: GameFiCardView) => void;
};

const GameFiContext = createContext<GameFiContextValue | null>(null);

function readStoredCount(): number {
  if (typeof window === "undefined") return 0;
  const raw = window.localStorage.getItem(ACTION_COUNT_KEY);
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function writeStoredCount(count: number): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ACTION_COUNT_KEY, String(count));
}

export function GameFiProvider({ children }: { children: ReactNode }) {
  const [clickCount, setClickCount] = useState(0);
  const [showGachaModal, setShowGachaModal] = useState(false);
  const [cards, setCards] = useState<GameFiCardView[]>([]);
  const [cardsLoading, setCardsLoading] = useState(true);
  const [lastBumpAt, setLastBumpAt] = useState(0);

  useEffect(() => {
    setClickCount(readStoredCount());
  }, []);

  const refreshCards = useCallback(async () => {
    setCardsLoading(true);
    try {
      const res = await fetch("/api/gamefi/cards", {
        credentials: "include",
        headers: { Accept: "application/json" },
      });
      if (!res.ok) {
        if (res.status === 401) {
          setCards([]);
          return;
        }
        return;
      }
      const body = (await res.json()) as {
        cards: GameFiCardView[];
        totalAttack: number;
      };
      setCards(body.cards ?? []);
    } catch {
      // 訪客或未登入時靜默失敗
    } finally {
      setCardsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshCards();
  }, [refreshCards]);

  const incrementActionCount = useCallback(() => {
    const now = Date.now();
    if (now - lastBumpAt < DEBOUNCE_MS) return;
    setLastBumpAt(now);

    setClickCount((prev) => {
      const next = prev + 1;
      if (next >= ACTION_THRESHOLD) {
        writeStoredCount(0);
        setShowGachaModal(true);
        return 0;
      }
      writeStoredCount(next);
      return next;
    });
  }, [lastBumpAt]);

  const applySummonResult = useCallback((card: GameFiCardView) => {
    setCards((prev) => {
      const idx = prev.findIndex((item) => item.cardSlug === card.cardSlug);
      if (idx === -1) return [card, ...prev];
      const next = [...prev];
      next[idx] = card;
      return next.sort((a, b) => b.attack - a.attack);
    });
  }, []);

  const totalAttack = useMemo(
    () => cards.reduce((sum, card) => sum + card.attack, 0),
    [cards],
  );

  const value = useMemo<GameFiContextValue>(
    () => ({
      clickCount,
      showGachaModal,
      totalAttack,
      cards,
      cardsLoading,
      incrementActionCount,
      setShowGachaModal,
      refreshCards,
      applySummonResult,
    }),
    [
      clickCount,
      showGachaModal,
      totalAttack,
      cards,
      cardsLoading,
      incrementActionCount,
      refreshCards,
      applySummonResult,
    ],
  );

  return (
    <GameFiContext.Provider value={value}>{children}</GameFiContext.Provider>
  );
}

export function useGameFi(): GameFiContextValue {
  const ctx = useContext(GameFiContext);
  if (!ctx) {
    throw new Error("useGameFi 必須在 GameFiProvider 內使用");
  }
  return ctx;
}
