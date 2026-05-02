"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  ArrowLeft, Save, Send, Link2, Copy, Check, Tag, Calendar,
  AlertTriangle, Image as ImageIcon, ChevronDown, ChevronRight as ChevronR,
  LayoutDashboard, Library, CalendarClock, Settings, Zap, Eye, EyeOff, Sparkles,
  FileText, ClipboardPaste, Bold, Heading2, Heading3, List, Eraser,
} from "lucide-react";
import { ShareAssetModal } from "../components/share-asset-modal";
import type { ShareAssetKind } from "../share-assets";
import { BLOGGER_CH1_HTML, BLOGGER_CH1_TEMPLATE_REVISION } from "./blogger-ch1-html";
import { BLOGGER_CH2_HTML, BLOGGER_CH2_TEMPLATE_REVISION } from "./blogger-ch2-html";
import previewStyles from "./blogger-preview.module.css";
import {
  HtmlBodyEditor,
  isRawHtmlBody,
  markdownImgsToHtmlFragment,
  type HtmlBodyEditorHandle,
} from "./html-body-editor";
import { normalizeBloggerPaste } from "./blogger-paste";

/* ═══════════════════════════════════════════════════════════
   DESIGN TOKENS  — Clean light theme
═══════════════════════════════════════════════════════════ */
const BG    = "#F8FAFC";   // page background — Slate-50
const RAIL  = "#F1F5F9";   // sidebars — Slate-100
const EDIT  = "#FFFFFF";   // editor — pure white paper
const REF   = "#F8FAFC";   // reference panel — Slate-50
const DIV   = "#E2E8F0";   // dividers — Slate-200

const T1    = "#0F172A";   // Slate-900 — near-black
const T2    = "#1E293B";   // Slate-800 — body text
const T3    = "#334155";   // Slate-700 — secondary text
const T4    = "#475569";   // Slate-600 — secondary labels
const T5    = "#64748B";   // Slate-500 — dim hints

const BLUE  = "#3B82F6";
const BLUDM = "rgba(59,130,246,0.08)";
const GREEN = "#16A34A";
const AMBER = "#D97706";
const RED   = "#DC2626";

// Morandi — 編輯／預覽／HTML 分頁（未選中邊框／字色）
const MOR_TAB_OFF_BR = "#D1D6D2";
const MOR_TAB_OFF_TX = "#5C6460";

// Morandi — 右欄標題／標籤輸入框（與 RAIL 底色略有區隔）
const MOR_FIELD_BG = "#E8EBE7";
const MOR_FIELD_BR = "#C4CCC6";
const MOR_HASH = "#7D8A85";

/** 母版雙欄工作區（淺色，與側欄／發文資訊一致） */
const HUB_BG = EDIT;
const HUB_BG_REF = REF;
const HUB_DIV = DIV;
const DH1 = T1;
const DH2 = T2;
const DH3 = T3;
const DH4 = T4;
const DH_BD = MOR_TAB_OFF_BR;

/** 頂欄高度（與中欄編輯區對齊，非 sticky 單頁捲動版） */
const LIB_HEADER_H = 44;

/** 左／右編輯欄：標頭強制同高、按鈕列同 min-height，視覺對稱（邊線以 style 帶入 DIV） */
const HUB_HEADER_CLASS =
  "hub-panel-header flex w-full min-h-[100px] flex-col items-start justify-start pt-6";
const HUB_TOOLBAR_ROW_CLASS =
  "hub-toolbar flex min-h-[52px] w-full max-w-[850px] shrink-0 items-center gap-4 px-7 pb-2 pt-2";
const HUB_TITLE_ROW_CLASS = "flex w-full max-w-[850px] shrink-0 items-center gap-2 px-7 pb-1";
const HUB_META_CLASS = "hub-meta flex w-full flex-col";
const HUB_META_INNER = "mx-auto w-full max-w-[850px]";
/** 內文區頂部留白（不改 markdown、不插空行） */
const HUB_BODY_TOP_PAD = 40;

/* ═══════════════════════════════════════════════════════════
   MARKDOWN → HTML  (Blogger inline-style compatible)
   Rules:
   - # heading  → <h2>  (Blogger title is set separately, so # = section title)
   - ## heading → <h3>
   - ### heading→ <h4>
   - paragraphs → <p style="...">  with inline margin + line-height
   - lists      → <ul>/<ol> with inline style
   - All inline styles so Blogger theme CSS doesn't matter
═══════════════════════════════════════════════════════════ */
const BLOG_P  = `style="margin:0 0 1.4em 0;line-height:1.8;font-size:16px;"`;
const BLOG_H2 = `style="font-size:1.5em;font-weight:700;margin:2em 0 0.6em;line-height:1.3;"`;
const BLOG_H3 = `style="font-size:1.25em;font-weight:600;margin:1.8em 0 0.5em;line-height:1.3;"`;
const BLOG_H4 = `style="font-size:1.05em;font-weight:600;margin:1.4em 0 0.4em;"`;
const BLOG_BQ = `style="border-left:3px solid #ccc;margin:1.5em 0;padding:0.5em 1.2em;color:#555;"`;
const BLOG_UL = `style="margin:0 0 1.4em 1.5em;padding:0;list-style:disc;"`;
const BLOG_OL = `style="margin:0 0 1.4em 1.5em;padding:0;"`;
const BLOG_LI = `style="margin-bottom:0.4em;line-height:1.8;"`;

function md2html(md: string): string {
  const inline = (s: string) =>
    s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
     .replace(/\*(.+?)\*/g, "<em>$1</em>")
     .replace(/`(.+?)`/g, `<code style="background:#f4f4f4;padding:0.1em 0.4em;border-radius:3px;font-size:0.9em;">$1</code>`);

  return md.split(/\n{2,}/).map(block => {
    const b = block.trim();
    if (!b) return "";
    if (/^### /.test(b)) return `<h4 ${BLOG_H4}>${inline(b.slice(4))}</h4>`;
    if (/^## /.test(b))  return `<h3 ${BLOG_H3}>${inline(b.slice(3))}</h3>`;
    if (/^# /.test(b))   return `<h2 ${BLOG_H2}>${inline(b.slice(2))}</h2>`;
    if (/^> /.test(b))   return `<blockquote ${BLOG_BQ}><p ${BLOG_P}>${inline(b.slice(2))}</p></blockquote>`;
    if (/^\d+\. /.test(b)) {
      const items = b.split("\n").map(l => `  <li ${BLOG_LI}>${inline(l.replace(/^\d+\. /, ""))}</li>`).join("\n");
      return `<ol ${BLOG_OL}>\n${items}\n</ol>`;
    }
    if (/^- /.test(b)) {
      const items = b.split("\n").map(l => `  <li ${BLOG_LI}>${inline(l.slice(2))}</li>`).join("\n");
      return `<ul ${BLOG_UL}>\n${items}\n</ul>`;
    }
    return `<p ${BLOG_P}>${inline(b.split("\n").join("<br>"))}</p>`;
  }).filter(Boolean).join("\n\n");
}

/** 內文若已是可貼 Blogger 的 HTML 區塊，匯出／HTML 分頁不再經 md2html */
function exportArticleInnerHtml(s: string): string {
  if (isRawHtmlBody(s)) return s;
  return md2html(s);
}

/* ═══════════════════════════════════════════════════════════
   STATIC DATA
═══════════════════════════════════════════════════════════ */

/** 主題列表 01–20：標題（不含「撰寫」）＋文章類型（痛點／閒聊／心得等） */
const MASTER_TOPIC_ROWS = [
  { title: "[分享] 那天算完退休金，我一個人在咖啡廳坐了很久...", kind: "故事" as const },
  { title: "資產增長的非線性邏輯——為什麼 20 年後你們會差 321 萬？", kind: "痛點" as const },
  { title: "35 歲後的焦慮：如果現在丟了工作，我還剩什麼？", kind: "痛點" as const },
  { title: "關於理財，我們都被那些「專家」給誤導了？", kind: "痛點" as const },
  { title: "[閒聊] 假設明天就退休，你的存款能撐幾年？我算完心涼了", kind: "閒聊" as const },
  { title: "複利真的是奇蹟嗎？還是只是時間的一場謊言？", kind: "反思" as const },
  { title: "如果你每年只存 10 萬，這輩子還有機會自由嗎？", kind: "痛點" as const },
  { title: "這兩年看著物價，我開始懷疑 4% 法則真的夠用嗎？", kind: "疑慮" as const },
  { title: "為什麼理財計畫總是失敗？因為我們都漏算了這項變數", kind: "痛點" as const },
  { title: "被保險業務洗臉後，我決定自己算一下老後的醫藥費", kind: "故事" as const },
  { title: "關於買房還是租房：數據告訴我一個不願面對的答案", kind: "數據" as const },
  { title: "養一個小孩到大學要多少錢？算完這筆帳我失眠了", kind: "痛點" as const },
  { title: "如果股市大跌 50%，你的退休夢還在嗎？", kind: "風險" as const },
  { title: "除了錢，我們還忽略了退休後最昂貴的成本", kind: "痛點" as const },
  { title: "[心得] 我花了一個月寫的計算邏輯，終於看見了終點", kind: "心得" as const },
  { title: "看見出口後，我對工作的態度徹底改變了", kind: "轉折" as const },
  { title: "不要再說沒錢理財，你缺的是對未來的「掌控感」", kind: "觀點" as const },
  { title: "這不是夢想，而是每個人都能算出來的未來", kind: "願景" as const },
  { title: "如果人生可以重來，我會希望 20 歲就看到這張表", kind: "願景" as const },
  { title: "[結案] 給十年後的自己：謝謝當初那個沒放棄的你", kind: "結案" as const },
] as const;

/* ── Writing rules (structured, editable) ── */
interface RuleCategory { category: string; rules: string[]; }

const DEFAULT_RULES: RuleCategory[] = [
  {
    category: "視覺與排版",
    rules: [
      "手機板優化：每行字數嚴格控制在 25 字內",
      "呼吸感斷行：每 2-3 句強迫換段，段落間留一空行",
      "標題層級規範：H1 全標題，H2 大段落，H3 細項",
      "視覺重量：關鍵數據與核心結論必須加粗",
      "符號標準化：專有名詞用「」，列點用有序符號",
    ],
  },
  {
    category: "內容與策略",
    rules: [
      "第三方視角：以「我意外發現、實測分享」切入，降低廣告感",
      "痛點橋接：開場前三句點出一個財稅痛點",
      "數據具體化：必須提到計算機具體項目（如二代健保）",
      "故事化敘事：搭配公式包裝心路歷程",
    ],
  },
  {
    category: "SEO 與搜索優化",
    rules: [
      "前 100 字必須出現「財富自由」或「計算機」",
      "每張圖都要有對應的主題 alt 圖說",
      "含一個計算機連結，一個站內其他文章連結",
    ],
  },
  {
    category: "轉化與行動",
    rules: [
      "結尾必須留有「立即試算」按鈕或連結",
      "文末包含「本文僅供參考，不構成投資建議」",
    ],
  },
];

const DEFAULT_PROMPT = `請根據以下內容，產出一篇品牌的 Blogger 文章。

# 格式規範
1. [H1 標題] 第一行，吸引點擊的標題
2. [引言] 強迫斷行，每行 ≤ 25 字，營造節奏感
3. [H2 為什麼推薦？] 點列式優點，每點不超過 20 字
4. [H2 實測重點] 每段 2 句，中間空一行
5. [結語] CTA 導流連結

# 強調事項
- 關鍵數據加粗（**670萬**、**15%**）
- 專有名詞用「」（如「二代健保」、「54C」）
- 嚴禁超過 50 字不換行

# 內容區
{請在此貼上你的母版文字}`;

function cats2text(cs: RuleCategory[]) {
  return cs.map(c => `## ${c.category}\n${c.rules.map(r => `- ${r}`).join("\n")}`).join("\n\n");
}
function text2cats(t: string): RuleCategory[] {
  const res: RuleCategory[] = []; let cur: RuleCategory | null = null;
  for (const ln of t.split("\n")) {
    const l = ln.trim();
    if (l.startsWith("## ")) { if (cur) res.push(cur); cur = { category: l.slice(3), rules: [] }; }
    else if (l.startsWith("- ") && cur) cur.rules.push(l.slice(2));
  }
  if (cur) res.push(cur);
  return res.length ? res : DEFAULT_RULES;
}

function ruleKeysFromCats(cats: RuleCategory[]): string[] {
  const keys: string[] = [];
  for (const c of cats) {
    c.rules.forEach((_, ri) => keys.push(`${c.category}::${ri}`));
  }
  return keys;
}

const RISK = [
  { p: "Mobile01", lv: "high",   t: "避免直接貼官網連結，易被判定廣告文" },
  { p: "Mobile01", lv: "high",   t: "勿用「點此」「立即」等促銷字眼" },
  { p: "Dcard",    lv: "medium", t: "需加入個人試算故事，純工具介紹易被刪" },
  { p: "Medium",   lv: "low",    t: "標題加「分享」，社群感更強" },
];

const PF_COLORS: Record<string, string> = {
  FB: "#1877F2", IG: "#C32AA3", Threads: "#9E9FA0",
  Blogger: "#FF5722", Medium: "#525252", 方格子: "#F59E0B",
};

type Status = "已發布" | "草稿" | "空白";
const S_COLOR: Record<Status, string> = { "已發布": GREEN, "草稿": AMBER, "空白": "#334155" };

interface Article {
  id: number; title: string; status: Status;
  tags: string[]; date: string; content: string;
  sample: string; publishedOn: string[];
  /** Blogger 精選圖片／首圖 URL，預覽即時顯示 */
  featuredImageUrl: string;
}

function isStatusValue(s: unknown): s is Status {
  return s === "已發布" || s === "草稿" || s === "空白";
}

function isArticleRecord(x: unknown): x is Article {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.id === "number"
    && typeof o.title === "string"
    && isStatusValue(o.status)
    && Array.isArray(o.tags)
    && o.tags.every((t) => typeof t === "string")
    && typeof o.date === "string"
    && typeof o.content === "string"
    && typeof o.sample === "string"
    && Array.isArray(o.publishedOn)
    && o.publishedOn.every((p) => typeof p === "string")
    && (o.featuredImageUrl === undefined || typeof o.featuredImageUrl === "string")
  );
}

function normalizeArticleFromStorage(a: Article): Article {
  const fi = (a as Article & { featuredImageUrl?: string }).featuredImageUrl;
  return { ...a, featuredImageUrl: typeof fi === "string" ? fi : "" };
}

/** 供精選圖 src 與預覽 URL 顯示 */
function escapeAttr(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "").replace(/>/g, "");
}

function slugPreviewPath(title: string): string {
  const slug = title
    .replace(/·.*$/u, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\u4e00-\u9fff-]+/gi, "")
    .slice(0, 48) || "post";
  return `/post/${encodeURIComponent(slug)}`;
}

/** WordPress 風側欄／懸浮列背景 */
const WP_PANEL_BG = "#121212";

/** 母版 20 篇：重整後仍保留；清除瀏覽資料即還原預設 */
const LIBRARY_ARTICLES_LOCAL_KEY = "postflow-library-articles-v1";
/** Mobile01 母版：獨立一份本機草稿，不影響原母版內容庫 */
const LIBRARY_ARTICLES_MOBILE01_LOCAL_KEY = "postflow-library-articles-mobile01-v1";

function loadLibraryArticles(storageKey: string): Article[] | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed) || parsed.length !== 20) return null;
    if (!parsed.every(isArticleRecord)) return null;
    for (let i = 0; i < 20; i++) {
      if ((parsed[i] as Article).id !== i + 1) return null;
    }
    return (parsed as Article[]).map(normalizeArticleFromStorage);
  } catch {
    return null;
  }
}

function saveLibraryArticles(storageKey: string, articles: Article[]) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(articles));
  } catch {
    /* 配額／私密模式 */
  }
}

/** 內建 5 個標籤（前 5 篇母版預設；改版時 bump LIBRARY_ARTICLES_3_5_TAG_REVISION） */
const DEFAULT_TAGS_ARTICLE_1 = ["財富自由", "退休", "理財", "複利", "計算機"];
const DEFAULT_TAGS_ARTICLE_2 = ["複利", "存股", "理財", "資產", "計算機"];
const DEFAULT_TAGS_ARTICLE_3 = ["職涯", "焦慮", "理財", "退休金", "計算機"];
const DEFAULT_TAGS_ARTICLE_4 = ["理財", "迷思", "退休", "投資", "計算機"];
const DEFAULT_TAGS_ARTICLE_5 = ["退休", "存款", "理財", "退休金", "計算機"];

function mkArticle(id: number): Article {
  const pf = Object.keys(PF_COLORS);
  const row = MASTER_TOPIC_ROWS[id - 1];
  const title = row ? `${row.title} · ${row.kind}` : `母版文章 ${id}`;
  return {
    id,
    title,
    status: id <= 2 ? "已發布" : id <= 4 ? "草稿" : "空白",
    tags:
      id === 1 ? [...DEFAULT_TAGS_ARTICLE_1]
      : id === 2 ? [...DEFAULT_TAGS_ARTICLE_2]
      : id === 3 ? [...DEFAULT_TAGS_ARTICLE_3]
      : id === 4 ? [...DEFAULT_TAGS_ARTICLE_4]
      : id === 5 ? [...DEFAULT_TAGS_ARTICLE_5]
      : [],
    date: id === 1 ? "2026-04-18" : id === 2 ? "2026-04-20" : "",
    content: id === 1 ? BLOGGER_CH1_HTML : id === 2 ? BLOGGER_CH2_HTML : "",
    sample: id === 1 ? BLOGGER_CH1_HTML : id === 2 ? BLOGGER_CH2_HTML : "",
    publishedOn: id === 1 ? pf.slice(0, 4) : id === 2 ? pf.slice(0, 2) : [],
    featuredImageUrl: "",
  };
}

function mkMobile01Article(id: number): Article {
  const MOBILE01_CH1_HTML = `各位 Mobile01 的鄉民大家好，


這是一篇感觸文。


身為工程師，我對數字算敏感。

直到最近幫學弟算了一筆帳，
徹底顛覆了我的看法。



上個月跟一個學弟喝咖啡，

他興奮分享剛訂了一台新車。


他跟我說：

<strong>「每個月分期不到 8,000 元，」</strong>
<strong>「完全無痛啊！」</strong>


聽完這句「無痛」，

我心裡突然抽動了一下。



<img src="https://attach.mobile01.com/attach/202604/mobile01-9f80382a127843affcec80040286a3a3.png">

<hr> 
我當下沒反駁，

只是隨手拿了一張紙，
幫他算了這筆錢的 <strong>「真實代價」</strong>。


我跟他說：

「學弟，這 8,000 如果不是給銀行，」
「而是放在年化 7% 的大盤裡，」
「20 年後是多少你知道嗎？」


學弟笑著回我：

「頂多一百多萬吧？買個夢想還好啦！」



<center><strong>「是 150 多萬。」</strong></center> 



我接著說：

「你現在買的是車，」
「但你實際握著的，」
「是一棟房子的頭期款。」


那晚，我們兩個人沉默很久。

他原本要拍訂單限動的手，
也收了回去。


<hr> 
這件事對我衝擊很大。

原來我們常被 <strong>「月付小額」</strong> 給吸乾了。


後來我開始幫身邊的朋友算，

才發現這種案例多到數不完。


我不打算說教，

但數字攤開來真的會讓人清醒：

<strong>「沒感覺的小錢，在時間加持下，代價高得嚇人。」</strong>



最近整理了一些不同的診斷案例，

之後有空再慢慢分享上來給大家參考。



<center><strong>如果是各位，你會為了現在的帥氣，</strong></center> 

<center><strong>放棄 20 年後的 150 萬嗎？</strong></center> 


<hr> 
<strong>2026/04/27 21:00 補充說明：</strong>
<strong>【關於「5年分期」與「20年落差」】</strong>


看到樓下許多大大專業的指教，

真的獲益良多！


關於大家提到「車貸沒人在貸 20 年」，

這點確實是我在故事中，
為了簡化邏輯而沒說清楚的地方。


其實我當初幫學弟算的，

是在對比 <strong>「投資起跑點」</strong> 的殘酷差異：


<strong>● 方案 A（買車分期）：</strong>
前 5 年現金流被分期占用，
這 5 年投資額完全是 0。
等到第 6 年貸款還完，
才開始每月投 8,000 入股市。


<strong>● 方案 B（不買車）：</strong>
從第 1 個月就開始投 8,000，
持續投滿 20 年。


雖然兩者最後都是月存 8,000，

但僅僅是因為方案 A <strong>「晚了 5 年開始」</strong>，
在年化 7% 的複利滾動下，
20 年後的資產落差就高達 <strong>150 萬以上</strong>。


這就是我想表達的：


<center><strong>「複利最貴的成本，</strong></center> 
<center><strong>是被分期偷走的頭幾年。」</strong></center> 


舉個更有感的例子：


很多人覺得 iPhone 分期 24 期很輕鬆，

但如果你這兩年是先拿這筆錢投大盤，

尤其是今天的台積電。


20 年後這支手機的真實代價，

不是 4 萬，

而是 <strong>15 萬</strong>。



你買的是現在的開箱喜悅，

但賠掉的是未來翻倍的資產規模。



再次感謝大家的熱烈討論，

理財情境真的很多種。


我也正在整理其他不同期數、

不同情境（如小額訂閱、精緻窮）的案例，

之後有空再慢慢分享上來跟大家交流！`;
  return {
    id,
    title: `Mobile01 閒聊趣味 ${String(id).padStart(2, "0")}`,
    status: "空白",
    tags: [],
    date: "",
    content: id === 1 ? MOBILE01_CH1_HTML : "",
    sample: id === 1 ? MOBILE01_CH1_HTML : "",
    publishedOn: [],
    featuredImageUrl: "",
  };
}

/* ═══════════════════════════════════════════════════════════
   SHARED MINI COMPONENTS
═══════════════════════════════════════════════════════════ */

/* Ghost icon button */
function IconBtn({ onClick, active, title, children }: {
  onClick?: () => void; active?: boolean; title?: string; children: React.ReactNode;
}) {
  return (
    <button onClick={onClick} title={title}
      className="flex h-7 w-7 items-center justify-center rounded transition-colors shrink-0"
      style={{ background: active ? BLUDM : "transparent", color: active ? BLUE : T4 }}
      onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.color = T2; }}
      onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.color = T4; }}
    >
      {children}
    </button>
  );
}

/* Slim accordion */
function Pane({ title, icon, open: initOpen = false, children, headerRight }: {
  title: string; icon?: React.ReactNode; open?: boolean; children: React.ReactNode;
  headerRight?: React.ReactNode;
}) {
  const [open, setOpen] = useState(initOpen);
  return (
    <div style={{ borderBottom: `1px solid ${DIV}` }}>
      {/* 標題／headerRight／箭頭 三者同層，絕不包在同一個 <button> 裡，避免巢狀 button */}
      <div
        className="flex w-full items-center gap-2 rounded-md transition-colors"
        style={{ padding: "14px 20px" }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#F8FAFC"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
      >
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen(v => !v)}
          className="min-w-0 flex-1 text-left rounded-md outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
        >
          <span className="text-[17px] font-bold" style={{ color: T1 }}>
            <span className="inline-flex items-center gap-1.5">
              {icon}{title}
            </span>
          </span>
        </button>
        {headerRight != null && (
          <span className="shrink-0 flex items-center" onClick={e => e.stopPropagation()}>
            {headerRight}
          </span>
        )}
        <button
          type="button"
          aria-label={open ? "收合" : "展開"}
          onClick={() => setOpen(v => !v)}
          className="shrink-0 rounded p-0.5 outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
        >
          {open ? <ChevronDown className="h-4 w-4" style={{ color: T4 }} />
                 : <ChevronR  className="h-4 w-4" style={{ color: T4 }} />}
        </button>
      </div>
      {open && (
        <div style={{ padding: "14px 20px 20px", borderTop: `1px solid ${MOR_FIELD_BR}` }}>
          {children}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   LEFT SIDEBAR
═══════════════════════════════════════════════════════════ */
const NAV = [
  { icon: LayoutDashboard, label: "儀表板",    path: "/postflow"           },
  { icon: Library,         label: "母版內容庫", path: "/postflow/library", badge: "20" },
  { icon: CalendarClock,   label: "發布進度",  path: "/postflow/schedule"  },
  { icon: Settings,        label: "帳號設定",  path: "/postflow/settings"  },
];

function Sidebar({ articles, selId, onSel, width, onResize }: {
  articles: Article[]; selId: number; onSel: (id: number) => void;
  width: number; onResize: (w: number) => void;
}) {
  const router   = useRouter();
  const pathname = usePathname();
  const [platformExpanded, setPlatformExpanded] = useState(true);
  const [mobile01Expanded, setMobile01Expanded] = useState(true);

  const platformItems = useMemo(
    () => [
      { label: "Threads", key: "threads" },
      { label: "Facebook", key: "fb" },
      { label: "Instagram", key: "ig" },
      { label: "Dcard", key: "dcard" },
      { label: "方格子", key: "vocus" },
      { label: "痞客邦", key: "pixnet" },
      { label: "Blogger", key: "blogger" },
      { label: "Medium", key: "medium" },
    ],
    [],
  );

  const mobile01Items = useMemo(
    () => [
      { label: "Mobile01 閒聊趣味", key: "view=mobile01-master" },
      { label: "Mobile01 理財", key: "mobile01=finance" },
      { label: "Mobile01 職場甘苦談", key: "mobile01=career" },
      { label: "Mobile01 創業夢想家", key: "mobile01=startup" },
      { label: "Mobile01 其他應用軟體", key: "mobile01=apps" },
      { label: "Mobile01 AI 人工智慧", key: "mobile01=ai" },
    ],
    [],
  );

  const startDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX, startW = width;
    const onMove = (ev: MouseEvent) => onResize(Math.min(400, Math.max(160, startW + ev.clientX - startX)));
    const onUp   = () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  return (
    <aside
      className="relative z-30 flex h-full min-h-0 shrink-0 flex-col overflow-hidden"
      style={{ width: `${width}px`, background: RAIL, borderRight: `1px solid ${DIV}` }}
    >

      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-4 shrink-0">
        <div className="flex h-6 w-6 items-center justify-center rounded-md shrink-0"
          style={{ background: "#4f46e5" }}>
          <Zap className="h-3.5 w-3.5 text-white" />
        </div>
        <span className="text-[13px] font-semibold" style={{ color: T1 }}>PostFlow AI</span>
      </div>

      {/* Nav */}
      <nav className="px-2 shrink-0">
        {NAV.map(({ icon: Icon, label, path, badge }) => {
          const active = pathname === path || (path !== "/postflow" && pathname.startsWith(path));
          return (
            <button key={path} onClick={() => router.push(path)}
              className="w-full flex items-center gap-2.5 rounded-md px-3 text-[14px] font-semibold text-left transition-all"
              style={{ height: "48px", background: active ? "rgba(96,165,250,0.08)" : "transparent", color: active ? T1 : T4 }}
              onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)"; }}
              onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              {active && <span className="absolute left-2 top-auto h-4 w-[2px] rounded-full" style={{ background: BLUE }} />}
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span className="flex-1">{label}</span>
              {badge && (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                  style={{ background: BLUDM, color: BLUE }}>{badge}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Under "母版內容庫" add expandable "各平台" */}
      {pathname.startsWith("/postflow/library") && (
        <div className="px-2 shrink-0 -mt-1">
          <button
            type="button"
            onClick={() => setPlatformExpanded((v) => !v)}
            className="w-full flex items-center gap-2.5 rounded-md px-3 text-[13px] font-semibold text-left transition-all"
            style={{ height: "40px", background: "transparent", color: T3 }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "transparent";
            }}
          >
            <span className="flex-1">各平台</span>
            {platformExpanded ? (
              <ChevronDown className="h-4 w-4 shrink-0" style={{ color: T4 }} />
            ) : (
              <ChevronR className="h-4 w-4 shrink-0" style={{ color: T4 }} />
            )}
          </button>

          {platformExpanded && (
            <div className="pl-4 pr-2 pb-1 -mt-1 space-y-1">
              {platformItems.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => router.push(`/postflow/library?platform=${encodeURIComponent(p.key)}`)}
                  className="w-full rounded-md px-3 py-2 text-left text-[12px] font-semibold transition-colors"
                  style={{ color: T3 }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "transparent";
                  }}
                >
                  {p.label}
                </button>
              ))}

              <button
                type="button"
                onClick={() => setMobile01Expanded((v) => !v)}
                className="w-full rounded-md px-3 py-2 text-left text-[12px] font-semibold transition-colors"
                style={{ color: T3 }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                }}
              >
                <span className="flex items-center justify-between">
                  <span>Mobile01</span>
                  {mobile01Expanded ? (
                    <ChevronDown className="h-4 w-4 shrink-0" style={{ color: T4 }} />
                  ) : (
                    <ChevronR className="h-4 w-4 shrink-0" style={{ color: T4 }} />
                  )}
                </span>
              </button>

              {mobile01Expanded && (
                <div className="space-y-1 pl-3">
                  {mobile01Items.map((it) => (
                    <button
                      key={it.key}
                      type="button"
                      onClick={() => router.push(`/postflow/library?${it.key}`)}
                      className="w-full rounded-md px-3 py-2 text-left text-[12px] font-semibold transition-colors"
                      style={{ color: T4 }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.background = "transparent";
                      }}
                    >
                      {it.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Topic list */}
      <div className="mt-3 shrink-0 px-4 py-2" style={{ borderTop: `1px solid ${DIV}` }}>
        <span className="text-[15px] font-bold" style={{ color: T1 }}>主題列表</span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pb-4">
        {articles.map(a => {
          const active = a.id === selId;
          return (
            <button key={a.id} onClick={() => onSel(a.id)}
              className="relative w-full flex items-center gap-2 text-left transition-all"
              style={{ padding: "12px 20px", background: active ? "#EFF6FF" : "transparent" }}
              onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "#F1F5F9"; }}
              onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              {active && <span className="absolute left-0 top-3 bottom-3 w-[2px]" style={{ background: BLUE }} />}
              <span className="shrink-0 tabular-nums text-[13px] font-bold w-6 text-right"
                style={{ color: active ? BLUE : T4 }}>
                {String(a.id).padStart(2, "0")}
              </span>
              <span className="flex-1 truncate text-[14px] font-medium"
                style={{ color: active ? T1 : T2 }}>
                {a.title}
              </span>
              <span className="shrink-0 h-1.5 w-1.5 rounded-full" style={{ background: S_COLOR[a.status] }} />
            </button>
          );
        })}
      </div>

      {/* User */}
      <div className="px-4 py-3 shrink-0 flex items-center gap-2.5" style={{ borderTop: `1px solid ${DIV}` }}>
        <div className="h-6 w-6 rounded-full shrink-0"
          style={{ background: "linear-gradient(135deg,#818cf8,#a78bfa)" }} />
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold" style={{ color: T1 }}>吳鎧全</p>
          <p className="truncate text-[12px]" style={{ color: T5 }}>管理員</p>
        </div>
      </div>

      {/* Left sidebar drag handle */}
      <div onMouseDown={startDrag}
        className="absolute top-0 right-0 h-full cursor-col-resize"
        style={{ width: "14px", zIndex: 10 }} />
    </aside>
  );
}

/* ═══════════════════════════════════════════════════════════
   WRITING HUB  (Blogger-studio — 65 : 52 split)
═══════════════════════════════════════════════════════════ */
function WritingHub({ article, onChange, refWidth, onRefResize, onSave, saved }: {
  article: Article; onChange: (a: Article) => void;
  refWidth: number; onRefResize: (w: number) => void;
  onSave: () => void;
  saved: boolean;
}) {
  const [tab,       setTab]      = useState<"edit" | "preview" | "html">("edit");
  const [urlOpen,   setUrlOpen]  = useState(false);
  const [urlIn,     setUrlIn]    = useState("");
  const [loading,   setLoading]  = useState(false);
  const [newTag,    setNewTag]   = useState("");
  const [showRef,   setShowRef]  = useState(true);
  const [htmlCopied,setHtmlCopied] = useState(false);
  const [pasteBloggerBusy, setPasteBloggerBusy] = useState(false);
  const [pasteBloggerErr, setPasteBloggerErr] = useState<string | null>(null);
  /** 範例參考欄：與左欄相同的編輯／預覽分頁 + 儲存 */
  const [refTab,    setRefTab]    = useState<"edit" | "preview">("preview");
  const [refDraft,  setRefDraft]  = useState(article.sample);
  const [refSaved,  setRefSaved]  = useState(false);
  const [shareModalKind, setShareModalKind] = useState<ShareAssetKind | null>(null);
  const contentTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const mainHtmlEditorRef = useRef<HtmlBodyEditorHandle | null>(null);

  const set = useCallback((p: Partial<Article>) => onChange({ ...article, ...p }), [article, onChange]);

  const insertMarkdownAtCursor = useCallback(
    (markdown: string) => {
      setTab("edit");
      window.setTimeout(() => {
        if (mainHtmlEditorRef.current) {
          mainHtmlEditorRef.current.insertHtml(markdownImgsToHtmlFragment(markdown));
          return;
        }
        const ta = contentTextareaRef.current;
        const cur = ta?.value ?? article.content;
        if (ta) {
          const start = ta.selectionStart;
          const end = ta.selectionEnd;
          const next = cur.slice(0, start) + markdown + cur.slice(end);
          set({ content: next });
          queueMicrotask(() => {
            const t2 = contentTextareaRef.current;
            if (t2) {
              const pos = start + markdown.length;
              t2.selectionStart = t2.selectionEnd = pos;
              t2.focus();
            }
          });
        } else {
          set({ content: cur + markdown });
        }
      }, 80);
    },
    [article.content, set],
  );

  useEffect(() => {
    setRefDraft(article.sample);
    setRefSaved(false);
  }, [article.id, article.sample]);

  useEffect(() => {
    setPasteBloggerErr(null);
  }, [tab]);

  const saveRefSample = useCallback(() => {
    onChange({ ...article, sample: refDraft });
    setRefSaved(true);
    setTimeout(() => setRefSaved(false), 2000);
  }, [article, onChange, refDraft]);

  /** 右欄標題編輯：寫回第一則 HTML 註解，或第一行 # 標題；註解內禁止連續 `--`，改為破折號避免壞註解。 */
  const applyRefHeadingToDraft = useCallback((draft: string, nextHeading: string): string => {
    const raw = nextHeading.trimEnd();
    const trimmedHeading = raw.trim();
    const safeComment = (s: string) => s.replace(/--/g, "—");
    const start = draft.trimStart();
    if (start.startsWith("<!--")) {
      const rest = draft.replace(/^\s*<!--\s*[\s\S]*?\s*-->\s*/, "");
      if (!trimmedHeading) return rest.trimStart();
      return `<!--${safeComment(trimmedHeading)}-->\n${rest.trimStart()}`;
    }
    if (/^\s*#\s+[^\n]+/.test(draft)) {
      if (!trimmedHeading) return draft.replace(/^\s*#\s+[^\n]+\n?/, "");
      return draft.replace(/^\s*#\s+[^\n]+/, `# ${trimmedHeading}`);
    }
    if (!trimmedHeading) return draft;
    const body = draft.trimStart();
    if (body) return `<!--${safeComment(trimmedHeading)}-->\n\n${draft}`;
    return `<!--${safeComment(trimmedHeading)}-->\n`;
  }, []);

  /** 範例正文第一個 # 標題行，或 HTML 註解標題（右欄第 3 行，與左欄標題列對齊；可編輯） */
  const refSampleTitle = useMemo(() => {
    const start = refDraft.trimStart();
    if (start.startsWith("<!--")) {
      const cm = refDraft.match(/<!--\s*([\s\S]*?)\s*-->/);
      if (cm) {
        return cm[1]
          .replace(/^Blogger\s*/i, "")
          .replace(/\s*排版格式\s*$/u, "")
          .trim();
      }
    }
    const m = refDraft.match(/^#\s+([^\n]+)/m);
    if (m) return m[1].trim();
    const first = refDraft.split("\n").map(l => l.trim()).find(Boolean);
    return first ? first.replace(/^#+\s*/, "") : "";
  }, [refDraft]);

  /** 預覽分頁：Markdown → 內嵌樣式 HTML；已是 Blogger HTML 則原樣渲染 */
  const leftBodyPreviewHtml = useMemo(
    () => exportArticleInnerHtml(article.content),
    [article.content],
  );
  const refBodyPreviewHtml = useMemo(
    () => exportArticleInnerHtml(refDraft),
    [refDraft],
  );

  const scrape = () => {
    if (!urlIn.trim()) return;
    setLoading(true);
    setTimeout(() => { set({ content: `# 擷取自\n${urlIn}\n\n（示意，需串接後端）` }); setLoading(false); setUrlOpen(false); }, 1200);
  };
  const addTag = () => {
    const t = newTag.trim();
    if (t && !article.tags.includes(t)) { set({ tags: [...article.tags, t] }); setNewTag(""); }
  };
  const copyHTML = () => {
    const ts   = getTs();
    const html = `<!-- 發布時間：${ts} -->\n<h1>${article.title}</h1>\n<p style="color:#888888;font-size:0.85em;margin-bottom:2em;">${ts}</p>\n\n${exportArticleInnerHtml(article.content)}`;
    navigator.clipboard.writeText(html).then(() => { setHtmlCopied(true); setTimeout(() => setHtmlCopied(false), 2500); });
  };

  const pasteBloggerArticle = useCallback(async () => {
    setPasteBloggerErr(null);
    if (typeof navigator === "undefined" || !navigator.clipboard?.readText) {
      setPasteBloggerErr("此環境無法讀取剪貼簿，請到「HTML」分頁手動貼上。");
      return;
    }
    setPasteBloggerBusy(true);
    try {
      const raw = await navigator.clipboard.readText();
      if (!raw.trim()) {
        setPasteBloggerErr("剪貼簿是空的。");
        return;
      }
      const next = normalizeBloggerPaste(raw);
      set({ content: next });
      setTab(isRawHtmlBody(next) ? "edit" : "html");
    } catch {
      setPasteBloggerErr("讀取失敗（需 HTTPS，並允許剪貼簿權限）。");
    } finally {
      setPasteBloggerBusy(false);
    }
  }, [set]);

  /* Typography — shared across editor, preview, reference */
  const BODY: React.CSSProperties = { fontSize: "17px", lineHeight: "1.8", fontFamily: "inherit" };

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden overflow-x-hidden" style={{ background: HUB_BG }}>

      {/* 頂列：只保留「眼睛」範例開關（URL 開關改在第 2 列，鏈條圖示不變） */}
      <div className="flex shrink-0 items-center justify-end gap-3 px-5 py-2.5" style={{ borderBottom: `1px solid ${HUB_DIV}`, background: HUB_BG }}>
        <IconBtn onClick={() => setShowRef(v => !v)} active={showRef} title={showRef ? "隱藏範例" : "顯示範例"}>
          {showRef ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
        </IconBtn>
      </div>

      {/* URL bar */}
      {urlOpen && (
        <div className="flex gap-2 px-5 py-2 shrink-0" style={{ borderBottom: `1px solid ${HUB_DIV}`, background: HUB_BG }}>
          <div className="flex flex-1 items-center gap-2 rounded-lg px-3 py-1.5" style={{ background: MOR_FIELD_BG, border: `1px solid ${MOR_FIELD_BR}` }}>
            <Link2 className="h-3.5 w-3.5 shrink-0" style={{ color: DH4 }} />
            <input value={urlIn} onChange={e => setUrlIn(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") scrape(); }}
              placeholder="貼入文章網址，自動擷取標題與內文…" autoFocus
              className="flex-1 bg-transparent text-[13px] focus:outline-none" style={{ color: DH1 }} />
          </div>
          <button onClick={scrape} disabled={loading || !urlIn.trim()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] rounded-lg disabled:opacity-40"
            style={{ background: BLUE, color: "#FFFFFF" }}>
            {loading
              ? <span className="h-3.5 w-3.5 rounded-full border-2 animate-spin" style={{ borderColor: T5, borderTopColor: T1 }} />
              : <Link2 className="h-3.5 w-3.5" />}
            {loading ? "擷取中…" : "擷取"}
          </button>
        </div>
      )}

      {/* ── Split body：雙欄、overflow-x-hidden ── */}
      <div className="relative flex min-h-0 flex-1 min-w-0 overflow-hidden overflow-x-hidden">

        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden overflow-x-hidden" style={{ background: HUB_BG }}>

          <header
            className={HUB_HEADER_CLASS}
            style={{ background: HUB_BG }}
          >
            <div className={HUB_TITLE_ROW_CLASS} style={{ margin: "0 auto" }}>
              <FileText className="h-3 w-3 shrink-0" style={{ color: DH4 }} />
              <span className="text-[15px] font-bold" style={{ color: DH1 }}>Blogger 母文</span>
            </div>
            <div className={HUB_TOOLBAR_ROW_CLASS} style={{ margin: "0 auto" }}>
              <div
                className="flex min-h-[36px] min-w-0 flex-1 items-center gap-2 overflow-x-auto"
                style={{ WebkitOverflowScrolling: "touch" }}
              >
                {(["edit", "preview", "html"] as const).map(t => (
                  <button key={t} type="button" onClick={() => setTab(t)}
                    className="shrink-0 text-[13px] font-semibold rounded-md transition-all px-5 py-1.5"
                    style={{
                      lineHeight: 1.35,
                      background: tab === t ? BLUDM : HUB_BG,
                      color: tab === t ? T1 : MOR_TAB_OFF_TX,
                      border: tab === t ? `1.5px solid ${BLUE}` : `1px solid ${MOR_TAB_OFF_BR}`,
                      boxShadow: "none",
                    }}>
                    {t === "edit" ? "編輯" : t === "preview" ? "預覽" : "HTML"}
                  </button>
                ))}
                <button type="button" title="封面"
                  onClick={() => setShareModalKind("cover")}
                  className="inline-flex shrink-0 items-center gap-2 rounded-md px-4 py-1.5 text-[12px] font-medium transition-all"
                  style={{
                    lineHeight: 1.35,
                    color: MOR_TAB_OFF_TX,
                    border: `1px solid ${MOR_TAB_OFF_BR}`,
                    background: HUB_BG,
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.color = T1;
                    (e.currentTarget as HTMLElement).style.background = RAIL;
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.color = MOR_TAB_OFF_TX;
                    (e.currentTarget as HTMLElement).style.background = HUB_BG;
                  }}
                ><ImageIcon className="h-3.5 w-3.5 shrink-0" />封面</button>
                <button type="button" title="截圖"
                  onClick={() => setShareModalKind("screenshot")}
                  className="inline-flex shrink-0 items-center gap-2 rounded-md px-4 py-1.5 text-[12px] font-medium transition-all"
                  style={{
                    lineHeight: 1.35,
                    color: MOR_TAB_OFF_TX,
                    border: `1px solid ${MOR_TAB_OFF_BR}`,
                    background: HUB_BG,
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.color = T1;
                    (e.currentTarget as HTMLElement).style.background = RAIL;
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.color = MOR_TAB_OFF_TX;
                    (e.currentTarget as HTMLElement).style.background = HUB_BG;
                  }}
                ><ImageIcon className="h-3.5 w-3.5 shrink-0" />截圖</button>
                <button type="button" title="結果"
                  onClick={() => setShareModalKind("result")}
                  className="inline-flex shrink-0 items-center gap-2 rounded-md px-4 py-1.5 text-[12px] font-medium transition-all"
                  style={{
                    lineHeight: 1.35,
                    color: MOR_TAB_OFF_TX,
                    border: `1px solid ${MOR_TAB_OFF_BR}`,
                    background: HUB_BG,
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.color = T1;
                    (e.currentTarget as HTMLElement).style.background = RAIL;
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.color = MOR_TAB_OFF_TX;
                    (e.currentTarget as HTMLElement).style.background = HUB_BG;
                  }}
                ><ImageIcon className="h-3.5 w-3.5 shrink-0" />結果</button>
                <div className="mx-0.5 h-4 w-px shrink-0" style={{ background: HUB_DIV }} />
                <IconBtn onClick={() => setUrlOpen(v => !v)} active={urlOpen} title="從 URL 擷取內容">
                  <Link2 className="h-3.5 w-3.5" />
                </IconBtn>
                <button
                  type="button"
                  disabled={pasteBloggerBusy}
                  onClick={() => void pasteBloggerArticle()}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-medium transition-all disabled:opacity-45"
                  style={{
                    lineHeight: 1.35,
                    color: MOR_TAB_OFF_TX,
                    border: `1px solid ${MOR_TAB_OFF_BR}`,
                    background: HUB_BG,
                  }}
                  title="從剪貼簿貼上 Blogger 文章 HTML（會略整理整頁／片段，取代目前內文）"
                  onMouseEnter={e => {
                    if (!pasteBloggerBusy) {
                      (e.currentTarget as HTMLElement).style.color = T1;
                      (e.currentTarget as HTMLElement).style.background = RAIL;
                    }
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.color = MOR_TAB_OFF_TX;
                    (e.currentTarget as HTMLElement).style.background = HUB_BG;
                  }}
                >
                  <ClipboardPaste className="h-3.5 w-3.5 shrink-0" />
                  {pasteBloggerBusy ? "讀取中…" : "貼上 Blogger"}
                </button>
                <button type="button" onClick={copyHTML}
                  className="flex shrink-0 items-center gap-1.5 px-2 py-1 text-[11px] font-medium transition-colors"
                  style={{ color: htmlCopied ? GREEN : DH4 }}
                  onMouseEnter={e => { if (!htmlCopied) (e.currentTarget as HTMLElement).style.color = DH1; }}
                  onMouseLeave={e => { if (!htmlCopied) (e.currentTarget as HTMLElement).style.color = DH4; }}
                >
                  {htmlCopied ? <><Check className="h-3.5 w-3.5" />已複製 HTML</> : <><Copy className="h-3.5 w-3.5" />複製 HTML</>}
                </button>
              </div>
              <button type="button" onClick={onSave}
                className="inline-flex shrink-0 items-center gap-1.5 text-[13px] font-semibold px-1.5 py-1 transition-colors rounded-md"
                style={{
                  background: "transparent",
                  border: "none",
                  color: saved ? GREEN : DH2,
                }}
                onMouseEnter={e => {
                  if (!saved) (e.currentTarget as HTMLElement).style.color = DH1;
                }}
                onMouseLeave={e => {
                  if (!saved) (e.currentTarget as HTMLElement).style.color = DH2;
                }}>
                {saved ? <Check className="h-4 w-4 shrink-0" /> : <Save className="h-4 w-4 shrink-0" />}
                {saved ? "已儲存" : "儲存"}
              </button>
            </div>
          </header>
          {pasteBloggerErr && (
            <div
              className="shrink-0 px-7 py-2 text-[12px] leading-snug"
              style={{ background: "#FEF2F2", color: RED, borderBottom: `1px solid ${HUB_DIV}` }}
              role="alert"
            >
              {pasteBloggerErr}
            </div>
          )}
          <section className={HUB_META_CLASS} style={{ background: HUB_BG, borderBottom: `1px solid ${HUB_DIV}` }}>
            <div className={`${HUB_META_INNER} shrink-0 px-7 pb-2`}>
              <input value={article.title} onChange={e => set({ title: e.target.value })}
                placeholder="文章標題…"
                className="block w-full min-h-[38px] bg-transparent font-bold focus:outline-none"
                style={{ color: DH1, fontSize: "32px", lineHeight: 1.2, letterSpacing: "-0.025em", caretColor: BLUE }}
              />
            </div>
            <div className={`${HUB_META_INNER} flex shrink-0 items-center gap-2 px-7 pb-4`}>
              <Calendar className="h-3.5 w-3.5 shrink-0" style={{ color: DH4 }} />
              <input type="date" value={article.date} onChange={e => set({ date: e.target.value })}
                className="bg-transparent text-[13px] focus:outline-none font-medium" style={{ color: DH3 }} />
            </div>
          </section>

          {/* 內容區：滿欄寬、overflow-x-hidden */}
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden overflow-x-hidden min-w-0" style={{ background: HUB_BG }}>
            <div
              className="flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden pl-7 pr-0"
              style={{ background: HUB_BG, paddingTop: HUB_BODY_TOP_PAD }}
            >
              {tab === "edit" && (
                isRawHtmlBody(article.content) ? (
                  <HtmlBodyEditor
                    ref={mainHtmlEditorRef}
                    value={article.content}
                    onChange={(html) => set({ content: html })}
                    className={`${previewStyles.preview} box-border min-h-0 w-full flex-1 overflow-y-auto border-0 pb-10 focus:outline-none`}
                    style={{ ...BODY, color: DH2, caretColor: BLUE }}
                  />
                ) : (
                  <textarea
                    ref={contentTextareaRef}
                    value={article.content}
                    onChange={e => set({ content: e.target.value })}
                    placeholder="Markdown 或 Blogger HTML（預覽會如發文後呈現）…"
                    className="box-border min-h-0 w-full flex-1 resize-none overflow-y-auto border-0 bg-transparent focus:outline-none"
                    style={{ ...BODY, color: DH2, caretColor: BLUE }}
                  />
                )
              )}
              {tab === "preview" && (
                <div className="min-h-0 min-w-0 flex-1 overflow-y-auto pr-4">
                  {article.content.trim() ? (
                    <div className="min-w-0">
                      {/* eslint-disable-next-line react/no-danger -- 本機母版預覽，等同 Blogger 所見即所得 */}
                      <div
                        className={`${previewStyles.preview} pb-10 select-text`}
                        dangerouslySetInnerHTML={{ __html: leftBodyPreviewHtml }}
                      />
                    </div>
                  ) : (
                    <p className="max-w-[850px]" style={{ ...BODY, color: DH4 }}>（尚無內容）</p>
                  )}
                </div>
              )}
              {tab === "html" && (
                <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2 overflow-y-auto pr-4">
                  <p className="max-w-[850px] shrink-0 text-[11px] leading-relaxed" style={{ color: DH4 }}>
                    以下為<strong>內文原始碼</strong>（Markdown 或 HTML，與「編輯」同源）。工具列「貼上 Blogger」可從剪貼簿貼整篇或片段 HTML。「複製 HTML」仍會自動加上標題與發布時間區塊。
                  </p>
                  <textarea
                    value={article.content}
                    onChange={(e) => set({ content: e.target.value })}
                    spellCheck={false}
                    className="box-border min-h-0 w-full max-w-[850px] flex-1 resize-none overflow-auto whitespace-pre rounded-lg border font-mono focus:outline-none"
                    style={{
                      fontSize: "13px",
                      lineHeight: 1.65,
                      color: T2,
                      background: RAIL,
                      borderColor: DIV,
                      padding: "20px",
                      caretColor: BLUE,
                    }}
                  />
                </div>
              )}
            </div>
          </div>

        </div>

        {showRef && (
          <div
            className="flex min-h-0 shrink-0 flex-col overflow-hidden overflow-x-hidden min-w-0"
            style={{ width: `${refWidth}px`, background: HUB_BG_REF, borderLeft: `1px solid ${HUB_DIV}`, position: "relative" }}
          >
            <div className="absolute top-0 left-0 z-10 h-full cursor-col-resize"
              style={{ width: "14px" }}
              onMouseDown={e => {
                e.preventDefault();
                const startX = e.clientX, startW = refWidth;
                const onMove = (ev: MouseEvent) => onRefResize(Math.min(800, Math.max(200, startW - (ev.clientX - startX))));
                const onUp   = () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
                window.addEventListener("mousemove", onMove);
                window.addEventListener("mouseup", onUp);
              }} />

            <header
              className={HUB_HEADER_CLASS}
              style={{ background: HUB_BG_REF }}
            >
              <div className={HUB_TITLE_ROW_CLASS} style={{ margin: "0 auto" }}>
                <Eye className="h-3 w-3 shrink-0" style={{ color: DH4 }} />
                <span className="text-[15px] font-bold" style={{ color: DH1 }}>範例參考</span>
              </div>
              <div className={HUB_TOOLBAR_ROW_CLASS} style={{ margin: "0 auto" }}>
                <div
                  className="flex min-h-[36px] min-w-0 flex-1 items-center gap-3 overflow-x-auto"
                  style={{ WebkitOverflowScrolling: "touch" }}
                >
                  {(["preview", "edit"] as const).map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setRefTab(t)}
                      className="shrink-0 text-[13px] font-semibold rounded-md transition-all px-5 py-1.5"
                      style={{
                        lineHeight: 1.35,
                        background: refTab === t ? BLUDM : HUB_BG_REF,
                        color: refTab === t ? T1 : MOR_TAB_OFF_TX,
                        border: refTab === t ? `1.5px solid ${BLUE}` : `1px solid ${MOR_TAB_OFF_BR}`,
                        boxShadow: "none",
                      }}
                    >
                      {t === "edit" ? "修改" : "預覽"}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={saveRefSample}
                  className="inline-flex shrink-0 items-center gap-1.5 text-[13px] font-semibold px-1.5 py-1 transition-colors rounded-md"
                  style={{ background: "transparent", border: "none", color: refSaved ? GREEN : DH2 }}
                  onMouseEnter={e => { if (!refSaved) (e.currentTarget as HTMLElement).style.color = DH1; }}
                  onMouseLeave={e => { if (!refSaved) (e.currentTarget as HTMLElement).style.color = DH2; }}
                >
                  {refSaved ? <Check className="h-4 w-4 shrink-0" /> : <Save className="h-4 w-4 shrink-0" />}
                  {refSaved ? "已儲存" : "儲存"}
                </button>
              </div>
            </header>
            <section className={HUB_META_CLASS} style={{ background: HUB_BG_REF, borderBottom: `1px solid ${HUB_DIV}` }}>
              <div className={`${HUB_META_INNER} shrink-0 px-7 pb-2`}>
                <input
                  type="text"
                  value={refSampleTitle}
                  onChange={(e) => setRefDraft(applyRefHeadingToDraft(refDraft, e.target.value))}
                  placeholder="範例標題（與第一則 HTML 註解或開頭 # 標題同步）…"
                  className="block w-full min-h-[38px] bg-transparent font-bold focus:outline-none"
                  style={{
                    color: refSampleTitle ? DH1 : DH4,
                    fontSize: "32px",
                    lineHeight: 1.2,
                    letterSpacing: "-0.025em",
                    caretColor: BLUE,
                  }}
                />
              </div>
              <div className={`${HUB_META_INNER} flex shrink-0 items-center gap-2 px-7 pb-4`}>
                <Calendar className="h-3.5 w-3.5 shrink-0" style={{ color: DH4 }} />
                <input type="date" value={article.date} onChange={e => set({ date: e.target.value })}
                  className="bg-transparent text-[13px] focus:outline-none font-medium" style={{ color: DH3 }} />
              </div>
            </section>

            <div className="flex min-h-0 flex-1 flex-col overflow-hidden overflow-x-hidden min-w-0" style={{ background: HUB_BG_REF }}>
              <div
                className="flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden pl-7 pr-0"
                style={{ background: HUB_BG_REF, paddingTop: HUB_BODY_TOP_PAD }}
              >
                {refTab === "edit" ? (
                  isRawHtmlBody(refDraft) ? (
                    <HtmlBodyEditor
                      value={refDraft}
                      onChange={setRefDraft}
                      className={`${previewStyles.preview} box-border min-h-0 w-full flex-1 overflow-y-auto border-0 pb-10 focus:outline-none`}
                      style={{
                        ...BODY,
                        color: DH2,
                        fontSize: "15px",
                        caretColor: BLUE,
                      }}
                    />
                  ) : (
                    <textarea
                      value={refDraft}
                      onChange={e => setRefDraft(e.target.value)}
                      placeholder="範例參考（Markdown 或 Blogger HTML，與左欄可分開編輯）…"
                      className="box-border min-h-0 w-full flex-1 resize-none overflow-y-auto border-0 bg-transparent focus:outline-none"
                      style={{
                        ...BODY,
                        color: DH2,
                        fontSize: "15px",
                        caretColor: BLUE,
                      }}
                    />
                  )
                ) : refDraft.trim() ? (
                  <div className="min-h-0 min-w-0 flex-1 overflow-y-auto pr-4">
                    {/* eslint-disable-next-line react/no-danger -- 範例預覽同左欄 Blogger 渲染 */}
                    <div
                      className={`${previewStyles.preview} pb-10 select-text`}
                      style={{ fontSize: "15px" }}
                      dangerouslySetInnerHTML={{ __html: refBodyPreviewHtml }}
                    />
                  </div>
                ) : (
                  <div className="flex min-h-[200px] max-w-[850px] flex-col items-center justify-center gap-2.5" style={{ opacity: 0.35 }}>
                    <Eye className="h-6 w-6" style={{ color: DH4 }} />
                    <p className="text-center text-[11px]" style={{ color: DH4 }}>此主題尚無範例文章 · 請按「修改」新增</p>
                  </div>
                )}
              </div>
            </div>

            <div className="shrink-0" style={{ padding: "8px 28px", borderTop: `1px solid ${HUB_DIV}`, background: HUB_BG_REF }}>
              <span className="text-[10px]" style={{ color: DH4 }}>
                {refTab === "edit" ? "編輯中 · 儲存後與左欄一併寫入主文章資料" : "預覽 · 與左欄母版內容可獨立"}
              </span>
            </div>
          </div>
        )}
      </div>

      <ShareAssetModal
        open={shareModalKind !== null}
        kind={shareModalKind}
        onClose={() => setShareModalKind(null)}
        onInsert={insertMarkdownAtCursor}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   CHECKLIST RULES
═══════════════════════════════════════════════════════════ */
function ChecklistRules() {
  const [cats,       setCats]       = useState<RuleCategory[]>(DEFAULT_RULES);
  const [checked,    setChecked]    = useState<Set<string>>(new Set());
  const [editing,    setEditing]    = useState(false);
  const [draft,      setDraft]      = useState(() => cats2text(DEFAULT_RULES));
  const [saved,      setSaved]      = useState(false);
  const [promptText, setPromptText] = useState(DEFAULT_PROMPT);
  const [promptEdit, setPromptEdit] = useState(false);
  const [promptDraft,setPromptDraft]= useState(DEFAULT_PROMPT);
  const [copied,     setCopied]     = useState(false);
  const [aiRunning,  setAiRunning]  = useState(false);
  const aiTimerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toggle = (k: string) => setChecked(p => { const n = new Set(p); n.has(k) ? n.delete(k) : n.add(k); return n; });
  const saveRules  = () => { setCats(text2cats(draft)); setEditing(false); setSaved(true); setTimeout(() => setSaved(false), 2000); };
  const savePrompt = () => { setPromptText(promptDraft); setPromptEdit(false); };
  const copy = () => navigator.clipboard.writeText(promptText).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });

  const total = cats.reduce((s, c) => s + c.rules.length, 0);
  const done  = checked.size;

  /** 僅逐條勾選規範進度示意，不修改母文（避免在正文末尾插入 AI 示意文字） */
  const runAiAll = useCallback(() => {
    if (editing || aiRunning) return;
    const keys = ruleKeysFromCats(cats);
    if (keys.length === 0) return;
    setAiRunning(true);
    setChecked(new Set());
    let i = 0;
    const step = () => {
      if (i >= keys.length) {
        setAiRunning(false);
        return;
      }
      const k = keys[i];
      setChecked(prev => new Set(prev).add(k));
      i += 1;
      aiTimerRef.current = setTimeout(step, 520);
    };
    aiTimerRef.current = setTimeout(step, 450);
  }, [editing, aiRunning, cats]);

  useEffect(() => () => {
    if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
  }, []);

  /* 首版規格（莫蘭迪 MOR_FIELD_BG / MOR_FIELD_BR）— 見專案對話建立時的實作 */
  const headerAiBtn = (
    <button type="button" onClick={runAiAll} disabled={editing || aiRunning}
      className="inline-flex items-center gap-1.5 rounded-lg text-[12px] font-semibold transition-opacity disabled:opacity-45"
      style={{
        padding: "7px 11px",
        whiteSpace: "nowrap",
        color: MOR_TAB_OFF_TX,
        border: `1.5px solid ${MOR_FIELD_BR}`,
        background: MOR_FIELD_BG,
      }}
      title="依規範逐條勾選檢核（不修改母文正文）">
      <Sparkles className="h-4 w-4 shrink-0" style={{ color: MOR_HASH }} />
      {aiRunning ? "AI 處理中…" : "全部交由 AI 完成"}
    </button>
  );

  return (
    <Pane title="寫作規範" open headerRight={headerAiBtn}>
    <div className="space-y-3">

      {/* Header row */}
      <div className="flex items-center justify-between">
        <span className="text-[14px]" style={{ color: T4 }}>{done}/{total} 完成</span>
        {editing ? (
          <div className="flex gap-1.5">
            <button onClick={() => { setDraft(cats2text(cats)); setEditing(false); }}
              className="px-2 py-0.5 rounded text-[12px]" style={{ color: T4 }}>取消</button>
            <button onClick={saveRules}
              className="flex items-center gap-1 px-2 py-0.5 rounded text-[12px] font-semibold"
              style={{ background: "rgba(52,211,153,0.1)", color: GREEN }}>
              <Save className="h-3.5 w-3.5" />儲存
            </button>
          </div>
        ) : (
          <button onClick={() => { setDraft(cats2text(cats)); setEditing(true); }}
            className="px-2 py-0.5 rounded text-[12px] transition-colors"
            style={{ color: T4 }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = T1; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = T4; }}
          >編輯規範</button>
        )}
      </div>

      {saved && (
        <div className="flex items-center gap-1 text-[12px] rounded px-2 py-1.5"
          style={{ background: "rgba(52,211,153,0.07)", color: GREEN }}>
          <Check className="h-3.5 w-3.5" />已儲存規範
        </div>
      )}

      {editing ? (
        <div className="rounded overflow-hidden" style={{ background: BG }}>
          <p className="px-3 py-1.5 text-[10px] uppercase tracking-widest"
            style={{ color: T5, borderBottom: `1px solid ${DIV}` }}>
            ## 分類　- 規則
          </p>
          <textarea value={draft} onChange={e => setDraft(e.target.value)}
            className="w-full resize-none bg-transparent px-3 py-2.5 text-[14px] focus:outline-none font-mono"
            style={{ color: T2, lineHeight: 1.7, minHeight: "220px", caretColor: BLUE }} />
        </div>
      ) : (
        <div className={`space-y-4 ${aiRunning ? "opacity-95" : ""}`}>
          {cats.map(cat => (
            <div key={cat.category}>
              <p className="text-[16px] font-bold mb-3" style={{ color: T1 }}>
                {cat.category}
              </p>
              <ul className="space-y-0">
                {cat.rules.map((rule, ri) => {
                  const k = `${cat.category}::${ri}`;
                  const dk = checked.has(k);
                  return (
                    <li key={k}
                      className="flex items-center gap-2.5 cursor-pointer select-none rounded transition-all"
                      style={{ padding: "5px 4px" }}
                      onClick={() => { if (!aiRunning) toggle(k); }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.02)"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                    >
                      <span className="shrink-0 h-[14px] w-[14px] rounded flex items-center justify-center transition-all"
                        style={{ border: `1.5px solid ${dk ? T5 : "#334155"}` }}>
                        {dk && <Check className="h-2 w-2" style={{ color: T5 }} strokeWidth={3} />}
                      </span>
                      <span className="text-[15px] leading-snug transition-all"
                        style={{
                          color: dk ? T3 : T2,
                          textDecoration: dk ? `line-through solid ${T3}` : "none",
                        }}>
                        {rule}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* Progress */}
      {!editing && total > 0 && (
        <div className="h-px w-full rounded-full" style={{ background: DIV }}>
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.round((done / total) * 100)}%`, background: done === total ? GREEN : BLUE, opacity: 0.6 }} />
        </div>
      )}

      {/* Cursor prompt block */}
      <div className="rounded overflow-hidden" style={{ background: BG }}>
        <div className="flex items-center justify-between px-3 py-2" style={{ borderBottom: `1px solid ${DIV}` }}>
          <span className="text-[17px] font-bold" style={{ color: T1 }}>提示詞</span>
          <div className="flex gap-1.5">
            {promptEdit ? (
              <>
                <button onClick={() => { setPromptDraft(promptText); setPromptEdit(false); }}
                  className="px-2 py-0.5 rounded text-[12px]" style={{ color: T4 }}>取消</button>
                <button onClick={savePrompt}
                  className="flex items-center gap-1 px-2 py-0.5 rounded text-[12px] font-semibold"
                  style={{ background: "rgba(52,211,153,0.1)", color: GREEN }}>
                  <Save className="h-3.5 w-3.5" />儲存
                </button>
              </>
            ) : (
              <button onClick={() => { setPromptDraft(promptText); setPromptEdit(true); }}
                className="px-2 py-0.5 rounded text-[12px] transition-colors"
                style={{ color: T4 }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = T1; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = T4; }}
              >編輯</button>
            )}
          </div>
        </div>
        {promptEdit ? (
          <textarea value={promptDraft} onChange={e => setPromptDraft(e.target.value)}
            className="w-full resize-y bg-transparent px-4 py-4 text-[16px] focus:outline-none font-mono"
            style={{ color: T2, lineHeight: 1.75, minHeight: "min(52vh, 420px)", caretColor: MOR_HASH }} />
        ) : (
          <div className="px-4 py-4">
            <pre className="text-[16px] font-sans whitespace-pre-wrap" style={{ color: T2, lineHeight: 1.75 }}>
              {promptText}
            </pre>
          </div>
        )}
        {!promptEdit && (
          <div className="px-4 py-2.5" style={{ borderTop: `1px solid ${DIV}` }}>
            <button onClick={copy}
              className="w-full flex items-center justify-center gap-1.5 rounded py-2 text-[14px] font-medium transition-colors"
              style={{ background: copied ? "rgba(52,211,153,0.07)" : "rgba(255,255,255,0.04)", color: copied ? GREEN : T3 }}>
              {copied ? <><Check className="h-4 w-4" />已複製</> : <><Copy className="h-4 w-4" />複製 Prompt</>}
            </button>
          </div>
        )}
      </div>
    </div>
    </Pane>
  );
}

/* ═══════════════════════════════════════════════════════════
   SAMPLE EDITOR
═══════════════════════════════════════════════════════════ */
function SampleEditor({ article, onChange }: { article: Article; onChange: (a: Article) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState(article.sample);
  const [saved,   setSaved]   = useState(false);

  useEffect(() => {
    setDraft(article.sample);
    setEditing(false);
  }, [article.id, article.sample]);

  const handleSave = () => {
    onChange({ ...article, sample: draft });
    setSaved(true); setEditing(false);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[15px] font-bold" style={{ color: T1 }}>文章</span>
        <div className="flex gap-1.5">
          {editing ? (
            <>
              <button onClick={() => { setDraft(article.sample); setEditing(false); }}
                className="px-2 py-0.5 rounded text-[11px]" style={{ color: T4 }}>取消</button>
              <button onClick={handleSave}
                className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold"
                style={{ background: "rgba(52,211,153,0.1)", color: GREEN }}>
                <Save className="h-3 w-3" />儲存
              </button>
            </>
          ) : (
            <button onClick={() => { setDraft(article.sample); setEditing(true); }}
              className="px-2 py-0.5 rounded text-[11px] transition-colors"
              style={{ color: T4 }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = T1; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = T4; }}
            >編輯</button>
          )}
        </div>
      </div>

      {saved && (
        <div className="flex items-center gap-1 text-[11px] rounded px-2 py-1.5"
          style={{ background: "rgba(52,211,153,0.07)", color: GREEN }}>
          <Check className="h-3 w-3" />已儲存範例文章
        </div>
      )}

      <div className="rounded overflow-hidden" style={{ background: BG }}>
        {editing ? (
          <textarea value={draft} onChange={e => setDraft(e.target.value)}
            className="w-full resize-none bg-transparent px-3 py-2.5 text-[12px] focus:outline-none font-mono"
            style={{ color: T2, lineHeight: 1.65, minHeight: "180px", caretColor: BLUE }} />
        ) : (
          <div className="max-h-44 overflow-y-auto px-3 py-2.5">
            <pre className="text-[12px] font-sans whitespace-pre-wrap" style={{ color: T2, lineHeight: 1.65 }}>
              {article.sample || <span style={{ color: T3 }}>（尚無範例，點「編輯」新增）</span>}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   RIGHT UTILITY SIDEBAR
═══════════════════════════════════════════════════════════ */
/* ═══════════════════════════════════════════════════════════
   PUBLISH META  (title + tags + platforms + JSON I/O)
═══════════════════════════════════════════════════════════ */

function WpDarkAccordion({ title, defaultOpen = true, children }: {
  title: string; defaultOpen?: boolean; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left transition-colors"
        style={{ color: "#f8fafc", background: open ? "rgba(255,255,255,0.05)" : "transparent" }}
      >
        <span className="text-[13px] font-semibold tracking-wide">{title}</span>
        {open ? <ChevronDown className="h-4 w-4 shrink-0 opacity-60" style={{ color: "#94a3b8" }} />
          : <ChevronR className="h-4 w-4 shrink-0 opacity-60" style={{ color: "#94a3b8" }} />}
      </button>
      {open && <div className="space-y-2 px-3 pb-3">{children}</div>}
    </div>
  );
}

function getTs() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,"0")}-${String(n.getDate()).padStart(2,"0")} ${String(n.getHours()).padStart(2,"0")}:${String(n.getMinutes()).padStart(2,"0")}`;
}

/** Blogger 標籤欄：英文逗號分隔；內文仍存為不含 # 的字串陣列 */
function parseCommaTagLine(s: string): string[] {
  const parts = s.replace(/，/g, ",").split(",");
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of parts) {
    const t = raw.trim().replace(/^#+/u, "");
    if (!t || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out;
}

function PublishMeta({ article, onChange }: { article: Article; onChange: (a: Article) => void }) {
  const [tagInput,  setTagInput]  = useState("");
  const [copied,    setCopied]    = useState(false);
  const [tagEntryMode, setTagEntryMode] = useState<"single" | "comma">("single");
  const [commaTagsDraft, setCommaTagsDraft] = useState(() => article.tags.join(", "));
  const [tagsCopiedBlogger, setTagsCopiedBlogger] = useState(false);
  const [tagsCopiedHash, setTagsCopiedHash] = useState(false);

  const tags    = article.tags;
  const setTags = (fn: (prev: string[]) => string[]) => onChange({ ...article, tags: fn(article.tags) });

  useEffect(() => {
    setCommaTagsDraft(article.tags.join(", "));
    setTagEntryMode("single");
    setTagInput("");
  }, [article.id]);

  const addTag = () => {
    const t = tagInput.trim().replace(/^#/, "");
    if (t && !tags.includes(t)) setTags(p => [...p, t]);
    setTagInput("");
  };

  const bloggerTagsLine = tags.join(",");
  /** #字頭、標籤之間一個空白（社群／內文用） */
  const hashSpacedTagsLine = tags.length ? tags.map((t) => `#${t}`).join(" ") : "";

  const copyBloggerTags = () => {
    void navigator.clipboard.writeText(bloggerTagsLine).then(() => {
      setTagsCopiedBlogger(true);
      setTimeout(() => setTagsCopiedBlogger(false), 2000);
    });
  };

  const copyHashSpacedTags = () => {
    void navigator.clipboard.writeText(hashSpacedTagsLine).then(() => {
      setTagsCopiedHash(true);
      setTimeout(() => setTagsCopiedHash(false), 2000);
    });
  };

  const copyTitle = () => {
    void navigator.clipboard.writeText(`${article.title} (${getTs()})`).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="space-y-4">

      {/* 發文標題 */}
      <div>
        <p className="text-[17px] font-bold mb-2" style={{ color: T1 }}>發文標題</p>
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg" style={{ background: MOR_FIELD_BG, border: `1px solid ${MOR_FIELD_BR}` }}>
          <input
            value={article.title}
            onChange={(e) => onChange({ ...article, title: e.target.value })}
            className="flex-1 bg-transparent text-[15px] focus:outline-none"
            style={{ color: T1 }}
            placeholder="輸入標題…"
          />
          <button onClick={copyTitle} title="複製並自動帶入發布時間"
            className="shrink-0 transition-colors"
            style={{ color: copied ? GREEN : T4 }}
            onMouseEnter={e => { if (!copied) (e.currentTarget as HTMLElement).style.color = T1; }}
            onMouseLeave={e => { if (!copied) (e.currentTarget as HTMLElement).style.color = T4; }}>
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>
        <p className="text-[12px] mt-1.5 leading-snug" style={{ color: T5 }}>
          複製後：{article.title} ({getTs()})
        </p>
      </div>

      {/* 標籤 */}
      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
          <p className="text-[17px] font-bold flex items-center gap-1.5" style={{ color: T1 }}>
            <span style={{ color: MOR_HASH }}>#</span>標籤
          </p>
          <button
            type="button"
            onClick={() => {
              if (tagEntryMode === "single") {
                setCommaTagsDraft(tags.join(", "));
                setTagEntryMode("comma");
              } else {
                setTagEntryMode("single");
              }
            }}
            className="shrink-0 rounded px-2 py-1 text-[11px] font-semibold transition-colors"
            style={{
              background: tagEntryMode === "comma" ? "rgba(59,130,246,0.12)" : "rgba(15,23,42,0.04)",
              color: tagEntryMode === "comma" ? BLUE : T4,
              border: `1px solid ${tagEntryMode === "comma" ? "rgba(59,130,246,0.35)" : DIV}`,
            }}
            title="Blogger 後台標籤為英文逗號分隔，可一次貼上／複製"
          >
            {tagEntryMode === "single" ? "改用 , 分隔（Blogger）" : "改回逐個＋Enter"}
          </button>
        </div>
        <div className="flex flex-wrap gap-2 mb-2.5">
          {tags.map(t => (
            <span key={t} className="inline-flex items-center gap-0.5 text-[13px] px-2.5 py-1 rounded-md"
              style={{ background: "transparent", color: T2, border: "none", boxShadow: "none" }}>
              #{t}
              <button onClick={() => setTags(p => p.filter(x => x !== t))}
                className="ml-0.5 text-[15px] leading-none opacity-50 hover:opacity-100 transition-opacity">×</button>
            </span>
          ))}
        </div>
        {tagEntryMode === "single" ? (
          <div className="space-y-2">
            <div className="flex items-center px-3 py-2.5 rounded-lg" style={{ background: MOR_FIELD_BG, border: `1px solid ${MOR_FIELD_BR}` }}>
              <span className="text-[15px] font-bold mr-0.5" style={{ color: MOR_HASH }}>#</span>
              <input
                value={tagInput}
                onChange={e => {
                  const v = e.target.value.replace(/^#+/, "");
                  setTagInput(v);
                }}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                placeholder="標籤名稱，按 Enter 新增"
                className="flex-1 bg-transparent text-[15px] focus:outline-none placeholder:text-[14px]"
                style={{ color: T1 }} />
            </div>
            <div className="space-y-3">
              <div className="space-y-1">
                <p className="text-[11px] leading-snug" style={{ color: T5 }}>
                  Blogger 標籤欄：英文逗號、無空格。點欄位可全選，或按複製。
                </p>
                <div className="flex flex-wrap items-stretch gap-2">
                  <textarea
                    readOnly
                    aria-label="Blogger 標籤逗號格式，可複製"
                    rows={2}
                    value={bloggerTagsLine}
                    placeholder="（尚無標籤；用上方輸入＋Enter 新增後會自動帶入）"
                    onFocus={(e) => e.currentTarget.select()}
                    onClick={(e) => e.currentTarget.select()}
                    spellCheck={false}
                    className="min-h-[52px] min-w-0 flex-1 resize-y rounded-lg px-2.5 py-2 font-mono text-[13px] leading-relaxed focus:outline-none"
                    style={{
                      background: MOR_FIELD_BG,
                      border: `1px solid ${MOR_FIELD_BR}`,
                      color: bloggerTagsLine ? T1 : T4,
                      caretColor: "transparent",
                    }}
                  />
                  <button
                    type="button"
                    disabled={tags.length === 0}
                    onClick={copyBloggerTags}
                    className="inline-flex shrink-0 items-center gap-1 self-start rounded-md px-2.5 py-2 text-[11px] font-semibold transition-colors disabled:opacity-40"
                    style={{
                      background: tagsCopiedBlogger ? "rgba(52,211,153,0.1)" : "rgba(15,23,42,0.04)",
                      color: tagsCopiedBlogger ? GREEN : T2,
                      border: `1px solid ${tagsCopiedBlogger ? "rgba(52,211,153,0.35)" : DIV}`,
                    }}
                  >
                    {tagsCopiedBlogger ? <><Check className="h-3.5 w-3.5" />已複製</> : <><Copy className="h-3.5 w-3.5" />複製</>}
                  </button>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[11px] leading-snug" style={{ color: T5 }}>
                  # 字頭、標籤之間<strong>一個空白</strong>（例：<span className="font-mono" style={{ color: T3 }}>#財富自由 #退休</span>）。點欄位可全選，或按複製。
                </p>
                <div className="flex flex-wrap items-stretch gap-2">
                  <textarea
                    readOnly
                    aria-label="井字標籤空白分隔格式，可複製"
                    rows={2}
                    value={hashSpacedTagsLine}
                    placeholder="（尚無標籤）"
                    onFocus={(e) => e.currentTarget.select()}
                    onClick={(e) => e.currentTarget.select()}
                    spellCheck={false}
                    className="min-h-[52px] min-w-0 flex-1 resize-y rounded-lg px-2.5 py-2 font-mono text-[13px] leading-relaxed focus:outline-none"
                    style={{
                      background: MOR_FIELD_BG,
                      border: `1px solid ${MOR_FIELD_BR}`,
                      color: hashSpacedTagsLine ? T1 : T4,
                      caretColor: "transparent",
                    }}
                  />
                  <button
                    type="button"
                    disabled={tags.length === 0}
                    onClick={copyHashSpacedTags}
                    className="inline-flex shrink-0 items-center gap-1 self-start rounded-md px-2.5 py-2 text-[11px] font-semibold transition-colors disabled:opacity-40"
                    style={{
                      background: tagsCopiedHash ? "rgba(52,211,153,0.1)" : "rgba(15,23,42,0.04)",
                      color: tagsCopiedHash ? GREEN : T2,
                      border: `1px solid ${tagsCopiedHash ? "rgba(52,211,153,0.35)" : DIV}`,
                    }}
                  >
                    {tagsCopiedHash ? <><Check className="h-3.5 w-3.5" />已複製</> : <><Copy className="h-3.5 w-3.5" />複製 #</>}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <textarea
              value={commaTagsDraft}
              onChange={(e) => {
                const v = e.target.value;
                setCommaTagsDraft(v);
                onChange({ ...article, tags: parseCommaTagLine(v) });
              }}
              rows={3}
              spellCheck={false}
              placeholder="例：財富自由, 退休, 計算機（英文逗號分隔，可貼上 Blogger 整段標籤）"
              className="w-full resize-y rounded-lg px-3 py-2.5 text-[14px] focus:outline-none"
              style={{
                background: MOR_FIELD_BG,
                border: `1px solid ${MOR_FIELD_BR}`,
                color: T1,
                minHeight: "88px",
                caretColor: BLUE,
              }}
            />
            <div className="space-y-3">
              <div className="space-y-1">
                <p className="text-[11px] leading-snug" style={{ color: T5 }}>
                  Blogger（逗號、無空格）預覽：<span className="font-mono" style={{ color: T3 }}>{bloggerTagsLine || "（尚無標籤）"}</span>
                </p>
                <div className="flex flex-wrap items-stretch gap-2">
                  <textarea
                    readOnly
                    aria-label="Blogger 標籤逗號格式，可複製"
                    rows={2}
                    value={bloggerTagsLine}
                    placeholder="（尚無標籤）"
                    onFocus={(e) => e.currentTarget.select()}
                    onClick={(e) => e.currentTarget.select()}
                    spellCheck={false}
                    className="min-h-[52px] min-w-0 flex-1 resize-y rounded-lg px-2.5 py-2 font-mono text-[13px] leading-relaxed focus:outline-none"
                    style={{
                      background: MOR_FIELD_BG,
                      border: `1px solid ${MOR_FIELD_BR}`,
                      color: bloggerTagsLine ? T1 : T4,
                      caretColor: "transparent",
                    }}
                  />
                  <button
                    type="button"
                    disabled={tags.length === 0}
                    onClick={copyBloggerTags}
                    className="inline-flex shrink-0 items-center gap-1 self-start rounded-md px-2.5 py-2 text-[11px] font-semibold transition-colors disabled:opacity-40"
                    style={{
                      background: tagsCopiedBlogger ? "rgba(52,211,153,0.1)" : "rgba(15,23,42,0.04)",
                      color: tagsCopiedBlogger ? GREEN : T2,
                      border: `1px solid ${tagsCopiedBlogger ? "rgba(52,211,153,0.35)" : DIV}`,
                    }}
                  >
                    {tagsCopiedBlogger ? <><Check className="h-3.5 w-3.5" />已複製</> : <><Copy className="h-3.5 w-3.5" />複製 Blogger</>}
                  </button>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[11px] leading-snug" style={{ color: T5 }}>
                  # 字頭、空白分隔預覽：<span className="font-mono" style={{ color: T3 }}>{hashSpacedTagsLine || "（尚無標籤）"}</span>
                </p>
                <div className="flex flex-wrap items-stretch gap-2">
                  <textarea
                    readOnly
                    aria-label="井字標籤空白分隔格式，可複製"
                    rows={2}
                    value={hashSpacedTagsLine}
                    placeholder="（尚無標籤）"
                    onFocus={(e) => e.currentTarget.select()}
                    onClick={(e) => e.currentTarget.select()}
                    spellCheck={false}
                    className="min-h-[52px] min-w-0 flex-1 resize-y rounded-lg px-2.5 py-2 font-mono text-[13px] leading-relaxed focus:outline-none"
                    style={{
                      background: MOR_FIELD_BG,
                      border: `1px solid ${MOR_FIELD_BR}`,
                      color: hashSpacedTagsLine ? T1 : T4,
                      caretColor: "transparent",
                    }}
                  />
                  <button
                    type="button"
                    disabled={tags.length === 0}
                    onClick={copyHashSpacedTags}
                    className="inline-flex shrink-0 items-center gap-1 self-start rounded-md px-2.5 py-2 text-[11px] font-semibold transition-colors disabled:opacity-40"
                    style={{
                      background: tagsCopiedHash ? "rgba(52,211,153,0.1)" : "rgba(15,23,42,0.04)",
                      color: tagsCopiedHash ? GREEN : T2,
                      border: `1px solid ${tagsCopiedHash ? "rgba(52,211,153,0.35)" : DIV}`,
                    }}
                  >
                    {tagsCopiedHash ? <><Check className="h-3.5 w-3.5" />已複製</> : <><Copy className="h-3.5 w-3.5" />複製 #</>}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   RIGHT PANEL
═══════════════════════════════════════════════════════════ */
function RightPanel({ article, onChange, width, onResize }: {
  article: Article; onChange: (a: Article) => void;
  width: number; onResize: (w: number) => void;
}) {
  const sim      = article.id <= 1 ? 18 : article.id === 2 ? 54 : 82;
  const simColor = sim >= 80 ? RED : sim >= 50 ? AMBER : GREEN;

  return (
    <aside
      className="relative z-10 flex min-h-0 shrink-0 flex-col self-stretch overflow-y-auto"
      style={{
        width: `${width}px`,
        background: RAIL,
        borderLeft: `1px solid ${DIV}`,
      }}
    >

      {/* Drag handle — same pattern as Sidebar (absolute left: 0) */}
      <div className="absolute top-0 left-0 h-full cursor-col-resize"
        style={{ width: "14px", zIndex: 10 }}
        onMouseDown={e => {
          e.preventDefault();
          const startX = e.clientX, startW = width;
          const onMove = (ev: MouseEvent) => onResize(Math.min(600, Math.max(200, startW - (ev.clientX - startX))));
          const onUp   = () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
          window.addEventListener("mousemove", onMove);
          window.addEventListener("mouseup", onUp);
        }} />

      <Pane title="發文資訊" open>
        <PublishMeta article={article} onChange={onChange} />
      </Pane>

      <ChecklistRules />

      <Pane title="避險提醒" icon={<AlertTriangle className="h-3 w-3" style={{ color: AMBER }} />}>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <div className="flex justify-between text-[14px]">
              <span className="font-semibold" style={{ color: T2 }}>與上篇相似度</span>
              <span className="font-bold" style={{ color: simColor }}>{sim}%</span>
            </div>
            <div className="h-px w-full rounded-full" style={{ background: DIV }}>
              <div className="h-full rounded-full transition-all"
                style={{ width: `${sim}%`, height: "3px", background: simColor, borderRadius: "9999px" }} />
            </div>
          </div>
          {RISK.map((r, i) => (
            <div key={i} className="rounded px-3 py-2 space-y-1"
              style={{
                background: r.lv === "high" ? "#FEF2F2" : r.lv === "medium" ? "#FFFBEB" : "#F8FAFC",
                borderLeft: `3px solid ${r.lv === "high" ? "#FCA5A5" : r.lv === "medium" ? "#FCD34D" : DIV}`,
              }}>
              <div className="flex items-center gap-1.5">
                <span className="text-[13px] font-bold rounded px-2 py-0.5"
                  style={{
                    background: r.lv === "high" ? "rgba(239,68,68,0.08)" : r.lv === "medium" ? "rgba(245,158,11,0.08)" : "#F1F5F9",
                    color: r.lv === "high" ? RED : r.lv === "medium" ? AMBER : T3,
                  }}>{r.p}</span>
                <span className="text-[12px] uppercase font-bold"
                  style={{ color: r.lv === "high" ? "#dc2626" : r.lv === "medium" ? "#d97706" : T4 }}>
                  {r.lv}
                </span>
              </div>
              <p className="text-[14px] leading-relaxed" style={{ color: T2 }}>{r.t}</p>
            </div>
          ))}
        </div>
      </Pane>
    </aside>
  );
}

/* ═══════════════════════════════════════════════════════════
   PAGE
═══════════════════════════════════════════════════════════ */
const CH1_TEMPLATE_STORAGE_KEY = "postflow-library-ch1-rev";
const CH2_TEMPLATE_STORAGE_KEY = "postflow-library-ch2-rev";
/** 第 3–5 篇僅標籤等預設改版時 bump（與 ch1/ch2 HTML 版號分開） */
const LIBRARY_ARTICLES_3_5_TAG_REVISION = "2026-04-22-ch345-five-tags";
const CH345_TAG_STORAGE_KEY = "postflow-library-ch345-tags-rev";
/** Mobile01 閒聊趣味：預設第 01 篇改版時 bump（避免 localStorage 舊稿覆寫看不到） */
const MOBILE01_CH1_TEMPLATE_REVISION = "2026-04-27-mobile01-ch1-story-v1";
const MOBILE01_CH1_TEMPLATE_STORAGE_KEY = "postflow-library-mobile01-ch1-rev";

export default function LibraryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isMobile01Master = searchParams?.get("view") === "mobile01-master";
  const libraryStorageKey = isMobile01Master ? LIBRARY_ARTICLES_MOBILE01_LOCAL_KEY : LIBRARY_ARTICLES_LOCAL_KEY;
  /** 勿在 initializer 讀 localStorage：SSR 無法存取，會與客戶端首屏不一致 → dangerouslySetInnerHTML hydration 錯誤 */
  const [articles,     setArticles]     = useState<Article[]>(() =>
    Array.from({ length: 20 }, (_, i) => (isMobile01Master ? mkMobile01Article(i + 1) : mkArticle(i + 1))),
  );
  const [selectedId,   setSelectedId]   = useState(1);
  const [saved,        setSaved]        = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(230);
  const [rightWidth,   setRightWidth]   = useState(340);
  const [refWidth,     setRefWidth]     = useState(500); // 1:1 with editor

  const articlesRef = useRef(articles);
  articlesRef.current = articles;

  /**
   * 僅客戶端 mount 一次：先還原本機 20 篇，再依 session 版號覆寫第 1–2／3–5 篇預設。
   * 合併為單一 effect，避免兩次 setArticles 在 batch 中順序不確定；且不可在 useState 讀 localStorage（SSR 無 storage → hydration 錯誤）。
   */
  useEffect(() => {
    const base =
      loadLibraryArticles(libraryStorageKey) ??
      Array.from({ length: 20 }, (_, i) => (isMobile01Master ? mkMobile01Article(i + 1) : mkArticle(i + 1)));
    let reload1 = false;
    let reload2 = false;
    let reload345 = false;
    let reloadMobile01Ch1 = false;
    try {
      if (typeof sessionStorage !== "undefined") {
        reload1 = sessionStorage.getItem(CH1_TEMPLATE_STORAGE_KEY) !== BLOGGER_CH1_TEMPLATE_REVISION;
        reload2 = sessionStorage.getItem(CH2_TEMPLATE_STORAGE_KEY) !== BLOGGER_CH2_TEMPLATE_REVISION;
        reload345 = sessionStorage.getItem(CH345_TAG_STORAGE_KEY) !== LIBRARY_ARTICLES_3_5_TAG_REVISION;
        if (reload1) sessionStorage.setItem(CH1_TEMPLATE_STORAGE_KEY, BLOGGER_CH1_TEMPLATE_REVISION);
        if (reload2) sessionStorage.setItem(CH2_TEMPLATE_STORAGE_KEY, BLOGGER_CH2_TEMPLATE_REVISION);
        if (reload345) sessionStorage.setItem(CH345_TAG_STORAGE_KEY, LIBRARY_ARTICLES_3_5_TAG_REVISION);
        if (isMobile01Master) {
          reloadMobile01Ch1 =
            sessionStorage.getItem(MOBILE01_CH1_TEMPLATE_STORAGE_KEY) !== MOBILE01_CH1_TEMPLATE_REVISION;
          if (reloadMobile01Ch1) {
            sessionStorage.setItem(MOBILE01_CH1_TEMPLATE_STORAGE_KEY, MOBILE01_CH1_TEMPLATE_REVISION);
          }
        }
      }
    } catch {
      /* session 不可用時仍套用本機存檔 */
    }
    if (isMobile01Master) {
      if (!reloadMobile01Ch1) {
        setArticles(base);
        return;
      }
      setArticles(
        base.map((a) => {
          if (a.id === 1) return mkMobile01Article(1);
          return a;
        }),
      );
      return;
    }
    if (!reload1 && !reload2 && !reload345) {
      setArticles(base);
      return;
    }
    setArticles(
      base.map((a) => {
        if (a.id === 1 && reload1) return mkArticle(1);
        if (a.id === 2 && reload2) return mkArticle(2);
        if ((a.id === 3 || a.id === 4 || a.id === 5) && reload345) return mkArticle(a.id);
        return a;
      }),
    );
  }, [isMobile01Master, libraryStorageKey]);

  /** 編輯內容後寫入本機，重整仍保留（與頂部「儲存」同一資料） */
  const persistDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (persistDebounceRef.current) clearTimeout(persistDebounceRef.current);
    persistDebounceRef.current = setTimeout(() => {
      persistDebounceRef.current = null;
      saveLibraryArticles(libraryStorageKey, articles);
    }, 450);
    return () => {
      if (persistDebounceRef.current) clearTimeout(persistDebounceRef.current);
    };
  }, [articles, libraryStorageKey]);

  const article    = articles.find(a => a.id === selectedId) ?? articles[0];
  const handleChange = useCallback((u: Article) => setArticles(p => p.map(a => a.id === u.id ? u : a)), []);
  const handleSave = useCallback(() => {
    saveLibraryArticles(libraryStorageKey, articlesRef.current);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [libraryStorageKey]);

  return (
    <div
      className="flex h-screen w-full overflow-hidden"
      style={{ background: BG, color: T1 }}
    >

      <Sidebar articles={articles} selId={selectedId} onSel={setSelectedId} width={sidebarWidth} onResize={setSidebarWidth} />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">

        <header
          className="flex shrink-0 items-center justify-between"
          style={{ padding: "0 20px", height: `${LIB_HEADER_H}px`, background: RAIL, borderBottom: `1px solid ${DIV}` }}
        >

          <div className="flex items-center gap-2">
            <button onClick={() => router.push("/postflow")}
              className="flex items-center gap-1.5 rounded px-2 py-1 text-[12px] transition-colors"
              style={{ color: T4 }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = T1; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = T4; }}
            >
              <ArrowLeft className="h-3.5 w-3.5" />儀表板
            </button>
            <span style={{ color: T5 }}>/</span>
            <span className="text-[13px] font-semibold" style={{ color: T1 }}>母版內容庫</span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{ background: BLUDM, color: BLUE }}>20</span>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={handleSave}
              className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-[13px] font-semibold transition-all"
              style={{
                background: saved ? "#DCFCE7" : "#F1F5F9",
                color: saved ? "#15803D" : T1,
                border: `1px solid ${saved ? "#86EFAC" : DIV}`,
              }}>
              {saved ? <><Check className="h-4 w-4" />已儲存</> : <><Save className="h-4 w-4" />儲存</>}
            </button>
          </div>
        </header>

        <div className="relative flex min-h-0 w-full flex-1 flex-row items-stretch overflow-hidden overflow-x-hidden">
          <WritingHub article={article} onChange={handleChange} refWidth={refWidth} onRefResize={setRefWidth}
            onSave={handleSave} saved={saved} />

          <RightPanel article={article} onChange={handleChange} width={rightWidth} onResize={setRightWidth} />
        </div>

      </div>
    </div>
  );
}
