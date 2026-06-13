"use client";

import Link from "next/link";
import { useState } from "react";
import { HomeMobileTaxNhiRow } from "@/app/components/home-mobile-tax-nhi-row";
import { QuickBlogLinksToggle } from "@/app/components/quick-blog-links-toggle";
import { QuickBottomCtaStack } from "@/app/components/quick-bottom-cta-stack";
import { QuickSeoArticle } from "@/app/components/quick-seo-article";
import { QuickSeoExtras } from "@/app/components/quick-seo-extras";
import { QUICK13_DISPLAY_TITLE } from "./display-title";
import { useQuick13TaxNhiState } from "./use-quick13-tax-nhi-state";

export function QuickCalculator13Content({ embeddedInMiniBlog = false }: { embeddedInMiniBlog?: boolean } = {}) {
  const [isLight, setIsLight] = useState(false);
  const [taxNhiOpen, setTaxNhiOpen] = useState(true);
  const taxNhi = useQuick13TaxNhiState();

  return (
    <main
      className={`${embeddedInMiniBlog ? "min-h-0" : "min-h-screen"} py-2.5 px-1.5 sm:px-2 ${
        isLight ? "bg-white text-slate-900" : "bg-[#020817] text-slate-100"
      }`}
    >
      <div className={`mx-auto w-full max-w-lg ${embeddedInMiniBlog ? "" : "pb-6"}`}>
        <header
          className={`mb-2.5 rounded-xl border p-2.5 ${
            isLight ? "border-slate-200 bg-slate-100 shadow-[0_1px_4px_rgba(0,0,0,0.05)]" : "border-slate-700 bg-[#0f172a]"
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <p className={`text-[15px] font-black tracking-wide ${isLight ? "text-sky-800" : "text-sky-300"}`}>
              財富自由計算機 · 第 13 台
            </p>
            <button
              type="button"
              onClick={() => setIsLight((v) => !v)}
              className={`shrink-0 rounded-md border px-2 py-1 text-[11px] font-bold ${
                isLight ? "border-slate-200 bg-white text-slate-900" : "border-slate-600 bg-slate-800 text-slate-200"
              }`}
              aria-label="切換淺色或深色"
            >
              {isLight ? "深" : "淺"}
            </button>
          </div>
          <h1
            className={`mt-1 text-[1.12rem] font-black leading-snug sm:text-[1.28rem] ${isLight ? "text-slate-900" : "text-white"}`}
          >
            {QUICK13_DISPLAY_TITLE}
          </h1>
          <p className={`mt-2 text-[12px] font-semibold leading-relaxed ${isLight ? "text-slate-600" : "text-slate-400"}`}>
            與主站手機版相同：股利試算、所得稅、54C 與二代健保補充保費，一次對齊扣完還剩多少。
          </p>
        </header>

        <div className="-mt-1 mb-1 flex justify-end">
          <button
            type="button"
            onClick={() => setTaxNhiOpen((o) => !o)}
            aria-expanded={taxNhiOpen}
            aria-label={taxNhiOpen ? "收合二代健保與稅金試算" : "展開二代健保與稅金試算"}
            className={`px-1 py-0.5 text-base leading-none ${isLight ? "text-slate-500" : "text-slate-400"}`}
          >
            {taxNhiOpen ? "▲" : "▼"}
          </button>
        </div>

        {taxNhiOpen ? <HomeMobileTaxNhiRow {...taxNhi} /> : null}

        {!embeddedInMiniBlog ? (
          <>
            <div className="mt-3">
              <QuickBlogLinksToggle quickRoute="/quick-13" title="📚 二代健保與稅金延伸文章（點我展開）" />
            </div>
            <QuickBottomCtaStack quickId={13} />
            <QuickSeoArticle id={13} />
            <QuickSeoExtras id={13} />
            <p className={`mt-4 text-center text-[11px] ${isLight ? "text-slate-500" : "text-slate-500"}`}>
              <Link href="/" className="underline underline-offset-2">
                回到財富自由計算機主站
              </Link>
            </p>
          </>
        ) : null}
      </div>
    </main>
  );
}

export default QuickCalculator13Content;
