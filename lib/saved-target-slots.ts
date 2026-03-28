/**
 * 標的「組」槽位：每組同時存試算快照與下方自選股資料，存在本機。
 * v2 key：wf-target-slots-v2；由 v1 試算槽 + 舊版單一自選股檔遷移而來。
 */

import type { CalculatorSnapshotV1 } from "./calculator-persistence";
import { parseWatchlistPayload, type WatchlistPayload } from "./watchlist-payload";

export const TARGET_SLOTS_KEY_V2 = "wf-target-slots-v2";
export const TARGET_SLOTS_VERSION = 2 as const;
export const SAVED_TARGET_SLOT_COUNT = 5;

/** 舊：僅試算 */
const LEGACY_CALC_SLOTS_KEY = "wf-calculator-target-slots-v1";
/** 舊：單一自選股資料（遷移後寫入第 1 組） */
export const LEGACY_WATCHLIST_KEY = "wf-watchlist-notes-v1";

/** 與下方「我的自選股」彈窗同步：上次選的第幾組（0～4） */
export const WATCHLIST_SLOT_SESSION_KEY = "wf-watchlist-editing-slot";

export type TargetSlotBundle = {
  calculator: CalculatorSnapshotV1 | null;
  notes: WatchlistPayload | null;
};

type PayloadV2 = {
  v: typeof TARGET_SLOTS_VERSION;
  slots: TargetSlotBundle[];
};

type LegacyCalcV1 = {
  v: 1;
  slots: (CalculatorSnapshotV1 | null)[];
};

function emptyBundle(): TargetSlotBundle {
  return { calculator: null, notes: null };
}

function emptySlots(): TargetSlotBundle[] {
  return Array.from({ length: SAVED_TARGET_SLOT_COUNT }, () => emptyBundle());
}

function normalizeV2Slots(raw: unknown): TargetSlotBundle[] | null {
  if (typeof raw !== "object" || raw === null) return null;
  const o = raw as PayloadV2;
  if (o.v !== TARGET_SLOTS_VERSION || !Array.isArray(o.slots)) return null;
  const out = emptySlots();
  for (let i = 0; i < SAVED_TARGET_SLOT_COUNT; i++) {
    const s = o.slots[i];
    if (!s || typeof s !== "object") continue;
    const b = s as TargetSlotBundle;
    out[i] = {
      calculator: b.calculator ?? null,
      notes: b.notes ? parseWatchlistPayload(b.notes) : null,
    };
  }
  return out;
}

function migrateFromLegacy(): TargetSlotBundle[] {
  const slots = emptySlots();

  try {
    const rawCalc = typeof window !== "undefined" ? window.localStorage.getItem(LEGACY_CALC_SLOTS_KEY) : null;
    if (rawCalc) {
      const o = JSON.parse(rawCalc) as LegacyCalcV1;
      if (o?.v === 1 && Array.isArray(o.slots)) {
        for (let i = 0; i < Math.min(o.slots.length, SAVED_TARGET_SLOT_COUNT); i++) {
          slots[i].calculator = o.slots[i] ?? null;
        }
      }
    }
  } catch {
    /* ignore */
  }

  try {
    const rawNotes = typeof window !== "undefined" ? window.localStorage.getItem(LEGACY_WATCHLIST_KEY) : null;
    if (rawNotes) {
      const p = parseWatchlistPayload(JSON.parse(rawNotes) as unknown);
      if (p) slots[0].notes = p;
    }
  } catch {
    /* ignore */
  }

  try {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(LEGACY_CALC_SLOTS_KEY);
      window.localStorage.removeItem(LEGACY_WATCHLIST_KEY);
    }
  } catch {
    /* ignore */
  }

  writeBundles(slots);
  return slots;
}

function writeBundles(slots: TargetSlotBundle[]): void {
  if (typeof window === "undefined") return;
  try {
    const payload: PayloadV2 = { v: TARGET_SLOTS_VERSION, slots };
    window.localStorage.setItem(TARGET_SLOTS_KEY_V2, JSON.stringify(payload));
  } catch {
    /* quota */
  }
}

/** 讀取五組完整資料（含遷移） */
export function loadTargetBundles(): TargetSlotBundle[] {
  if (typeof window === "undefined") return emptySlots();
  try {
    const raw = window.localStorage.getItem(TARGET_SLOTS_KEY_V2);
    if (raw) {
      const parsed = JSON.parse(raw) as unknown;
      const n = normalizeV2Slots(parsed);
      if (n) return n;
      return emptySlots();
    }
    return migrateFromLegacy();
  } catch {
    return migrateFromLegacy();
  }
}

export function loadSlotCalculators(): (CalculatorSnapshotV1 | null)[] {
  return loadTargetBundles().map((b) => b.calculator);
}

export function setSlotCalculator(index: number, calculator: CalculatorSnapshotV1 | null): void {
  if (index < 0 || index >= SAVED_TARGET_SLOT_COUNT) return;
  const slots = loadTargetBundles();
  const prev = slots[index] ?? emptyBundle();
  slots[index] = { ...prev, calculator };
  writeBundles(slots);
}

export function setSlotNotes(index: number, notes: WatchlistPayload | null): void {
  if (index < 0 || index >= SAVED_TARGET_SLOT_COUNT) return;
  const slots = loadTargetBundles();
  const prev = slots[index] ?? emptyBundle();
  slots[index] = { ...prev, notes };
  writeBundles(slots);
}

export function getSlotNotes(index: number): WatchlistPayload | null {
  const b = loadTargetBundles()[index];
  return b?.notes ?? null;
}

/** @deprecated 使用 loadSlotCalculators */
export function loadSavedTargetSlots(): (CalculatorSnapshotV1 | null)[] {
  return loadSlotCalculators();
}

/** @deprecated 使用 setSlotCalculator */
export function setSavedTargetSlot(index: number, snap: CalculatorSnapshotV1 | null): void {
  setSlotCalculator(index, snap);
}
