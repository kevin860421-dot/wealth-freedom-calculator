/** quick-11 白底／深底 FinTech 共用樣式 */

export const Q11_WHITE_CARD =
  "rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.06),0_0_24px_rgba(59,130,246,0.06)]";

export const Q11_WHITE_GLOW =
  "rounded-xl border border-sky-100 bg-white p-4 shadow-[0_0_0_1px_rgba(226,232,240,0.9),0_8px_28px_rgba(59,130,246,0.1)]";

export const Q11_WHITE_PANEL =
  "rounded-xl border border-[#E2E8F0] bg-white shadow-[0_1px_3px_rgba(15,23,42,0.05)]";

export const Q11_DARK_CARD =
  "rounded-xl border border-slate-700 bg-[#0f172a]/95 p-4 shadow-[inset_0_1px_0_rgba(56,189,248,0.08)]";

export const Q11_DARK_GLOW =
  "rounded-xl border border-slate-600/70 bg-[#0f172a]/90 p-4 shadow-[0_0_16px_rgba(14,165,233,0.1)]";

export const Q11_DARK_PANEL =
  "rounded-xl border border-slate-700 bg-[#0f172a]/95 shadow-[inset_0_1px_0_rgba(56,189,248,0.06)]";

export const Q11_PAGE_TITLE = "text-[17px] font-black tracking-tight text-slate-800";

export const Q11_PAGE_TITLE_DARK = "text-[17px] font-black tracking-tight text-slate-100";

export const Q11_INFO_TONE_LIGHT =
  "text-slate-900 border-[#E2E8F0] bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06),0_0_20px_rgba(59,130,246,0.06)]";

export const Q11_INFO_ACCENT_LIGHT =
  "text-sky-800 border-sky-100 bg-white shadow-[0_0_24px_rgba(59,130,246,0.1)] ring-1 ring-sky-100";

export const Q11_WARN_AMBER_LIGHT =
  "text-amber-950 border-amber-200 bg-amber-50/90 shadow-[0_1px_4px_rgba(245,158,11,0.12)]";

export const Q11_INFO_TONE_DARK = "text-slate-100 border-slate-700 bg-slate-900/70";

export const Q11_INFO_ACCENT_DARK = "text-sky-100 border-sky-500/35 bg-sky-500/10";

export const Q11_WARN_AMBER_DARK = "text-amber-100 border-amber-500/35 bg-amber-500/10";

export const Q11_TABLE_HEAD_LIGHT = "sticky top-0 bg-[#F0F4F8] text-[#4A5568]";

export const Q11_TABLE_BORDER_LIGHT = "border-[#E2E8F0]";

export type Q11Theme = {
  card: string;
  glow: string;
  panel: string;
  pageTitle: string;
  sectionLabel: string;
  body: string;
  bodyStrong: string;
  muted: string;
  accent: string;
  input: string;
  inputSuffix: string;
  inlineBorder: string;
  slider: string;
  moonResultText: string;
  infoTone: string;
  infoAccent: string;
  warnAmber: string;
  gracePhase1: string;
  gracePhase1Title: string;
  gracePhase1Amount: string;
  gracePhase2: string;
  gracePhase2Title: string;
  gracePhase2Body: string;
  gracePhase2Amount: string;
  chartVariant: "light" | "dark";
  chipActive: string;
  chipInactive: string;
  btnSecondary: string;
  btnPrimary: string;
  emergencyOk: string;
  emergencyWarn: string;
  emergencyBad: string;
};

export function getQ11Theme(isLight: boolean): Q11Theme {
  if (isLight) {
    return {
      card: Q11_WHITE_CARD,
      glow: Q11_WHITE_GLOW,
      panel: Q11_WHITE_PANEL,
      pageTitle: Q11_PAGE_TITLE,
      sectionLabel: "text-[13px] font-bold uppercase tracking-wider text-[#64748B]",
      body: "text-[15px] font-semibold leading-relaxed text-slate-700",
      bodyStrong: "text-slate-800",
      muted: "text-[12px] text-slate-500",
      accent: "text-sky-700",
      input: "text-sky-700",
      inputSuffix: "text-[13px] font-bold text-slate-500",
      inlineBorder: "border-sky-500/40",
      slider: "h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-100 accent-sky-600",
      moonResultText: "text-[clamp(16px,4.5vw,20px)] font-black leading-snug tracking-tight text-slate-800",
      infoTone: Q11_INFO_TONE_LIGHT,
      infoAccent: Q11_INFO_ACCENT_LIGHT,
      warnAmber: Q11_WARN_AMBER_LIGHT,
      gracePhase1: `${Q11_WHITE_CARD} border-emerald-100 bg-gradient-to-br from-white to-emerald-50/40`,
      gracePhase1Title: "text-[13px] font-bold text-emerald-700/80",
      gracePhase1Amount: "text-[clamp(16px,4.4vw,19px)] font-bold leading-snug text-emerald-600",
      gracePhase2:
        "rounded-xl border border-red-200 bg-gradient-to-br from-red-50 to-white p-4 shadow-[0_4px_20px_rgba(220,38,38,0.08)]",
      gracePhase2Title: "text-[13px] font-bold text-red-700/90",
      gracePhase2Body: "text-[15px] font-black leading-relaxed text-red-800",
      gracePhase2Amount: "text-[clamp(18px,5vw,24px)] tabular-nums text-red-700",
      chartVariant: "light",
      chipActive: "border-[#2563EB] bg-sky-50 text-[#2563EB] shadow-[0_0_16px_rgba(59,130,246,0.12)]",
      chipInactive: "border-[#E2E8F0] bg-white text-slate-600 hover:border-sky-300",
      btnSecondary:
        "inline-flex w-full items-center justify-center rounded-lg border border-[#E2E8F0] bg-white px-4 py-3 text-[15px] font-black text-slate-800 shadow-[0_1px_4px_rgba(0,0,0,0.05)] transition hover:bg-slate-50",
      btnPrimary: "inline-flex w-full items-center justify-center rounded-lg bg-[#2563EB] px-4 py-3 text-[15px] font-black text-white transition hover:bg-blue-600",
      emergencyOk: "border-emerald-200 bg-emerald-50 text-emerald-900",
      emergencyWarn: Q11_WARN_AMBER_LIGHT,
      emergencyBad: "border-red-300 bg-red-50 text-red-900 shadow-[0_1px_6px_rgba(239,68,68,0.15)]",
    };
  }

  return {
    card: Q11_DARK_CARD,
    glow: Q11_DARK_GLOW,
    panel: Q11_DARK_PANEL,
    pageTitle: Q11_PAGE_TITLE_DARK,
    sectionLabel: "text-[13px] font-bold uppercase tracking-wider text-slate-400",
    body: "text-[15px] font-semibold leading-relaxed text-slate-200",
    bodyStrong: "text-slate-100",
    muted: "text-[12px] text-slate-400",
    accent: "text-sky-200",
    input: "text-sky-200",
    inputSuffix: "text-[13px] font-bold text-slate-400",
    inlineBorder: "border-sky-400/45",
    slider: "h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-700 accent-sky-500",
    moonResultText: "text-[clamp(16px,4.5vw,20px)] font-black leading-snug tracking-tight text-slate-100",
    infoTone: Q11_INFO_TONE_DARK,
    infoAccent: Q11_INFO_ACCENT_DARK,
    warnAmber: Q11_WARN_AMBER_DARK,
    gracePhase1: `${Q11_DARK_CARD} border-emerald-500/30 bg-gradient-to-br from-[#0f172a] to-emerald-950/30`,
    gracePhase1Title: "text-[13px] font-bold text-emerald-300/90",
    gracePhase1Amount: "text-[clamp(16px,4.4vw,19px)] font-bold leading-snug text-emerald-300",
    gracePhase2:
      "rounded-xl border border-red-500/40 bg-gradient-to-br from-red-950/40 to-[#0f172a] p-4 shadow-[0_4px_20px_rgba(220,38,38,0.12)]",
    gracePhase2Title: "text-[13px] font-bold text-red-300/90",
    gracePhase2Body: "text-[15px] font-black leading-relaxed text-red-100",
    gracePhase2Amount: "text-[clamp(18px,5vw,24px)] tabular-nums text-red-200",
    chartVariant: "dark",
    chipActive: "border-sky-400 bg-sky-500/15 text-sky-200 shadow-[0_0_16px_rgba(14,165,233,0.15)]",
    chipInactive: "border-slate-600 bg-slate-900/70 text-slate-300 hover:border-sky-500/50",
    btnSecondary:
      "inline-flex w-full items-center justify-center rounded-lg border border-slate-600 bg-slate-900/80 px-4 py-3 text-[15px] font-black text-slate-100 transition hover:bg-slate-800",
    btnPrimary: "inline-flex w-full items-center justify-center rounded-lg bg-sky-500 px-4 py-3 text-[15px] font-black text-white transition hover:bg-sky-400",
    emergencyOk: "border-emerald-500/40 bg-emerald-500/10 text-emerald-100",
    emergencyWarn: Q11_WARN_AMBER_DARK,
    emergencyBad: "border-red-500/50 bg-red-500/10 text-red-100 shadow-[0_1px_6px_rgba(239,68,68,0.12)]",
  };
}
