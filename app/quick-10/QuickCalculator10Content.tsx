"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
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
import { QUICK10_DISPLAY_NAME, QUICK10_SHARE_TAGLINE } from "./quick10-brand";
import { Q10_CONTENT_PANEL, Q10_HEADER_CARD, Q10_MAIN_BG, Q10_SECTION } from "./quick10-theme";
import { Quick10TabStrip } from "./quick10-tab-strip";

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
  const bottomTabScrollRef = useRef<HTMLDivElement>(null);

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

    const idx = SCROLLABLE_TABS.findIndex((t) => t.id === pageId);
    if (idx < 0) return;

    const btn = viewport.querySelector<HTMLButtonElement>(`[data-q10-tab="${pageId}"]`);
    if (!btn) return;

    const maxScroll = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
    const edgeTabs = 3;

    if (idx < edgeTabs) {
      viewport.scrollLeft = 0;
      return;
    }

    if (idx >= SCROLLABLE_TABS.length - edgeTabs) {
      viewport.scrollLeft = maxScroll;
      return;
    }

    const tabCenter = btn.offsetLeft + btn.offsetWidth / 2;
    const targetScroll = tabCenter - viewport.clientWidth / 2;
    viewport.scrollLeft = Math.max(0, Math.min(maxScroll, targetScroll));
  }, []);

  const switchPage = (next: number) => {
    const bounded = Math.max(0, Math.min(QUICK10_PAGE_TABS.length - 1, next));
    setPageDirection(bounded > currentPage ? 1 : -1);
    setCurrentPage(bounded);
  };

  useLayoutEffect(() => {
    syncTabStripScroll(topTabScrollRef.current, currentPage);
    syncTabStripScroll(bottomTabScrollRef.current, currentPage);
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

  return (
    <main className={`min-h-screen w-full max-w-[100vw] overflow-x-hidden px-3 py-4 pb-7 box-border flex justify-center ${Q10_MAIN_BG}`}>
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

      <div className="w-full max-w-[440px] min-w-0">
        <header className={`mb-3 rounded-xl border p-3 ${Q10_HEADER_CARD}`}>
          <div className="flex items-start justify-between gap-2">
            <p className="quick-brand-gold-shimmer text-[20px] font-black" style={{ ["--quick-brand-duration" as string]: "2.2s" }}>
              財富自由計算機
            </p>
            <button
              type="button"
              onClick={onShare}
              className="shrink-0 rounded-md border border-slate-600 bg-slate-800 px-2.5 py-1.5 text-[13px] font-bold text-slate-200 transition hover:bg-slate-700"
            >
              {shareState === "copied" ? "已複製" : "分享"}
            </button>
          </div>
          <h1 className="quick10-title-gradient mt-1 text-[32px] font-black leading-tight">{QUICK10_DISPLAY_NAME}</h1>
          <p className="mt-1 text-[13px] tracking-[0.05em] text-slate-400">{QUICK10_SHARE_TAGLINE}</p>
        </header>

        <section className={`space-y-3 rounded-xl border p-2.5 ${Q10_SECTION}`}>
          <Quick10TabStrip
            variant="top"
            tabs={QUICK10_PAGE_TABS}
            scrollableTabs={SCROLLABLE_TABS}
            currentPage={currentPage}
            onSwitch={switchPage}
            scrollRef={topTabScrollRef}
            showDots
          />

          <div className={`overflow-hidden rounded-lg border ${Q10_CONTENT_PANEL}`}>
            <AnimatePresence mode="wait" custom={pageDirection}>
              <motion.section
                key={currentPage}
                custom={pageDirection}
                variants={{
                  enter: (dir: number) => ({ x: dir >= 0 ? 90 : -90, opacity: 0 }),
                  center: { x: 0, opacity: 1 },
                  exit: (dir: number) => ({ x: dir >= 0 ? -90 : 90, opacity: 0 }),
                }}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.24, ease: "easeOut" }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.1}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -55) switchPage(currentPage + 1);
                  else if (info.offset.x > 55) switchPage(currentPage - 1);
                }}
                className="p-2.5"
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
              </motion.section>
            </AnimatePresence>
          </div>

          <Quick10TabStrip
            variant="bottom"
            tabs={QUICK10_PAGE_TABS}
            scrollableTabs={SCROLLABLE_TABS}
            currentPage={currentPage}
            onSwitch={switchPage}
            scrollRef={bottomTabScrollRef}
          />

          {currentPage === 0 ? null : (
            <p className="text-center text-[11px] font-semibold text-slate-500">
              示意試算，非投資建議；門檻與追繳規則依券商／銀行與個案為準。
            </p>
          )}

          <QuickBottomCtaStack quickId={10} style={{ fontSize: 18 }} />
          <QuickBlogLinksToggle quickRoute="/quick-10" />
          <QuickSeoExtras id={10} />
          <QuickSeoArticle id={10} />
        </section>
      </div>
    </main>
  );
}
