"use client";

type Quick10ExcelChartCtaProps = {
  onClick: () => void;
  busy?: boolean;
};

export function Quick10ExcelChartCta({ onClick, busy = false }: Quick10ExcelChartCtaProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className="flex w-full items-center justify-center gap-2 rounded-xl border border-sky-500/45 bg-gradient-to-r from-sky-950/80 via-slate-900/90 to-emerald-950/70 px-4 py-3.5 text-[15px] font-black tracking-wide text-sky-100 shadow-[0_0_20px_rgba(14,165,233,0.18),inset_0_1px_0_rgba(56,189,248,0.12)] transition active:scale-[0.99] hover:border-sky-400/60 hover:text-white disabled:opacity-60"
    >
      <span aria-hidden>📥</span>
      {busy ? "產生中…" : "下載 Excel 圖表"}
    </button>
  );
}
