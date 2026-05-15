"use client";

import { useEffect, useRef, useState } from "react";
import {
  EMPTY_SIMULATION,
  serializeHeavySimPayload,
  type HeavySimPayload,
  type HeavySimWorkerResponse,
  type PeriodSnapshot,
  type SimulationResult,
} from "./home-simulation-engine";

type HeavySimState = {
  simulation: SimulationResult;
  simulationAtTargetYears: SimulationResult;
  periodSnapshots: PeriodSnapshot[];
  requiredMonthlyToAchieveInYears: number | null;
  /** worker 請求進行中（含 debounce 後等待回傳） */
  isComputing: boolean;
};

const INITIAL: HeavySimState = {
  simulation: EMPTY_SIMULATION,
  simulationAtTargetYears: EMPTY_SIMULATION,
  periodSnapshots: [],
  requiredMonthlyToAchieveInYears: null,
  isComputing: false,
};

/**
 * 將 40 年試算、累積表、建議月投入丟到 Web Worker；輸入應先經 useDebouncedValue 防抖。
 */
export function useHomeHeavySimulation(payload: HeavySimPayload, enabled = true): HeavySimState {
  const [state, setState] = useState<HeavySimState>(INITIAL);
  const workerRef = useRef<Worker | null>(null);
  const requestIdRef = useRef(0);
  const lastPayloadKeyRef = useRef<string | null>(null);

  useEffect(() => {
    const worker = new Worker(new URL("./home-simulation.worker.ts", import.meta.url));
    workerRef.current = worker;

    worker.onmessage = (event: MessageEvent<HeavySimWorkerResponse>) => {
      const data = event.data;
      if (data.id !== requestIdRef.current) return;
      setState({
        simulation: data.simulation,
        simulationAtTargetYears: data.simulationAtTargetYears,
        periodSnapshots: data.periodSnapshots,
        requiredMonthlyToAchieveInYears: data.requiredMonthlyToAchieveInYears,
        isComputing: false,
      });
    };

    return () => {
      worker.terminate();
      workerRef.current = null;
      lastPayloadKeyRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!enabled) {
      setState((prev) => ({ ...prev, isComputing: false }));
      return;
    }
    const worker = workerRef.current;
    if (!worker) return;

    const payloadKey = serializeHeavySimPayload(payload);
    if (payloadKey === lastPayloadKeyRef.current) return;
    lastPayloadKeyRef.current = payloadKey;

    requestIdRef.current += 1;
    const id = requestIdRef.current;
    setState((prev) => ({ ...prev, isComputing: true }));
    worker.postMessage({ id, payload });
  }, [payload, enabled]);

  return state;
}
