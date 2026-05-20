"use client";

import Link from "next/link";
import { pickQuickCrossLinks } from "@/lib/quick-cross-links";

type QuickCalculatorCrossLinksProps = {
  currentQuickId: number;
  isLight?: boolean;
};

export function QuickCalculatorCrossLinks({ currentQuickId, isLight = false }: QuickCalculatorCrossLinksProps) {
  const links = pickQuickCrossLinks(currentQuickId, 3);
  if (links.length === 0) return null;

  return (
    <nav
      aria-labelledby={`quick-${currentQuickId}-cross-links-heading`}
      className={`rounded-xl border px-3 py-3 ${
        isLight ? "border-slate-200 bg-slate-50" : "border-slate-600/50 bg-slate-900/50"
      }`}
    >
      <h2
        id={`quick-${currentQuickId}-cross-links-heading`}
        className={`text-[14px] font-black leading-snug ${isLight ? "text-slate-900" : "text-slate-100"}`}
      >
        🔗 站內其他小計算機
      </h2>
      <p className={`mt-1 text-[12px] font-semibold leading-relaxed ${isLight ? "text-slate-600" : "text-slate-400"}`}>
        與本頁主題相近，可接著試算
      </p>
      <ul className="mt-2.5 flex list-none flex-col gap-2 p-0">
        {links.map((item) => (
          <li key={item.id} className="list-none">
            <Link
              href={item.href}
              className={`flex min-h-[44px] w-full items-center justify-center rounded-lg border px-3 py-3 text-center transition active:scale-[0.99] ${
                isLight
                  ? "border-slate-200 bg-white text-slate-900 hover:border-sky-300 hover:bg-sky-50/80"
                  : "border-slate-600/60 bg-slate-800/40 text-slate-100 hover:border-sky-500/50 hover:bg-slate-800/80"
              }`}
            >
              <span className="text-[16px] font-black leading-snug">{item.title}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
