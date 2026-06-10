"use client";

import type { RefObject } from "react";

export type Quick10PageTab = { id: number; title: string; hint?: string };

type Quick10TabStripProps = {
  tabs: readonly Quick10PageTab[];
  scrollableTabs: readonly Quick10PageTab[];
  currentPage: number;
  onSwitch: (id: number) => void;
  scrollRef?: RefObject<HTMLDivElement | null>;
  variant: "top" | "bottom";
  showDots?: boolean;
};

export function Quick10TabStrip({
  tabs,
  scrollableTabs,
  currentPage,
  onSwitch,
  scrollRef,
  variant,
  showDots = false,
}: Quick10TabStripProps) {
  const homeTab = tabs[0];
  const stickyClass =
    variant === "top"
      ? "sticky top-2 z-20 rounded-lg border border-slate-700 bg-[#0f172a]/95 p-2 backdrop-blur-md"
      : "sticky bottom-2 z-20 -mx-0.5 rounded-lg border border-slate-700 bg-[#0f172a]/95 px-1 py-1.5 shadow-lg";

  return (
    <div className={stickyClass}>
      <div className="relative flex min-w-0 items-stretch border-b border-slate-700 pb-1">
        <div className="relative flex shrink-0 items-center border-r border-slate-700 bg-[#0f172a]/95 pl-0.5 pr-2">
          <button
            type="button"
            onClick={() => onSwitch(homeTab.id)}
            className={`relative min-w-[2.75rem] appearance-none border-0 bg-transparent px-1.5 py-1.5 text-[14px] tracking-[0.02em] shadow-none transition whitespace-nowrap ${
              currentPage === homeTab.id
                ? "font-black text-white"
                : "font-bold text-slate-400 hover:text-slate-200"
            }`}
          >
            {homeTab.title}
            {currentPage === homeTab.id ? (
              <span className="absolute inset-x-1 -bottom-1 h-[2.5px] rounded-full bg-sky-500" />
            ) : null}
          </button>
        </div>
        <div className="min-w-0 flex-1 overflow-hidden">
          <div
            ref={scrollRef}
            className="h-full w-full overflow-x-auto overflow-y-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            <div className="inline-flex items-center gap-0.5 whitespace-nowrap pl-2 pr-3">
              {scrollableTabs.map((tab) => (
                <button
                  key={`${variant}-tab-${tab.id}`}
                  type="button"
                  data-q10-tab={tab.id}
                  onClick={() => onSwitch(tab.id)}
                  className={`relative shrink-0 appearance-none border-0 bg-transparent px-1.5 py-1.5 text-[14px] tracking-[0.02em] shadow-none transition whitespace-nowrap ${
                    currentPage === tab.id
                      ? "font-black text-white"
                      : "font-bold text-slate-400 hover:text-slate-200"
                  } ${tab.id === 1 ? "text-red-300/90" : ""}`}
                >
                  {tab.title}
                  {currentPage === tab.id ? (
                    <span className="absolute inset-x-1 -bottom-1 h-[2.5px] rounded-full bg-sky-500" />
                  ) : null}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showDots ? (
        <div className="mt-2 flex min-h-[8px] justify-center overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex min-w-max justify-center gap-1.5 px-1">
            {tabs.map((tab) => (
              <button
                key={`dot-${variant}-${tab.id}`}
                type="button"
                onClick={() => onSwitch(tab.id)}
                className={`shrink-0 appearance-none border-0 bg-transparent p-0 rounded-full transition-all duration-200 ${
                  currentPage === tab.id ? "h-px w-6 bg-sky-500" : "h-px w-4 bg-slate-500/85 hover:bg-slate-300/70"
                }`}
                aria-label={`切換到${tab.title}`}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
