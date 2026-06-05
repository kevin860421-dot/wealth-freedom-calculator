"use client";

import { useState } from "react";
import { Quick11ExitIntentModal } from "../quick11-exit-intent-modal";

/** 離開彈窗預覽：免等 45 秒，改完存檔後刷新即可看效果 */
export function Quick11ExitModalPreviewClient() {
  const [modalKey, setModalKey] = useState(0);

  return (
    <div className="min-h-[100dvh] bg-[#0b0f14]">
      <div className="sticky top-0 z-[90] flex flex-wrap items-center justify-between gap-2 border-b border-amber-500/40 bg-amber-400/95 px-3 py-2.5 text-[13px] font-bold text-amber-950">
        <span>🛠 離開彈窗 · 預覽模式（不寫入 session，免等 45 秒）</span>
        <button
          type="button"
          onClick={() => setModalKey((k) => k + 1)}
          className="rounded-lg bg-amber-950 px-3 py-1.5 text-[12px] font-black text-amber-100 hover:bg-black"
        >
          重新打開彈窗
        </button>
      </div>

      <div className="mx-auto max-w-lg px-4 py-10 text-center text-slate-500">
        <p className="text-[15px] font-bold text-slate-400">背景占位頁</p>
        <p className="mt-2 text-[13px] leading-relaxed">
          正式環境請在 <strong className="text-slate-300">/quick-11</strong> 破產計算機頁觸發。
          <br />
          關閉彈窗後按上方「重新打開」繼續調整樣式。
        </p>
      </div>

      <Quick11ExitIntentModal key={modalKey} previewMode />
    </div>
  );
}
