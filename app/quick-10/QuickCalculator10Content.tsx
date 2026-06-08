"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { QuickBlogLinksToggle } from "@/app/components/quick-blog-links-toggle";
import { QuickBottomCtaStack } from "@/app/components/quick-bottom-cta-stack";
import { QuickSeoArticle } from "@/app/components/quick-seo-article";
import { QuickSeoExtras } from "@/app/components/quick-seo-extras";
import { clampNum } from "@/lib/quick-calculator-math";
import { evalInput, formatTwd } from "./logic";
import { Quick10HomePanel } from "./quick10-home-panel";
import { inferPledgeLotsFromMarketValue } from "./quick10-stress-calculations";
import {
  Quick10DayTradePanel,
  Quick10LeveragePanel,
  Quick10MarginPanel,
  Quick10PledgePanel,
} from "./quick10-stress-panels";
import { Q10_DARK_SHELL } from "./quick10-shared-ui";

const QUICK10_PAGE_TABS = [
  { id: 0, title: "首頁", hint: "複利 vs 崩盤" },
  { id: 1, title: "融資斷頭", hint: "維持率追繳" },
  { id: 2, title: "質押追繳", hint: "130% 門檻" },
  { id: 3, title: "槓桿反噬", hint: "失血防禦" },
  { id: 4, title: "當沖違約", hint: "T+2 交割" },
] as const;

const SCROLLABLE_TABS = QUICK10_PAGE_TABS.slice(1);

export function QuickCalculator10Content() {
  const [shareState, setShareState] = useState<"idle" | "copied">("idle");
  const [currentPage, setCurrentPage] = useState(0);
  const [pageDirection, setPageDirection] = useState(0);
  const topTabScrollRef = useRef<HTMLDivElement>(null);

  const [buyPrice, setBuyPrice] = useState(100);
  const [buyPriceText, setBuyPriceText] = useState("100");
  const [marginRatioPct, setMarginRatioPct] = useState(60);
  const [latestPrice, setLatestPrice] = useState(85);
  const [latestPriceText, setLatestPriceText] = useState("85");
  const [marginLots, setMarginLots] = useState(5);
  const [marginLotsText, setMarginLotsText] = useState("5");
  const [marginExtraDropPct, setMarginExtraDropPct] = useState(0);

  const [pledgeMV, setPledgeMV] = useState(1_000_000);
  const [pledgeMVText, setPledgeMVText] = useState(formatTwd(1_000_000));
  const [pledgeLoan, setPledgeLoan] = useState(600_000);
  const [pledgeLoanText, setPledgeLoanText] = useState(formatTwd(600_000));
  const [pledgeCrashPct, setPledgeCrashPct] = useState(0);
  const [pledgeLots, setPledgeLots] = useState(5);

  const [levMonthly, setLevMonthly] = useState(15_000);
  const [levMonthlyText, setLevMonthlyText] = useState(formatTwd(15_000));
  const [levInvest, setLevInvest] = useState(1_000_000);
  const [levInvestText, setLevInvestText] = useState(formatTwd(1_000_000));
  const [levReserve, setLevReserve] = useState(100_000);
  const [levReserveText, setLevReserveText] = useState(formatTwd(100_000));
  const [levReturnPct, setLevReturnPct] = useState(7);

  const [dtBuy, setDtBuy] = useState(300_000);
  const [dtBuyText, setDtBuyText] = useState(formatTwd(300_000));
  const [dtBalance, setDtBalance] = useState(50_000);
  const [dtBalanceText, setDtBalanceText] = useState(formatTwd(50_000));

  useEffect(() => {
    setPledgeLots(inferPledgeLotsFromMarketValue(pledgeMV));
  }, [pledgeMV]);

  const syncTabStripScroll = useCallback((viewport: HTMLDivElement | null, pageId: number) => {
    if (!viewport || pageId <= 0) return;
    const btn = viewport.querySelector<HTMLButtonElement>(`[data-q10-tab="${pageId}"]`);
    if (!btn) return;
    const maxScroll = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
    const tabCenter = btn.offsetLeft + btn.offsetWidth / 2;
    viewport.scrollLeft = Math.max(0, Math.min(maxScroll, tabCenter - viewport.clientWidth / 2));
  }, []);

  const switchPage = (next: number) => {
    const bounded = Math.max(0, Math.min(QUICK10_PAGE_TABS.length - 1, next));
    setPageDirection(bounded > currentPage ? 1 : -1);
    setCurrentPage(bounded);
  };

  useEffect(() => {
    syncTabStripScroll(topTabScrollRef.current, currentPage);
  }, [currentPage, syncTabStripScroll]);

  const onShare = async () => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", String(currentPage));
      const nav = navigator as unknown as { share?: (v: { url?: string }) => Promise<void> };
      if (typeof nav.share === "function") {
        await nav.share({ url: url.toString() });
        return;
      }
      await navigator.clipboard.writeText(url.toString());
      setShareState("copied");
      window.setTimeout(() => setShareState("idle"), 1200);
    } catch {
      /* noop */
    }
  };

  useEffect(() => {
    queueMicrotask(() => {
      const sp = new URLSearchParams(window.location.search);
      const tab = Number(sp.get("tab"));
      if (Number.isFinite(tab) && tab >= 0 && tab <= 4) setCurrentPage(tab);
    });
  }, []);

  const tabScrollOuter = "min-w-0 flex-1 overflow-hidden";
  const tabScrollViewport =
    "h-full w-full overflow-x-auto overflow-y-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden";

  return (
    <main
      className="min-h-screen w-full max-w-[100vw] overflow-x-hidden bg-[#0b1220] px-3 py-3 pb-7 text-[#e8eefc] box-border flex justify-center"
    >
      <style jsx global>{`
        @keyframes quick10TitleGradientShift {
          0% { background-position: 0% 50%; }
          100% { background-position: 100% 50%; }
        }
        .quick10-title-gradient {
          background: linear-gradient(90deg, rgba(196,210,240,0.88), #e8eefc, rgba(120,190,210,0.95), rgba(200,180,235,0.88), rgba(196,210,240,0.88));
          background-size: 240% 100%;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          -webkit-text-fill-color: transparent;
          animation: quick10TitleGradientShift 7s ease-in-out infinite alternate;
        }
      `}</style>

      <div className="w-full max-w-[420px] min-w-0">
        <div className="mb-3">
          <div className="flex items-center justify-between gap-2">
            <div className="quick-brand-gold-shimmer min-w-0 truncate text-[22px] font-black opacity-95" style={{ ["--quick-brand-duration" as string]: "4.2s" }}>
              財富自由計算機
            </div>
            <button
              type="button"
              onClick={onShare}
              className="shrink-0 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-[16px] font-black"
            >
              {shareState === "copied" ? "已複製" : "分享"}
            </button>
          </div>
          <div className="quick10-title-gradient mt-2 text-[26px] font-black leading-tight">
            複利美夢 VS 崩盤現實
          </div>
          <p className="mt-1 text-[12px] font-semibold text-slate-400">市場崩盤壓力測試沙盒 · 拖曳滑桿即時看追繳臨界</p>
        </div>

        <div className={`${Q10_DARK_SHELL} space-y-2`}>
          <div className="sticky top-2 z-20 rounded-lg border border-slate-700 bg-[#0f172a]/95 p-2 backdrop-blur-md">
            <div className="relative flex min-w-0 items-stretch border-b border-slate-700 pb-1">
              <div className="relative flex shrink-0 items-center border-r border-slate-700 bg-[#0f172a]/95 pr-2 pl-0.5">
                <button
                  type="button"
                  onClick={() => switchPage(0)}
                  className={`relative min-w-[2.75rem] whitespace-nowrap px-1.5 py-1.5 text-[14px] transition ${
                    currentPage === 0 ? "font-black text-white" : "font-bold text-slate-400 hover:text-slate-200"
                  }`}
                >
                  首頁
                  {currentPage === 0 ? <span className="absolute inset-x-1 -bottom-1 h-[2.5px] rounded-full bg-sky-500" /> : null}
                </button>
              </div>
              <div className={tabScrollOuter}>
                <div ref={topTabScrollRef} className={tabScrollViewport} style={{ WebkitOverflowScrolling: "touch" }}>
                  <div className="inline-flex items-center gap-0.5 whitespace-nowrap pl-2 pr-3">
                    {SCROLLABLE_TABS.map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        data-q10-tab={tab.id}
                        onClick={() => switchPage(tab.id)}
                        className={`relative shrink-0 whitespace-nowrap px-1.5 py-1.5 text-[13px] transition ${
                          currentPage === tab.id ? "font-black text-white" : "font-bold text-slate-400 hover:text-slate-200"
                        } ${tab.id === 1 ? "text-red-300/90" : ""}`}
                      >
                        {tab.title}
                        {currentPage === tab.id ? <span className="absolute inset-x-1 -bottom-1 h-[2.5px] rounded-full bg-sky-500" /> : null}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-2 flex min-h-[8px] justify-center overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="flex min-w-max justify-center gap-1.5 px-1">
                {QUICK10_PAGE_TABS.map((tab) => (
                  <button
                    key={`dot-${tab.id}`}
                    type="button"
                    onClick={() => switchPage(tab.id)}
                    className={`shrink-0 rounded-full p-0 transition-all ${
                      currentPage === tab.id ? "h-px w-6 bg-sky-500" : "h-px w-4 bg-slate-500/85 hover:bg-slate-300/70"
                    }`}
                    aria-label={`切換到${tab.title}`}
                  />
                ))}
              </div>
            </div>
          </div>

          <AnimatePresence mode="wait" custom={pageDirection}>
            <motion.div
              key={currentPage}
              custom={pageDirection}
              initial={{ opacity: 0, x: pageDirection >= 0 ? 16 : -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: pageDirection >= 0 ? -16 : 16 }}
              transition={{ duration: 0.18 }}
              className="min-w-0"
            >
              {currentPage === 0 ? (
                <Quick10HomePanel embedded />
              ) : currentPage === 1 ? (
                <Quick10MarginPanel
                  state={{
                    buyPrice,
                    buyPriceText,
                    marginRatioPct,
                    latestPrice,
                    latestPriceText,
                    lots: marginLots,
                    lotsText: marginLotsText,
                    extraDropPct: marginExtraDropPct,
                  }}
                  h={{
                    setBuyPriceText: setBuyPriceText,
                    commitBuyPrice: () => {
                      const n = Math.max(0.01, evalInput(buyPriceText, buyPrice, 1, 3000));
                      setBuyPrice(n);
                      setBuyPriceText(String(n));
                    },
                    bumpBuyPrice: (d) => {
                      const n = clampNum(buyPrice + d, 1, 3000);
                      setBuyPrice(n);
                      setBuyPriceText(String(n));
                    },
                    setMarginRatioPct,
                    setLatestPriceText,
                    commitLatestPrice: () => {
                      const n = Math.max(0, evalInput(latestPriceText, latestPrice, 0, 3000));
                      setLatestPrice(n);
                      setLatestPriceText(String(n));
                    },
                    bumpLatestPrice: (d) => {
                      const n = clampNum(latestPrice + d, 0, 3000);
                      setLatestPrice(n);
                      setLatestPriceText(String(n));
                    },
                    setLotsText: setMarginLotsText,
                    commitLots: () => {
                      const n = Math.round(clampNum(evalInput(marginLotsText, marginLots, 0, 999, true), 0, 999));
                      setMarginLots(n);
                      setMarginLotsText(String(n));
                    },
                    bumpLots: (d) => {
                      const n = Math.round(clampNum(marginLots + d, 0, 999));
                      setMarginLots(n);
                      setMarginLotsText(String(n));
                    },
                    setExtraDropPct: setMarginExtraDropPct,
                  }}
                />
              ) : currentPage === 2 ? (
                <Quick10PledgePanel
                  state={{
                    marketValue: pledgeMV,
                    marketValueText: pledgeMVText,
                    loanAmount: pledgeLoan,
                    loanAmountText: pledgeLoanText,
                    crashPct: pledgeCrashPct,
                    pledgeLots,
                  }}
                  h={{
                    setMarketValueText: setPledgeMVText,
                    commitMarketValue: () => {
                      const n = Math.round(clampNum(evalInput(pledgeMVText.replace(/,/g, ""), pledgeMV, 0, 50_000_000), 0, 50_000_000));
                      setPledgeMV(n);
                      setPledgeMVText(formatTwd(n));
                    },
                    bumpMarketValue: (d) => {
                      const n = Math.round(clampNum(pledgeMV + d, 0, 50_000_000));
                      setPledgeMV(n);
                      setPledgeMVText(formatTwd(n));
                    },
                    setLoanAmountText: setPledgeLoanText,
                    commitLoanAmount: () => {
                      const n = Math.round(clampNum(evalInput(pledgeLoanText.replace(/,/g, ""), pledgeLoan, 0, 50_000_000), 0, 50_000_000));
                      setPledgeLoan(n);
                      setPledgeLoanText(formatTwd(n));
                    },
                    bumpLoanAmount: (d) => {
                      const n = Math.round(clampNum(pledgeLoan + d, 0, 50_000_000));
                      setPledgeLoan(n);
                      setPledgeLoanText(formatTwd(n));
                    },
                    setCrashPct: setPledgeCrashPct,
                  }}
                />
              ) : currentPage === 3 ? (
                <Quick10LeveragePanel
                  state={{
                    monthlyLoanPayment: levMonthly,
                    monthlyLoanPaymentText: levMonthlyText,
                    investmentTotal: levInvest,
                    investmentTotalText: levInvestText,
                    emergencyReserve: levReserve,
                    emergencyReserveText: levReserveText,
                    marketReturnPct: levReturnPct,
                  }}
                  h={{
                    setMonthlyLoanPaymentText: setLevMonthlyText,
                    commitMonthlyLoanPayment: () => {
                      const n = Math.round(clampNum(evalInput(levMonthlyText.replace(/,/g, ""), levMonthly, 0, 500_000), 0, 500_000));
                      setLevMonthly(n);
                      setLevMonthlyText(formatTwd(n));
                    },
                    bumpMonthlyLoanPayment: (d) => {
                      const n = Math.round(clampNum(levMonthly + d, 0, 500_000));
                      setLevMonthly(n);
                      setLevMonthlyText(formatTwd(n));
                    },
                    setInvestmentTotalText: setLevInvestText,
                    commitInvestmentTotal: () => {
                      const n = Math.round(clampNum(evalInput(levInvestText.replace(/,/g, ""), levInvest, 0, 50_000_000), 0, 50_000_000));
                      setLevInvest(n);
                      setLevInvestText(formatTwd(n));
                    },
                    bumpInvestmentTotal: (d) => {
                      const n = Math.round(clampNum(levInvest + d, 0, 50_000_000));
                      setLevInvest(n);
                      setLevInvestText(formatTwd(n));
                    },
                    setEmergencyReserveText: setLevReserveText,
                    commitEmergencyReserve: () => {
                      const n = Math.round(clampNum(evalInput(levReserveText.replace(/,/g, ""), levReserve, 0, 10_000_000), 0, 10_000_000));
                      setLevReserve(n);
                      setLevReserveText(formatTwd(n));
                    },
                    bumpEmergencyReserve: (d) => {
                      const n = Math.round(clampNum(levReserve + d, 0, 10_000_000));
                      setLevReserve(n);
                      setLevReserveText(formatTwd(n));
                    },
                    setMarketReturnPct: setLevReturnPct,
                  }}
                />
              ) : (
                <Quick10DayTradePanel
                  state={{
                    buyTotal: dtBuy,
                    buyTotalText: dtBuyText,
                    accountBalance: dtBalance,
                    accountBalanceText: dtBalanceText,
                  }}
                  h={{
                    setBuyTotalText: setDtBuyText,
                    commitBuyTotal: () => {
                      const n = Math.round(clampNum(evalInput(dtBuyText.replace(/,/g, ""), dtBuy, 0, 20_000_000), 0, 20_000_000));
                      setDtBuy(n);
                      setDtBuyText(formatTwd(n));
                    },
                    bumpBuyTotal: (d) => {
                      const n = Math.round(clampNum(dtBuy + d, 0, 20_000_000));
                      setDtBuy(n);
                      setDtBuyText(formatTwd(n));
                    },
                    setAccountBalanceText: setDtBalanceText,
                    commitAccountBalance: () => {
                      const n = Math.round(clampNum(evalInput(dtBalanceText.replace(/,/g, ""), dtBalance, 0, 20_000_000), 0, 20_000_000));
                      setDtBalance(n);
                      setDtBalanceText(formatTwd(n));
                    },
                    bumpAccountBalance: (d) => {
                      const n = Math.round(clampNum(dtBalance + d, 0, 20_000_000));
                      setDtBalance(n);
                      setDtBalanceText(formatTwd(n));
                    },
                  }}
                />
              )}
            </motion.div>
          </AnimatePresence>

          {currentPage === 0 ? null : (
            <p className="text-center text-[11px] font-semibold text-slate-500">
              示意試算，非投資建議；門檻與追繳規則依券商／銀行與個案為準。
            </p>
          )}

          <QuickBottomCtaStack quickId={10} style={{ fontSize: 18 }} />
          <QuickBlogLinksToggle quickRoute="/quick-10" />
          <QuickSeoExtras id={10} />
          <QuickSeoArticle id={10} />
        </div>
      </div>
    </main>
  );
}
