"use client";

import Link from "next/link";
import {
  QUICK11_EXCEL_DISPLAY_NAME,
  QUICK11_EXCEL_FB_KEYWORDS,
  QUICK11_SUCCESS_BLOG_PATH,
  QUICK11_SUCCESS_BLOG_TITLE,
} from "@/lib/quick11-marketing";
import { isQuick11WizardStepDone, useQuick11WizardProgress } from "./quick11-wizard-state";

type Quick11ExcelLeadBlockProps = {
  isLight?: boolean;
  compact?: boolean;
  onOpenWizard: () => void;
};

/** 破產計算機底部：領取公式版 Excel 入口 → 四步驟彈窗 */
export function Quick11ExcelLeadBlock({ isLight = false, compact = false, onOpenWizard }: Quick11ExcelLeadBlockProps) {
  const { progress } = useQuick11WizardProgress();
  const started = progress.screenshotDone || progress.shareDone || progress.copyDone || progress.fbOpened;
  const finished = progress.activeStep >= 5;

  return (
    <div
      className={`rounded-xl border p-3 ${compact ? "p-2.5" : "p-3"} ${
        isLight
          ? "border-slate-200 bg-slate-50 text-slate-900 shadow-[0_1px_4px_rgba(0,0,0,0.05)]"
          : "border-slate-600/50 bg-slate-900/55 text-slate-100"
      }`}
    >
      <p className={`text-[15px] font-black leading-snug ${isLight ? "text-slate-900" : "text-sky-100"}`}>
        🎁 分享試算，領取公式版 Excel
      </p>
      <p className={`mt-1.5 text-[13px] leading-relaxed ${isLight ? "text-slate-700" : "text-slate-300"}`}>
        <strong>{QUICK11_EXCEL_DISPLAY_NAME}</strong>：本息攤還、DTI 破產預警公式全開，可離線改參數。
      </p>
      <p className={`mt-1.5 text-[12px] leading-relaxed ${isLight ? "text-slate-600" : "text-slate-400"}`}>
        四步驟：截圖 → 分享 → 複製密碼 → 粉專留言（關鍵字 {QUICK11_EXCEL_FB_KEYWORDS.join("／")}）自動回覆附檔。
      </p>

      <button
        type="button"
        onClick={onOpenWizard}
        className={`mt-2.5 min-h-[48px] w-full rounded-xl border px-3 py-2.5 text-[15px] font-black transition active:scale-[0.99] ${
          isLight
            ? "border-sky-500 bg-sky-600 text-white hover:bg-sky-500"
            : "border-sky-400/60 bg-sky-500/90 text-white hover:bg-sky-400"
        }`}
      >
        {finished ? "🎉 四步驟已完成 · 查看進度" : started ? "▶ 繼續四步驟領取 Excel" : "▶ 開始四步驟領取 Excel"}
      </button>

      {started && !finished ? (
        <p className={`mt-2 text-center text-[12px] font-bold ${isLight ? "text-emerald-700" : "text-emerald-300"}`}>
          進行中：步驟 {Math.min(progress.activeStep, 4)} / 4
          {isQuick11WizardStepDone(2, progress) ? " · 回來可繼續第三步" : ""}
        </p>
      ) : null}

      {!compact ? (
        <p className={`mt-2.5 border-t pt-2.5 text-[12px] leading-relaxed ${isLight ? "border-slate-200 text-slate-600" : "border-slate-700 text-slate-400"}`}>
          📌 延伸閱讀「
          <Link href={QUICK11_SUCCESS_BLOG_PATH} className="font-bold underline underline-offset-2">
            {QUICK11_SUCCESS_BLOG_TITLE}
          </Link>
          」——用時間軸拆扣款，邏輯可套回 DTI 與總利息。
        </p>
      ) : null}
    </div>
  );
}
