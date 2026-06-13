"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useLayoutEffect, useRef, type RefObject } from "react";

export function fitTextToContainerWidth(line: HTMLElement, containerWidth: number, minPx: number, maxPx: number) {
  if (containerWidth <= 0) return;
  line.style.fontSize = `${maxPx}px`;
  if (line.scrollWidth <= containerWidth) return;
  let lo = minPx;
  let hi = maxPx;
  for (let i = 0; i < 24; i += 1) {
    const mid = (lo + hi) / 2;
    line.style.fontSize = `${mid}px`;
    if (line.scrollWidth <= containerWidth) lo = mid;
    else hi = mid;
  }
  line.style.fontSize = `${lo}px`;
}

/** 依容器寬度縮放單一元素字級（input、標題列等） */
export function useShrinkFitElement(
  elementRef: RefObject<HTMLElement | null>,
  deps: readonly unknown[],
  minPx: number,
  maxPx: number,
) {
  const fit = useCallback(() => {
    const el = elementRef.current;
    if (!el) return;
    fitTextToContainerWidth(el, el.clientWidth, minPx, maxPx);
  }, [elementRef, minPx, maxPx]);

  useLayoutEffect(() => {
    fit();
    const id = requestAnimationFrame(() => fit());
    return () => cancelAnimationFrame(id);
  }, [...deps, fit]);

  useEffect(() => {
    const el = elementRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => fit());
    ro.observe(el);
    return () => ro.disconnect();
  }, [elementRef, fit]);
}

/** 依容器寬度縮放字級（標題、欄位名等） */
export function ShrinkFitText(props: { children: string; className?: string; minPx?: number; maxPx?: number }) {
  const { children, className = "", minPx = 9, maxPx = 16 } = props;
  const containerRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLSpanElement>(null);

  const fit = useCallback(() => {
    const container = containerRef.current;
    const line = lineRef.current;
    if (!container || !line) return;
    fitTextToContainerWidth(line, container.clientWidth, minPx, maxPx);
  }, [minPx, maxPx]);

  useLayoutEffect(() => {
    fit();
    const id = requestAnimationFrame(() => fit());
    return () => cancelAnimationFrame(id);
  }, [children, fit]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => fit());
    ro.observe(el);
    return () => ro.disconnect();
  }, [fit]);

  return (
    <div ref={containerRef} className="min-w-0 w-full flex-1 overflow-hidden">
      <span ref={lineRef} className={`block whitespace-nowrap leading-tight ${className}`} style={{ fontSize: maxPx }}>
        {children}
      </span>
    </div>
  );
}

/** 首頁 InfoCard 金額：依寬度縮放，避免 NT$ 45,564 被截成 … */
export function ShrinkFitCardAmount(props: { animKey: string; children: string; minPx?: number; maxPx?: number }) {
  const { animKey, children, minPx = 9, maxPx = 21 } = props;
  const containerRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLParagraphElement>(null);

  const fit = useCallback(() => {
    const container = containerRef.current;
    const line = lineRef.current;
    if (!container || !line) return;
    fitTextToContainerWidth(line, container.clientWidth, minPx, maxPx);
  }, [minPx, maxPx]);

  useLayoutEffect(() => {
    fit();
    const id = requestAnimationFrame(() => fit());
    return () => cancelAnimationFrame(id);
  }, [children, fit]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => fit());
    ro.observe(el);
    return () => ro.disconnect();
  }, [fit]);

  return (
    <div ref={containerRef} className="min-w-0 w-full overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={animKey}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -14 }}
          transition={{ duration: 0.24, ease: "easeOut" }}
        >
          <p
            ref={lineRef}
            className="whitespace-nowrap font-mono font-black leading-none tracking-[-0.015em] tabular-nums text-inherit"
            style={{ fontSize: maxPx }}
          >
            {children}
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
