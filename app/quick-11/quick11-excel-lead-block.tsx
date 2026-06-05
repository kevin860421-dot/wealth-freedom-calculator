"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import {
  QUICK11_EXCEL_DOWNLOAD_PATH,
  QUICK11_EXCEL_FB_KEYWORDS,
  QUICK11_EXCEL_UNLOCK_CODE,
  isQuick11FbMessengerConfigured,
  QUICK11_SUCCESS_BLOG_PATH,
  QUICK11_SUCCESS_BLOG_TITLE,
} from "@/lib/quick11-marketing";
import { copyQuick11UnlockAndOpenFb } from "./quick11-excel-actions";
import { useQuick11ShareUnlock } from "./quick11-share-unlock";

type Quick11ExcelLeadBlockProps = {
  isLight?: boolean;
  compact?: boolean;
  /** 第二段說明下方插入（例：分享試算結果按鈕） */
  shareSlot?: React.ReactNode;
};

/** 破產計算機／專文底部：先分享 → 解鎖 Excel 下載／粉專索取 */
export function Quick11ExcelLeadBlock({ isLight = false, compact = false, shareSlot }: Quick11ExcelLeadBlockProps) {
  const { unlocked } = useQuick11ShareUnlock();
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");
  const fbReady = isQuick11FbMessengerConfigured();

  const onCopyAndGo = useCallback(async () => {
    if (!unlocked) return;
    const copied = await copyQuick11UnlockAndOpenFb();
    if (copied) {
      setCopyState("copied");
      window.setTimeout(() => setCopyState("idle"), 2000);
    }
  }, [unlocked]);

  return (
    <div
      className={`rounded-xl border p-3 ${compact ? "p-2.5" : "p-3"} ${
        isLight
          ? "border-slate-200 bg-slate-50 text-slate-900 shadow-[0_1px_4px_rgba(0,0,0,0.05)]"
          : "border-slate-600/50 bg-slate-900/55 text-slate-100"
      }`}
    >
      <p className={`text-[15px] font-black leading-snug ${isLight ? "text-slate-900" : "text-sky-100"}`}>
        🎁 獨立開發者送你的「無痛減壓工具包」
      </p>
      <p className={`mt-1.5 text-[13px] leading-relaxed ${isLight ? "text-slate-700" : "text-slate-300"}`}>
        網頁一關，試算數字就沒了。我把<strong>本息攤還</strong>與 <strong>DTI 破產預警</strong> 公式打包成可改參數的 Excel 範本（公式全開、可離線保存）。
      </p>
      <p className={`mt-1.5 text-[12px] leading-relaxed ${isLight ? "text-slate-600" : "text-slate-400"}`}>
        <strong>第一步：</strong>先按下方分享試算結果。
        <strong className="ml-1">第二步：</strong>解鎖後可下載 Excel，或到粉專私訊
        {QUICK11_EXCEL_FB_KEYWORDS.map((kw) => (
          <code key={kw} className="mx-0.5 rounded bg-black/15 px-1 py-0.5 font-mono text-[11px]">
            {kw}
          </code>
        ))}
        自動索取。
      </p>

      {shareSlot ? <div className="mt-2">{shareSlot}</div> : null}

      {!unlocked ? (
        <div className="mt-2.5">
          <p
            className={`rounded-lg border px-3 py-2.5 text-center text-[13px] font-bold ${
              isLight ? "border-amber-200 bg-amber-50 text-amber-900" : "border-amber-500/40 bg-amber-500/10 text-amber-100"
            }`}
          >
            🔒 請先分享試算結果，再解鎖 Excel
          </p>
          {!shareSlot ? (
            <Link
              href="/quick-11#quick11-excel-lead"
              className={`mt-2 block text-center text-[13px] font-bold underline underline-offset-2 ${isLight ? "text-sky-700" : "text-sky-300"}`}
            >
              至破產計算機分享解鎖 →
            </Link>
          ) : null}
        </div>
      ) : (
        <div className="mt-2.5 flex flex-col gap-2">
          <p className={`text-center text-[12px] font-bold ${isLight ? "text-emerald-700" : "text-emerald-300"}`}>
            ✅ 已解鎖 · 密碼 <code className="font-mono">{QUICK11_EXCEL_UNLOCK_CODE}</code>
          </p>
          <button
            type="button"
            onClick={() => void onCopyAndGo()}
            className={`min-h-[44px] w-full rounded-lg border px-3 py-2.5 text-[14px] font-black transition active:scale-[0.99] ${
              isLight
                ? "border-sky-500 bg-sky-600 text-white hover:bg-sky-500"
                : "border-sky-400/60 bg-sky-500/90 text-white hover:bg-sky-400"
            }`}
          >
            {copyState === "copied"
              ? fbReady
                ? "✅ 已複製密碼，粉專私訊已開啟"
                : "✅ 已複製密碼，請到粉專私訊貼上"
              : "📥 複製密碼 → 前往粉專領 Excel"}
          </button>
          <a
            href={QUICK11_EXCEL_DOWNLOAD_PATH}
            className={`min-h-[40px] w-full rounded-lg border px-3 py-2 text-center text-[13px] font-bold leading-[40px] ${
              isLight ? "border-emerald-300 bg-emerald-50 text-emerald-900" : "border-emerald-500/50 bg-emerald-500/10 text-emerald-100"
            }`}
          >
            ⬇️ 下載 Excel 範本（已解鎖）
          </a>
          {!fbReady && process.env.NODE_ENV === "development" ? (
            <p className={`text-center text-[11px] ${isLight ? "text-amber-800" : "text-amber-200/90"}`}>
              本機尚未設定 NEXT_PUBLIC_FB_PAGE_URL（m.me 私訊連結）
            </p>
          ) : null}
        </div>
      )}
      {!compact ? (
        <p className={`mt-2.5 border-t pt-2.5 text-[12px] leading-relaxed ${isLight ? "border-slate-200 text-slate-600" : "border-slate-700 text-slate-400"}`}>
          📌 為什麼推薦再讀「
          <Link href={QUICK11_SUCCESS_BLOG_PATH} className="font-bold underline underline-offset-2">
            {QUICK11_SUCCESS_BLOG_TITLE}
          </Link>
          」？它用同一條時間軸拆「入帳 vs 扣款」，標題直打長尾關鍵字，所以搜尋與完讀都不錯——貸款也該用這種試算邏輯。
        </p>
      ) : null}
    </div>
  );
}
