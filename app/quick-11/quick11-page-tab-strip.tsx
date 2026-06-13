"use client";

import { useCallback, useEffect, useRef, type MutableRefObject, type RefObject } from "react";
import styles from "./quick11-page-tab-strip.module.css";

export type Quick11PageTabItem = {
  id: number;
  title: string;
  hint?: string;
};

type Quick11PageTabStripProps = {
  tabs: readonly Quick11PageTabItem[];
  currentPage: number;
  onSwitch: (pageId: number) => void;
  /** 左側固定、不隨橫向捲動（如首頁） */
  pinnedTab?: Quick11PageTabItem;
  scrollRef?: RefObject<HTMLDivElement | null>;
  tabButtonRefs?: MutableRefObject<Record<number, HTMLButtonElement | null>>;
  isLight?: boolean;
  idPrefix?: string;
};

function useViewportRef(externalRef?: RefObject<HTMLDivElement | null>) {
  const cleanupRef = useRef<(() => void) | null>(null);

  const setViewportRef = useCallback(
    (node: HTMLDivElement | null) => {
      cleanupRef.current?.();
      cleanupRef.current = null;
      if (externalRef) externalRef.current = node;
      if (!node) return;

      let startX = 0;
      let startScrollLeft = 0;
      let dragging = false;

      const onTouchStart = (event: TouchEvent) => {
        if (event.touches.length !== 1) return;
        dragging = true;
        startX = event.touches[0].clientX;
        startScrollLeft = node.scrollLeft;
      };

      const onTouchMove = (event: TouchEvent) => {
        if (!dragging || event.touches.length !== 1) return;
        const deltaX = startX - event.touches[0].clientX;
        if (Math.abs(deltaX) > 2) {
          node.scrollLeft = startScrollLeft + deltaX;
        }
      };

      const onTouchEnd = () => {
        dragging = false;
      };

      node.addEventListener("touchstart", onTouchStart, { passive: true });
      node.addEventListener("touchmove", onTouchMove, { passive: true });
      node.addEventListener("touchend", onTouchEnd, { passive: true });
      node.addEventListener("touchcancel", onTouchEnd, { passive: true });

      cleanupRef.current = () => {
        node.removeEventListener("touchstart", onTouchStart);
        node.removeEventListener("touchmove", onTouchMove);
        node.removeEventListener("touchend", onTouchEnd);
        node.removeEventListener("touchcancel", onTouchEnd);
      };
    },
    [externalRef],
  );

  useEffect(() => () => cleanupRef.current?.(), []);

  return setViewportRef;
}

function TabButton(props: {
  tab: Quick11PageTabItem;
  active: boolean;
  isLight: boolean;
  idPrefix: string;
  tabButtonRefs?: MutableRefObject<Record<number, HTMLButtonElement | null>>;
  onSwitch: (pageId: number) => void;
  extraClassName?: string;
}) {
  const { tab, active, isLight, idPrefix, tabButtonRefs, onSwitch, extraClassName = "" } = props;
  const tabClass = active
    ? isLight
      ? styles.tabActiveLight
      : styles.tabActiveDark
    : isLight
      ? styles.tabInactiveLight
      : styles.tabInactiveDark;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      data-q11-tab={tab.id}
      ref={(el) => {
        if (tabButtonRefs) tabButtonRefs.current[tab.id] = el;
      }}
      onClick={() => onSwitch(tab.id)}
      className={`${styles.tab} ${tabClass} ${extraClassName} ${tab.id === 2 ? styles.tabFeatured : ""}`}
    >
      {tab.title}
      {tab.id === 2 ? <span className={styles.tabFeaturedDot} aria-hidden /> : null}
      {active ? (
        <span className={isLight ? styles.tabIndicatorLight : styles.tabIndicatorDark} aria-hidden />
      ) : null}
    </button>
  );
}

export function Quick11PageTabStrip({
  tabs,
  currentPage,
  onSwitch,
  pinnedTab,
  scrollRef,
  tabButtonRefs,
  isLight = false,
  idPrefix = "",
}: Quick11PageTabStripProps) {
  const setViewportRef = useViewportRef(scrollRef);

  const scrollableTrack = (
    <div className={styles.track}>
      {tabs.map((tab) => (
        <TabButton
          key={`${idPrefix}${tab.id}`}
          tab={tab}
          active={currentPage === tab.id}
          isLight={isLight}
          idPrefix={idPrefix}
          tabButtonRefs={tabButtonRefs}
          onSwitch={onSwitch}
        />
      ))}
    </div>
  );

  if (!pinnedTab) {
    return (
      <div className={styles.outer}>
        <div ref={setViewportRef} className={styles.viewport} role="tablist" aria-label="試算分頁">
          {scrollableTrack}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.row}>
      <div className={styles.pinned}>
        <TabButton
          tab={pinnedTab}
          active={currentPage === pinnedTab.id}
          isLight={isLight}
          idPrefix={idPrefix}
          tabButtonRefs={tabButtonRefs}
          onSwitch={onSwitch}
          extraClassName={styles.pinnedTab}
        />
      </div>
      <div className={styles.outer}>
        <div ref={setViewportRef} className={styles.viewport} role="tablist" aria-label="試算分頁">
          {scrollableTrack}
        </div>
      </div>
    </div>
  );
}
