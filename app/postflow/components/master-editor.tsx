"use client";

import { useEffect, useState } from "react";
import { Sparkles, Copy, Check, X } from "lucide-react";

/* 品牌色以 hex 顯示，tab badge 用半透明覆蓋 */
const PLATFORMS = [
  { id: "blogger",   label: "Blogger",  hex: "#FF5722" },
  { id: "facebook",  label: "FB",       hex: "#1877F2" },
  { id: "instagram", label: "IG",       hex: "#C32AA3" },
  { id: "threads",   label: "Threads",  hex: "#9E9FA0" },
  { id: "dcard",     label: "Dcard",    hex: "#EE4D5E" },
  { id: "vocus",     label: "方格子",   hex: "#F59E0B" },
  { id: "mobile01",  label: "Mobile01", hex: "#EA580C" },
  { id: "pixnet",    label: "痞客邦",   hex: "#FF6600" },
  { id: "medium",    label: "Medium",   hex: "#525252" },
];

const MOCK_PREVIEW: Record<string, string> = {
  blogger:   "【財富自由計算機｜完整教學】\n\n這篇文章帶你了解如何把 54C、二代健保補充保費、手續費全部納入試算...\n\n▶ 第一步：設定年化報酬率與目標月領金額\n▶ 第二步：開啟稅務選項，檢視每期扣除\n▶ 第三步：匯出 Excel 比較保守與中性情境",
  facebook:  "📊 【財富自由計算機｜你離退休還有幾年？】\n\n很多人規劃 FIRE 時，忽略了隱形成本——二代健保、54C、手續費……\n\n➡ 掃碼試算，找出你真正的退休年期！\n\n#財富自由 #ETF #退休規劃",
  instagram: "✨ 你的財富自由倒數計時，開始了嗎？\n\n每個月多存一點點，退休時間可以縮短好幾年。\n我用計算機算出來的——你呢？\n\n👇 連結在 bio\n\n#FIRE #財富自由 #投資理財 #ETF台股",
  threads:   "沒算稅的財富自由試算，只是紙上富貴。\n\n二代健保補充保費 + 所得稅 + 手續費，這些每期都在吃掉你的複利。\n\n試算看看，你離退休還有幾年？👇",
  dcard:     "分享一個自己做的財富自由計算機\n\n因為市面上大多數試算表都沒有把稅算進去，所以我自己寫了一個\n\n功能：\n✅ 股利課稅（54C / 分離課稅）\n✅ 二代健保補充保費\n✅ 手續費\n✅ 匯出 Excel",
  vocus:     "你以為的財富自由年期，可能少估了 5 年。\n\n當你把 54C 股利抵減、二代健保補充保費（2.11%）、每期申購手續費全部算進去...\n\n數字開始說實話。\n\n→ 我的財富自由計算機讓你看到真實的每期扣除。",
  mobile01:  "【工具】財富自由計算機 v2.0 — 含稅費版試算\n\n板友好，分享一個自己開發的退休試算工具。\n\n特色：把所得稅（54C）、二代健保補充保費、申購手續費全部納入每期計算...\n\n歡迎試用，有問題歡迎討論。",
  pixnet:    "## 財富自由計算機使用指南\n\n本篇說明如何透過「財富自由計算機」進行精確的退休試算，涵蓋：\n- 54C 股利抵減\n- 二代健保補充保費（2.11%）\n- 申購手續費\n\n**第一步**：輸入月存金額與目標月領金額...",
  medium:    "# 我以為財富自由需要 30 年，直到我把隱形成本算進去\n\n> TL;DR：把 54C、二代健保、手續費納入試算後，你的退休年期可能差 3–8 年。\n\n大多數人計算 FIRE 時，只看報酬率——這是最大的盲點...",
};

interface MasterEditorProps {
  open: boolean;
  onClose: () => void;
}

export function MasterEditor({ open, onClose }: MasterEditorProps) {
  const [content, setContent] = useState("# 母版文章標題\n\n在這裡輸入你的母版內容...\n\n## 核心重點\n\n- 重點一\n- 重點二\n- 重點三");
  const [activeTab, setActiveTab] = useState("facebook");
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => setGenerating(false), 1500);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative flex flex-col bg-neutral-950 border border-neutral-800 rounded-xl shadow-2xl w-[90vw] max-w-6xl h-[85vh] overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 px-6 py-4 shrink-0">
          <h2 className="text-base font-semibold text-white">母版編輯器</h2>
          <div className="flex items-center gap-3">
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 px-3 py-1.5 text-xs font-semibold text-white transition-colors"
            >
              <Sparkles className="h-3.5 w-3.5" />
              {generating ? "AI 改寫中…" : "AI 一鍵改寫 8 平台"}
            </button>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left: Master content */}
          <div className="w-[42%] border-r border-neutral-800 flex flex-col">
            <div className="border-b border-neutral-800 px-4 py-2.5 flex items-center justify-between shrink-0">
              <span className="text-xs font-medium text-neutral-400">母版內容</span>
              <span className="rounded px-1.5 py-0.5 text-[10px] font-medium border border-neutral-700 text-neutral-500">Markdown</span>
            </div>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              className="flex-1 resize-none bg-transparent p-4 text-sm text-neutral-200 placeholder:text-neutral-600 focus:outline-none font-mono leading-relaxed"
              placeholder="在這裡輸入母版文章內容（支援 Markdown）..."
            />
          </div>

          {/* Right: Platform preview */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Tab bar */}
            <div className="border-b border-neutral-800 px-2 pt-1 overflow-x-auto shrink-0">
              <div className="flex gap-0.5 h-10 items-end">
                  {PLATFORMS.map(p => (
                    <button
                      key={p.id}
                      onClick={() => setActiveTab(p.id)}
                      className={[
                        "flex items-center rounded-t-md px-2 py-1.5 text-xs font-medium transition-colors whitespace-nowrap",
                        activeTab === p.id
                          ? "bg-neutral-800 text-white"
                          : "text-neutral-500 hover:text-neutral-300",
                      ].join(" ")}
                    >
                      <span
                        style={{ background: p.hex + "28", color: p.hex, borderColor: p.hex + "55" }}
                        className="inline-flex items-center rounded px-1.5 py-0 text-[10px] font-semibold border"
                      >
                        {p.label}
                      </span>
                    </button>
                  ))}
              </div>
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto">
              {PLATFORMS.map(p => (
                activeTab === p.id && (
                  <div key={p.id} className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span
                            style={{ background: p.hex + "28", color: p.hex, borderColor: p.hex + "55" }}
                            className="inline-flex items-center rounded border px-2 py-0.5 text-[10px] font-semibold"
                          >
                            {p.label} 預覽
                          </span>
                      <button
                        onClick={() => handleCopy(p.id, MOCK_PREVIEW[p.id])}
                        className="flex items-center gap-1 text-[11px] text-neutral-500 hover:text-neutral-300 transition-colors"
                      >
                        {copied === p.id
                          ? <><Check className="h-3 w-3 text-emerald-400" /> 已複製</>
                          : <><Copy className="h-3 w-3" /> 複製</>
                        }
                      </button>
                    </div>
                    {generating ? (
                      <div className="space-y-2 animate-pulse">
                        {[60, 90, 75, 50, 80].map((w, i) => (
                          <div key={i} className="h-3 rounded bg-neutral-800" style={{ width: `${w}%` }} />
                        ))}
                      </div>
                    ) : (
                      <pre className="text-sm text-neutral-300 leading-relaxed whitespace-pre-wrap font-sans bg-neutral-900 rounded-lg p-4 border border-neutral-800">
                        {MOCK_PREVIEW[p.id]}
                      </pre>
                    )}
                  </div>
                )
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
