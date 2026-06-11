"use client";

import { useCallback, useEffect, useId, useRef, useState, type FormEvent } from "react";
import { HomeFooterMobileExpand } from "./components/home-footer-mobile-expand";
import styles from "./contact-us-panel.module.css";
import { IssueRegionPicker, type IssuePickResult } from "./issue-region-picker";

type IssueItem = { id: string; area: string; detail: string; screenshotDataUrl?: string | null };

/** 草稿還原時缺 id 的列（僅 client 的 parse，用索引保證穩定） */
function parseIssueItems(raw: unknown): IssueItem[] | null {
  if (!Array.isArray(raw)) return null;
  const out: IssueItem[] = [];
  for (let i = 0; i < raw.length; i++) {
    const row = raw[i];
    if (!row || typeof row !== "object") continue;
    const r = row as { id?: unknown; area?: unknown; detail?: unknown };
    const id = typeof r.id === "string" && r.id ? r.id : `parsed-row-${i}`;
    out.push({
      id,
      area: typeof r.area === "string" ? r.area : "",
      detail: typeof r.detail === "string" ? r.detail : "",
    });
  }
  return out.length > 0 ? out : null;
}

type SegmentMode = "issue" | "feature";

type DetailPresetItem = { id: string; label: string; text: string };

/** 問題說明：一鍵插入常見描述骨架（使用者可再改） */
const ISSUE_DETAIL_PRESETS: DetailPresetItem[] = [
  {
    id: "issue-calc",
    label: "計算與預期不符",
    text: "計算結果與我預期不同，想請團隊協助確認是否為合理結果。\n\n預期：\n實際：\n操作步驟（愈細愈好）：\n",
  },
  {
    id: "issue-import",
    label: "匯入／貼上異常",
    text: "匯入或貼上資料後出現異常。\n\n資料來源／格式：\n預期行為：\n實際狀況（錯誤訊息或畫面）：\n",
  },
  {
    id: "issue-field",
    label: "欄位無法輸入",
    text: "某個欄位無法正常輸入或內容會被清空。\n\n欄位名稱／位置：\n使用的裝置與瀏覽器：\n",
  },
  {
    id: "issue-export",
    label: "匯出／複製有誤",
    text: "匯出或複製結果時內容不正確。\n\n使用的功能：\n缺漏或格式問題描述：\n",
  },
  {
    id: "issue-layout",
    label: "手機或瀏覽器跑版",
    text: "在手機或某瀏覽器上畫面或操作有問題。\n\n裝置型號／螢幕寬度：\n瀏覽器與版本：\n問題畫面說明：\n",
  },
  {
    id: "issue-perf",
    label: "載入慢或失敗",
    text: "頁面載入很慢、常轉圈或偶發失敗。\n\n發生頻率：\n當時網路環境（約略即可）：\n",
  },
  {
    id: "issue-a11y",
    label: "閱讀或對比不易",
    text: "字級、對比或深色模式下閱讀／操作不易。\n\n希望改善的方向：\n",
  },
  {
    id: "issue-copy",
    label: "ETF／稅務說明疑問",
    text: "某段 ETF 或稅務相關說明想進一步確認。\n\n涉及的品項或段落（可截圖標示）：\n我的疑問：\n",
  },
  {
    id: "issue-compare",
    label: "與他處資料比對",
    text: "與其他試算工具或公開資料比對後有差異。\n\n比對來源：\n差異摘要：\n",
  },
  {
    id: "issue-other",
    label: "其他問題",
    text: "其他問題（請盡量寫出重現步驟，並可附截圖）。\n\n",
  },
];

/** 建議說明：一鍵插入常見建議骨架 */
const FEATURE_DETAIL_PRESETS: DetailPresetItem[] = [
  {
    id: "feat-calc",
    label: "新增試算／比較",
    text: "希望新增某類試算或比較功能。\n\n使用情境：\n預期看到的結果或欄位：\n",
  },
  {
    id: "feat-default",
    label: "可自訂預設值",
    text: "希望可自行調整預設參數或記住上次輸入。\n\n想記住的項目：\n",
  },
  {
    id: "feat-export",
    label: "更多匯出格式",
    text: "希望支援更多匯出格式（例如 CSV、PDF 等）。\n\n主要用途：\n",
  },
  {
    id: "feat-viz",
    label: "圖表或摘要",
    text: "希望在結果區增加圖表、摘要或一目了然的重點。\n\n想法：\n",
  },
  {
    id: "feat-mobile",
    label: "手機流程優化",
    text: "希望優化手機上的操作動線。\n\n目前卡在哪一步：\n",
  },
  {
    id: "feat-batch",
    label: "批次或多筆",
    text: "希望支援批次輸入、多帳戶或多情境並排。\n\n場景：\n",
  },
  {
    id: "feat-copy",
    label: "用語與說明",
    text: "希望介面用語、欄位說明或教學更易懂。\n\n哪裡容易誤解：\n",
  },
  {
    id: "feat-integrate",
    label: "與外部連動",
    text: "希望與其他理財工具、試算或資料來源連動或對照。\n\n對象／方式想法：\n",
  },
  {
    id: "feat-learn",
    label: "教學／範例",
    text: "希望加入教學、常見問答或試算範例，降低上手門檻。\n\n",
  },
  {
    id: "feat-other",
    label: "其他建議",
    text: "其他建議（請說明能帶給使用者的幫助）。\n\n",
  },
];

const DETAIL_FIELD_MAX_LEN = 8000;

/** 說明欄開頭「待選」佔位，選區後可替換為實際區域名 */
function areaLineForPreset(mode: SegmentMode, areaTrimmed: string): string {
  if (mode === "issue") {
    return areaTrimmed ? `【回報區域】${areaTrimmed}` : "【回報區域】待選";
  }
  return areaTrimmed ? `【相關區域】${areaTrimmed}` : "【相關區域】待選";
}

function buildPresetBlock(mode: SegmentMode, areaTrimmed: string, templateText: string): string {
  const t = templateText.trimEnd();
  return `${areaLineForPreset(mode, areaTrimmed)}\n\n${t}`;
}

/** 使用者在上方填入／選取區域後，把說明裡的「待選」換成簡短名稱 */
function replacePendingAreaInDetail(detail: string, mode: SegmentMode, newArea: string): string {
  const a = newArea.trim();
  if (!a) return detail;
  const re = mode === "issue" ? /^【回報區域】待選\s*\n+/ : /^【相關區域】待選\s*\n+/;
  const prefix = mode === "issue" ? `【回報區域】${a}\n\n` : `【相關區域】${a}\n\n`;
  return detail.replace(re, prefix);
}

/** 分段表單信件頂部：附圖與 mailto 限制（整段只出現一次） */
const EMAIL_SCREENSHOT_INTRO =
  "※ 附圖說明：此內容為純文字，截圖不會自動附上。若表單有預覽圖，請回表單按「複製圖片」貼入撰寫區，或「下載」後附加；無截圖亦可直接寄出。\n";

function formatSegmentItemsForEmail(items: IssueItem[], mode: SegmentMode): string {
  const rows = items.filter((i) => i.area.trim() || i.detail.trim());
  if (rows.length === 0) return "";
  const sep = "\n\n" + "-".repeat(36) + "\n\n";
  if (mode === "issue") {
    return rows
      .map((it, idx) => {
        const a = it.area.trim() || "（未填）";
        const d = it.detail.trim() || "（未填）";
        const pic = it.screenshotDataUrl
          ? "\n\n（此筆於表單有截圖預覽 → 複製貼上或下載附檔即可；略過不附圖亦無妨。）"
          : "";
        return `■ 問題 ${idx + 1}\n回報區域：${a}\n\n問題說明：\n${d}${pic}`;
      })
      .join(sep);
  }
  return rows
    .map((it, idx) => {
      const a = it.area.trim() || "（未填）";
      const d = it.detail.trim() || "（未填）";
      const pic = it.screenshotDataUrl
        ? "\n\n（此筆於表單有截圖預覽 → 複製貼上或下載附檔即可；略過不附圖亦無妨。）"
        : "";
      return `■ 建議 ${idx + 1}\n相關區域：${a}\n\n建議說明：\n${d}${pic}`;
    })
    .join(sep);
}

const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() ?? "";

const CONTACT_TYPES = [
  { id: "issue", label: "問題回報" },
  { id: "feature", label: "功能建議" },
  { id: "business", label: "商業合作" },
] as const;

type ContactTypeId = (typeof CONTACT_TYPES)[number]["id"];

/** 網頁版信箱 compose URL 過長時瀏覽器可能失敗 */
const WEB_COMPOSE_MAX_LEN = 7500;

type WebmailId = "gmail" | "outlook" | "yahoo";

/** Email 標籤右側：一鍵帶入常見網域（「自用」為 @email.com） */
const EMAIL_DOMAIN_SUFFIXES = [
  { id: "gmail", display: "@gmail.com", domain: "gmail.com", title: "帳號@gmail.com" },
  { id: "yahoo", display: "@yahoo.com.tw", domain: "yahoo.com.tw", title: "帳號@yahoo.com.tw" },
  { id: "outlook", display: "@outlook.com", domain: "outlook.com", title: "帳號@outlook.com" },
  { id: "self", display: "自用", domain: "email.com", title: "帳號@email.com（自用）" },
] as const;

function typeLabel(id: ContactTypeId) {
  return CONTACT_TYPES.find((t) => t.id === id)?.label ?? "問題回報";
}

function isValidEmail(s: string) {
  const t = s.trim();
  if (!t) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t);
}

const CONTACT_DRAFT_STORAGE_KEY = "wealth-freedom-calculator-contact-draft-v1";

type ContactDraftStored = {
  v: 2 | 3;
  contactType: ContactTypeId;
  senderName: string;
  replyEmail: string;
  subjectField: string;
  messageBody: string;
  issueItems: IssueItem[];
  featureItems: IssueItem[];
};

function isContactTypeId(s: string): s is ContactTypeId {
  return CONTACT_TYPES.some((c) => c.id === s);
}

/** 草稿不存截圖（避免 localStorage 爆量） */
function stripScreenshotsForStorage(items: IssueItem[]): IssueItem[] {
  return items.map(({ id, area, detail }) => ({ id, area, detail }));
}

function readContactDraft(stablePrefix: string): ContactDraftStored | null {
  if (typeof window === "undefined") return null;
  const defaultIssueRow = (): IssueItem[] => [
    {
      id: `${stablePrefix}-issue-0`,
      area: "",
      detail: "",
    },
  ];
  const defaultFeatureRow = (): IssueItem[] => [
    {
      id: `${stablePrefix}-feature-0`,
      area: "",
      detail: "",
    },
  ];
  try {
    const raw = window.localStorage.getItem(CONTACT_DRAFT_STORAGE_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw) as Record<string, unknown>;
    if (!o.contactType || !isContactTypeId(String(o.contactType))) return null;

    const base = {
      contactType: o.contactType as ContactTypeId,
      senderName: typeof o.senderName === "string" ? o.senderName : "",
      replyEmail: typeof o.replyEmail === "string" ? o.replyEmail : "",
      subjectField: typeof o.subjectField === "string" ? o.subjectField : "",
      messageBody: typeof o.messageBody === "string" ? o.messageBody : "",
    };

    if (o.v === 2 || o.v === 3) {
      const issueItems = parseIssueItems(o.issueItems) ?? defaultIssueRow();
      const featureItems = parseIssueItems(o.featureItems) ?? defaultFeatureRow();
      return {
        v: 3,
        ...base,
        issueItems,
        featureItems,
      };
    }
    if (o.v === 1) {
      const issueItems = defaultIssueRow();
      const featureItems = defaultFeatureRow();
      if (base.contactType === "issue" && base.messageBody.trim()) {
        issueItems[0] = { ...issueItems[0], detail: base.messageBody.trim().slice(0, 8000) };
      }
      if (base.contactType === "feature" && base.messageBody.trim()) {
        featureItems[0] = { ...featureItems[0], detail: base.messageBody.trim().slice(0, 8000) };
      }
      return {
        v: 3,
        ...base,
        issueItems,
        featureItems,
      };
    }
    return null;
  } catch {
    return null;
  }
}

function writeContactDraft(d: Omit<ContactDraftStored, "v">) {
  if (typeof window === "undefined") return;
  try {
    const payload: ContactDraftStored = { v: 3, ...d };
    window.localStorage.setItem(CONTACT_DRAFT_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* quota / private mode */
  }
}

/** 彈窗內複製按鈕完整文案 */
const COPY_DRAFT_FULL_LABEL = "複製信件草稿　可直貼到信件使用";

function detailRefKey(mode: SegmentMode, rowId: string) {
  return `${mode}:${rowId}`;
}

function areaRefKey(mode: SegmentMode, rowId: string) {
  return `${mode}:${rowId}`;
}

/** 剪貼簿較常接受 PNG；JPEG blob 寫入失敗時改用此方式 */
async function dataUrlToPngBlob(dataUrl: string): Promise<Blob> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("圖片載入失敗"));
    el.src = dataUrl;
  });
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("無法建立畫布");
  ctx.drawImage(img, 0, 0);
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((b) => resolve(b), "image/png");
  });
  if (!blob) throw new Error("無法轉成 PNG");
  return blob;
}

export function ContactUsPanel() {
  /** 與 SSR 一致的穩定 id 前綴，避免 label htmlFor / input id hydration 不一致 */
  const rowIdRoot = useId().replace(/:/g, "_");
  /** 供「還原草稿」effect 使用：effect 內只讀 ref，避免 React Compiler 自動把 rowIdRoot 加入 deps 而與 [] 衝突 */
  const rowIdRootRef = useRef(rowIdRoot);
  rowIdRootRef.current = rowIdRoot;
  const nextIssueSeq = useRef(1);
  const nextFeatureSeq = useRef(1);

  const [pageUrl, setPageUrl] = useState("");
  const [contactType, setContactType] = useState<ContactTypeId>("issue");
  const [senderName, setSenderName] = useState("");
  const [replyEmail, setReplyEmail] = useState("");
  const [subjectField, setSubjectField] = useState<string>(() => typeLabel("issue"));
  const [messageBody, setMessageBody] = useState("");
  const [issueItems, setIssueItems] = useState<IssueItem[]>(() => [
    {
      id: `${rowIdRoot}-issue-0`,
      area: "",
      detail: "",
    },
  ]);
  const [featureItems, setFeatureItems] = useState<IssueItem[]>(() => [
    {
      id: `${rowIdRoot}-feature-0`,
      area: "",
      detail: "",
    },
  ]);
  const [draftHydrated, setDraftHydrated] = useState(false);

  const [emailError, setEmailError] = useState(false);
  const [subjectError, setSubjectError] = useState(false);
  const [messageError, setMessageError] = useState(false);

  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [draftCopied, setDraftCopied] = useState(false);
  const [mainDraftCopied, setMainDraftCopied] = useState(false);
  const [issuePickerOpen, setIssuePickerOpen] = useState(false);
  const [screenshotLightboxUrl, setScreenshotLightboxUrl] = useState<string | null>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const pickerTargetRef = useRef<{ mode: SegmentMode; rowId: string } | null>(null);
  const segmentAreaRefs = useRef<Map<string, HTMLInputElement>>(new Map());
  const segmentDetailRefs = useRef<Map<string, HTMLTextAreaElement>>(new Map());
  /** 每筆「常用範本」下拉目前選值（選完即清空，方便重選同一項） */
  const [detailPresetSelect, setDetailPresetSelect] = useState<Record<string, string>>({});

  const closeIssuePicker = useCallback(() => setIssuePickerOpen(false), []);

  useEffect(() => {
    if (!screenshotLightboxUrl) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setScreenshotLightboxUrl(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [screenshotLightboxUrl]);

  const openPickerForRow = useCallback((mode: SegmentMode, rowId: string) => {
    pickerTargetRef.current = { mode, rowId };
    setIssuePickerOpen(true);
  }, []);

  const updateSegmentRow = useCallback(
    (
      mode: SegmentMode,
      rowId: string,
      patch: Partial<Pick<IssueItem, "area" | "detail" | "screenshotDataUrl">>,
    ) => {
      const setter = mode === "issue" ? setIssueItems : setFeatureItems;
      setter((prev) =>
        prev.map((row) => {
          if (row.id !== rowId) return row;
          let detail = row.detail;
          if (typeof patch.area === "string" && patch.detail === undefined) {
            detail = replacePendingAreaInDetail(detail, mode, patch.area);
          }
          return { ...row, ...patch, detail: patch.detail !== undefined ? patch.detail : detail };
        }),
      );
      setMessageError(false);
    },
    [],
  );

  const applyDetailPreset = useCallback((mode: SegmentMode, rowId: string, text: string) => {
    const t = text.trimEnd();
    if (!t) return;
    const setter = mode === "issue" ? setIssueItems : setFeatureItems;
    setter((prev) =>
      prev.map((row) => {
        if (row.id !== rowId) return row;
        const cur = row.detail.trim();
        const areaT = row.area.trim();
        const block = buildPresetBlock(mode, areaT, t);
        /** 已有內容時只接範本本文，避免重複多行【回報區域】 */
        const merged = cur ? `${cur}\n\n${t}` : block;
        return { ...row, detail: merged.slice(0, DETAIL_FIELD_MAX_LEN) };
      }),
    );
    setMessageError(false);
    window.requestAnimationFrame(() => {
      const ta = segmentDetailRefs.current.get(detailRefKey(mode, rowId));
      if (!ta) return;
      ta.focus();
      const len = ta.value.length;
      ta.setSelectionRange(len, len);
    });
  }, []);

  const removeSegmentRow = useCallback((mode: SegmentMode, rowId: string) => {
    const setter = mode === "issue" ? setIssueItems : setFeatureItems;
    setter((prev) => (prev.length <= 1 ? prev : prev.filter((row) => row.id !== rowId)));
    segmentDetailRefs.current.delete(detailRefKey(mode, rowId));
    setMessageError(false);
  }, []);

  const addSegmentRow = useCallback(
    (mode: SegmentMode) => {
      const setter = mode === "issue" ? setIssueItems : setFeatureItems;
      const seqRef = mode === "issue" ? nextIssueSeq : nextFeatureSeq;
      const kind = mode === "issue" ? "issue" : "feature";
      setter((p) => [...p, { id: `${rowIdRoot}-${kind}-${seqRef.current++}`, area: "", detail: "" }]);
      setMessageError(false);
    },
    [rowIdRoot],
  );

  const showScreenshotToast = useCallback((msg: string, ms = 4500) => {
    setToastMessage(msg);
    window.setTimeout(() => setToastMessage(null), ms);
  }, []);

  const copyScreenshot = useCallback(
    async (dataUrl: string) => {
      if (!navigator.clipboard?.write) {
        showScreenshotToast("無法使用剪貼簿（請用 HTTPS 開啟本站，或改用「下載」）。", 5500);
        return;
      }
      if (typeof ClipboardItem === "undefined") {
        showScreenshotToast("此瀏覽器不支援複製圖片，請改用「下載」。", 5500);
        return;
      }
      try {
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        const mime =
          blob.type && blob.type.startsWith("image/") ? blob.type : "image/jpeg";
        try {
          await navigator.clipboard.write([new ClipboardItem({ [mime]: blob })]);
        } catch {
          const png = await dataUrlToPngBlob(dataUrl);
          await navigator.clipboard.write([new ClipboardItem({ "image/png": png })]);
        }
        showScreenshotToast("圖片已複製。請到信箱撰寫視窗按 Ctrl+V（或右鍵貼上）。");
      } catch {
        showScreenshotToast("複製失敗，請改用「下載」後以附加檔案寄出。", 5500);
      }
    },
    [showScreenshotToast],
  );

  const downloadScreenshot = useCallback(
    (dataUrl: string, baseName: string) => {
      const safe = baseName.replace(/[\\/:*?"<>|]+/g, "_").slice(0, 48) || "截圖";
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `${safe}.jpg`;
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
      showScreenshotToast("已觸發下載，請到瀏覽器的下載資料夾查看。");
    },
    [showScreenshotToast],
  );

  const handleRegionPick = useCallback((r: IssuePickResult) => {
    const t = pickerTargetRef.current;
    if (!t) return;
    const { mode, rowId } = t;
    const setter = mode === "issue" ? setIssueItems : setFeatureItems;
    setter((prev) =>
      prev.map((row) => {
        if (row.id !== rowId) return row;
        const detail = replacePendingAreaInDetail(row.detail, mode, r.shortLabel);
        return {
          ...row,
          area: r.shortLabel,
          detail,
          screenshotDataUrl: r.screenshotDataUrl ?? undefined,
        };
      }),
    );
    setMessageError(false);
    if (r.screenshotDataUrl) {
      setToastMessage(
        mode === "issue"
          ? "已填入回報區域並產生截圖。可「複製圖片」貼到郵件，或「下載」後附檔。"
          : "已填入相關區域並產生截圖。可「複製圖片」貼到郵件，或「下載」後附檔。",
      );
    } else {
      setToastMessage(
        mode === "issue"
          ? "已填入「回報區域」。（截圖未產生時請用手動截圖）請在下方「問題說明」補充狀況。"
          : "已填入「相關區域」。（截圖未產生時請用手動截圖）請在下方「建議說明」補充內容。",
      );
    }
    window.setTimeout(() => setToastMessage(null), 5000);
    window.setTimeout(() => {
      const areaEl = segmentAreaRefs.current.get(areaRefKey(mode, rowId));
      if (areaEl) {
        try {
          areaEl.scrollIntoView({ block: "center", inline: "nearest" });
        } catch {}
        areaEl.focus();
        try {
          areaEl.setSelectionRange(areaEl.value.length, areaEl.value.length);
        } catch {}
        return;
      }
      segmentDetailRefs.current.get(detailRefKey(mode, rowId))?.focus();
    }, 80);
  }, []);

  const applyEmailDomain = useCallback((domain: string) => {
    const clean = domain.replace(/^@/, "");
    setEmailError(false);
    let needsCursorAtStart = false;
    setReplyEmail((prev) => {
      const v = prev.trim();
      if (!v) {
        needsCursorAtStart = true;
        return `@${clean}`;
      }
      const at = v.indexOf("@");
      if (at === -1) {
        return `${v}@${clean}`;
      }
      const local = v.slice(0, at).trim();
      if (!local) {
        needsCursorAtStart = true;
        return `@${clean}`;
      }
      return `${local}@${clean}`;
    });
    if (needsCursorAtStart) {
      window.setTimeout(() => {
        const el = emailInputRef.current;
        if (!el) return;
        el.focus();
        el.setSelectionRange(0, 0);
      }, 0);
    }
  }, []);

  useEffect(() => {
    setPageUrl(typeof window !== "undefined" ? window.location.href : "");
  }, []);

  /** 從本機還原草稿（僅掛載一次）。effect 內勿直接引用 rowIdRoot，只讀 rowIdRootRef，避免 React Compiler 改寫依賴陣列 */
  useEffect(() => {
    const prefix = rowIdRootRef.current;
    const d = readContactDraft(prefix);
    if (d) {
      setContactType(d.contactType);
      setSenderName(d.senderName);
      setReplyEmail(d.replyEmail);
      setSubjectField(d.subjectField);
      setMessageBody(d.messageBody);
      setIssueItems(d.issueItems.length > 0 ? d.issueItems : [{ id: `${prefix}-issue-0`, area: "", detail: "" }]);
      setFeatureItems(
        d.featureItems?.length > 0 ? d.featureItems : [{ id: `${prefix}-feature-0`, area: "", detail: "" }],
      );
      nextIssueSeq.current = Math.max(nextIssueSeq.current, d.issueItems.length);
      nextFeatureSeq.current = Math.max(nextFeatureSeq.current, d.featureItems?.length ?? 0);
    }
    setDraftHydrated(true);
  }, []);

  useEffect(() => {
    if (!draftHydrated) return;
    const id = window.setTimeout(() => {
      writeContactDraft({
        contactType,
        senderName,
        replyEmail,
        subjectField,
        messageBody,
        issueItems: stripScreenshotsForStorage(issueItems),
        featureItems: stripScreenshotsForStorage(featureItems),
      });
    }, 350);
    return () => window.clearTimeout(id);
  }, [draftHydrated, contactType, senderName, replyEmail, subjectField, messageBody, issueItems, featureItems]);

  const buildEmailPayload = useCallback((): { subj: string; body: string } | null => {
    if (!CONTACT_EMAIL) return null;
    const catZh = typeLabel(contactType);
    /** 主旨僅用表單「主旨」欄，不重複帶入聯絡類型（類型已在內文） */
    const subj = (subjectField.trim() || "（無主旨）").slice(0, 180);
    const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
    const when = new Date().toISOString();
    const contentBlock =
      contactType === "issue"
        ? formatSegmentItemsForEmail(issueItems, "issue")
        : contactType === "feature"
          ? formatSegmentItemsForEmail(featureItems, "feature")
          : messageBody.trim();

    const contentSectionTitle =
      contactType === "issue"
        ? "問題回報（分段）"
        : contactType === "feature"
          ? "功能建議（分段）"
          : "詳細內容";

    const isSegmented = contactType === "issue" || contactType === "feature";
    const mainBody =
      isSegmented && contentBlock
        ? `${EMAIL_SCREENSHOT_INTRO}\n${contentBlock}`
        : contentBlock || "（未填）";

    const body = `【財富自由計算機 聯絡表單】

【聯絡資料】
類型：${catZh}
姓名：${senderName.trim() || "（未填）"}
信箱：${replyEmail.trim() || "（未填）"}

【主旨】
${subjectField.trim() || "（未填）"}

【${contentSectionTitle}】
${mainBody}

【系統紀錄】（供排查用）
來源網址：${pageUrl || "—"}
時間（UTC）：${when}
瀏覽器：${ua}
`;
    return { subj, body };
  }, [contactType, featureItems, issueItems, messageBody, pageUrl, replyEmail, senderName, subjectField]);

  const buildWebmailComposeUrl = useCallback(
    (provider: WebmailId): string | "too_long" | null => {
      const p = buildEmailPayload();
      if (!p) return null;
      let s: string;
      if (provider === "gmail") {
        const u = new URL("https://mail.google.com/mail/");
        u.searchParams.set("view", "cm");
        u.searchParams.set("fs", "1");
        u.searchParams.set("to", CONTACT_EMAIL);
        u.searchParams.set("su", p.subj);
        u.searchParams.set("body", p.body);
        s = u.toString();
      } else if (provider === "outlook") {
        const u = new URL("https://outlook.live.com/mail/0/deeplink/compose");
        u.searchParams.set("to", CONTACT_EMAIL);
        u.searchParams.set("subject", p.subj);
        u.searchParams.set("body", p.body);
        s = u.toString();
      } else {
        const u = new URL("https://compose.mail.yahoo.com/");
        u.searchParams.set("to", CONTACT_EMAIL);
        u.searchParams.set("subject", p.subj);
        u.searchParams.set("body", p.body);
        s = u.toString();
      }
      if (s.length > WEB_COMPOSE_MAX_LEN) return "too_long";
      return s;
    },
    [buildEmailPayload],
  );

  const validateAll = () => {
    let ok = true;
    setEmailError(false);
    setSubjectError(false);
    setMessageError(false);

    if (!isValidEmail(replyEmail)) {
      setEmailError(true);
      ok = false;
    }
    if (!subjectField.trim()) {
      setSubjectError(true);
      ok = false;
    }
    if (contactType === "issue") {
      const valid = issueItems.some((i) => i.area.trim().length > 0 && i.detail.trim().length >= 4);
      if (!valid) {
        setMessageError(true);
        ok = false;
      }
    } else if (contactType === "feature") {
      const valid = featureItems.some((i) => i.area.trim().length > 0 && i.detail.trim().length >= 4);
      if (!valid) {
        setMessageError(true);
        ok = false;
      }
    } else if (messageBody.trim().length < 4) {
      setMessageError(true);
      ok = false;
    }
    return ok;
  };

  const openWebCompose = useCallback(
    (provider: WebmailId) => {
      const url = buildWebmailComposeUrl(provider);
      if (url === "too_long") {
        window.alert("內容過長，無法用網址帶入信箱。請刪短內文後再試，或按「📋 複製信件內容」手動貼上。");
        return;
      }
      if (!url) return;
      window.dispatchEvent(new CustomEvent("calc-engagement"));
      /** 盡量用小視窗，主分頁仍留著表單（並已自動暫存）；若瀏覽器擋彈窗則改新分頁 */
      const features =
        "popup=yes,width=1040,height=820,scrollbars=yes,resizable=yes,noopener,noreferrer";
      const win = window.open(url, "cu_webmail_compose", features);
      if (!win || win.closed) {
        window.open(url, "_blank", "noopener,noreferrer");
      }
      setSendModalOpen(false);
      setToastMessage(
        "已開啟撰寫視窗，請在該視窗按「寄出」。若沒出現畫面，請用「📋 複製信件內容」或主頁「另存草稿」。",
      );
      window.setTimeout(() => setToastMessage(null), 6000);
    },
    [buildWebmailComposeUrl],
  );

  const copyDraftToClipboard = useCallback(async () => {
    const p = buildEmailPayload();
    if (!p) return;
    const text = `收件人：${CONTACT_EMAIL}\n主旨：${p.subj}\n\n${p.body}`;
    try {
      await navigator.clipboard.writeText(text);
      setDraftCopied(true);
      setToastMessage("✔ 已複製信件內容");
      window.setTimeout(() => setToastMessage(null), 2800);
      window.setTimeout(() => setDraftCopied(false), 2200);
    } catch {
      window.alert("無法複製，請檢查瀏覽器權限，或改用手動選取內文。");
    }
  }, [buildEmailPayload]);

  /** 主頁「另存草稿」：立刻寫入本機 + 複製全文，登入信箱後可直接貼上 */
  const saveDraftMain = useCallback(async () => {
    writeContactDraft({
      contactType,
      senderName,
      replyEmail,
      subjectField,
      messageBody,
      issueItems: stripScreenshotsForStorage(issueItems),
      featureItems: stripScreenshotsForStorage(featureItems),
    });
    const p = buildEmailPayload();
    if (!p) return;
    const text = `收件人：${CONTACT_EMAIL}\n主旨：${p.subj}\n\n${p.body}`;
    try {
      await navigator.clipboard.writeText(text);
      setMainDraftCopied(true);
      window.setTimeout(() => setMainDraftCopied(false), 2200);
      setToastMessage("已複製信件草稿，可直貼到信箱；表單也已暫存於此瀏覽器。");
      window.setTimeout(() => setToastMessage(null), 5000);
    } catch {
      window.alert("無法複製到剪貼簿，請檢查瀏覽器權限。表單內容仍已嘗試暫存於本機。");
    }
  }, [buildEmailPayload, contactType, featureItems, issueItems, messageBody, replyEmail, senderName, subjectField]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!CONTACT_EMAIL) return;
    if (!validateAll()) return;

    setLoading(true);
    await new Promise((r) => setTimeout(r, 500));

    const probe = buildWebmailComposeUrl("gmail");
    setLoading(false);

    if (probe === "too_long") {
      window.alert("內容過長，請刪短「詳細內容」後再試。");
      return;
    }
    if (!probe) return;

    setDraftCopied(false);
    setSendModalOpen(true);
  };

  useEffect(() => {
    if (!sendModalOpen) return;
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") setSendModalOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sendModalOpen]);

  useEffect(() => {
    if (sendModalOpen) setIssuePickerOpen(false);
  }, [sendModalOpen]);

  useEffect(() => {
    if (contactType !== "issue" && contactType !== "feature") setIssuePickerOpen(false);
  }, [contactType]);

  if (!CONTACT_EMAIL) {
    return (
      <div className={styles.shell}>
        <p className={styles.envHint}>
          請建立 <code>.env.local</code> 並設定 <code>NEXT_PUBLIC_CONTACT_EMAIL</code>
        </p>
      </div>
    );
  }

  const mailExplainer = (
    <p className={styles.mailExplainer}>
      本站<strong>無法代你按「寄出」</strong>：須在你的 Gmail／Outlook／Yahoo 裡完成最後一步。建議流程：可先按「另存草稿」複製全文備用 → 再按「送出訊息」開撰寫視窗。表單會<strong>自動暫存</strong>在本瀏覽器，登入信箱後若內文不見，貼上剪貼簿即可。
    </p>
  );

  return (
    <>
      <div className={styles.shell} data-contact-panel-shell>
        <header className={styles.header}>
          <div className={styles.headerDesktop}>
            <h2 className={styles.title}>
              聯絡我們
              <span className={styles.titleEn}>Contact</span>
            </h2>
            <p className={styles.subtitle}>有問題／建議／合作？我們會回覆你。</p>
            {mailExplainer}
          </div>

          <div className={styles.headerMobile}>
            <h2 className={styles.mobileHeaderTitle}>聯絡我們 / 回報問題</h2>
            <p className={styles.mobileHeaderIntro}>有問題／建議／合作？我們會回覆你。</p>
          </div>
        </header>

        <HomeFooterMobileExpand expandLabel="展開聯絡表單 ▼" collapseLabel="收合聯絡表單 ▲">
        <div className={styles.panelBody}>
          <div className={styles.mailExplainerMobileWrap}>{mailExplainer}</div>

          <form onSubmit={(e) => void handleSubmit(e)} noValidate>
          <div className={styles.section}>
            <span className={styles.stepLabel}>Step 1 · 聯絡類型</span>
            <div className={styles.radioGroup} role="radiogroup" aria-label="聯絡類型">
              {CONTACT_TYPES.map((t) => (
                <label
                  key={t.id}
                  className={`${styles.radioCard} ${contactType === t.id ? styles.radioCardActive : ""}`}
                >
                  <input
                    type="radio"
                    name="contactType"
                    value={t.id}
                    checked={contactType === t.id}
                    onChange={() => {
                      setContactType(t.id);
                      setSubjectField(typeLabel(t.id));
                    }}
                    className={styles.radioInput}
                  />
                  <span>{t.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className={styles.section}>
            <span className={styles.stepLabel}>Step 2 · 表單</span>
            <div className={styles.formGrid}>
              <div>
                <label className={styles.fieldLabel} htmlFor="cu-name">
                  姓名
                </label>
                <input
                  id="cu-name"
                  className={styles.input}
                  type="text"
                  autoComplete="name"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="您的稱呼"
                />
              </div>
              <div className={styles.emailField}>
                <div className={styles.emailLabelRow}>
                  <label className={`${styles.fieldLabel} ${styles.emailFieldLabel}`} htmlFor="cu-email">
                    Email<span className={styles.required}>*</span>
                  </label>
                  <div className={styles.emailDomainChips} role="group" aria-label="常見信箱網域">
                    {EMAIL_DOMAIN_SUFFIXES.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        className={styles.emailDomainChip}
                        title={s.title}
                        onClick={() => applyEmailDomain(s.domain)}
                      >
                        {s.display}
                      </button>
                    ))}
                  </div>
                </div>
                <input
                  ref={emailInputRef}
                  id="cu-email"
                  className={`${styles.input} ${emailError ? styles.inputError : ""}`}
                  type="email"
                  autoComplete="email"
                  value={replyEmail}
                  onChange={(e) => {
                    setReplyEmail(e.target.value);
                    setEmailError(false);
                  }}
                  placeholder="name@email.com"
                />
                {emailError && <p className={styles.fieldError}>請填寫有效的 Email 格式。</p>}
              </div>
              <div>
                <label className={styles.fieldLabel} htmlFor="cu-subject">
                  主旨<span className={styles.required}>*</span>
                </label>
                <input
                  id="cu-subject"
                  className={`${styles.input} ${subjectError ? styles.inputError : ""}`}
                  type="text"
                  value={subjectField}
                  onChange={(e) => {
                    setSubjectField(e.target.value);
                    setSubjectError(false);
                  }}
                  placeholder="依類型自動帶入，可自行修改"
                />
                {subjectError && <p className={styles.fieldError}>請填寫主旨。</p>}
              </div>
              <div>
                {contactType === "issue" || contactType === "feature" ? (
                  <>
                    {contactType === "issue" ? (
                      <>
                        <span className={styles.fieldLabel}>
                          問題回報<span className={styles.required}>*</span>
                        </span>
                        <p className={styles.issueIntro}>
                          每一筆：<strong>回報區域</strong>（「在頁面選取」會帶入名稱並<strong>嘗試截圖</strong>）與
                          <strong>問題說明</strong>。完成一筆後可再新增。
                          <span className={styles.screenshotNoteInline}> 附圖請複製貼入郵件；無圖亦可。</span>
                        </p>
                      </>
                    ) : (
                      <>
                        <span className={styles.fieldLabel}>
                          功能建議<span className={styles.required}>*</span>
                        </span>
                        <p className={styles.issueIntro}>
                          每一筆：<strong>相關區域</strong>（「在頁面選取」會帶入名稱並<strong>嘗試截圖</strong>）與
                          <strong>建議說明</strong>。完成一筆後可再新增。
                          <span className={styles.screenshotNoteInline}> 附圖請複製貼入郵件；無圖亦可。</span>
                        </p>
                      </>
                    )}
                    {(() => {
                      const segMode: SegmentMode = contactType === "issue" ? "issue" : "feature";
                      const items = segMode === "issue" ? issueItems : featureItems;
                      return (
                        <>
                          <div className={styles.issueList}>
                            {items.map((row, idx) => (
                              <div key={row.id} className={styles.issueCard}>
                                <div className={styles.issueCardHead}>
                                  <span className={styles.issueCardTitle}>
                                    {segMode === "issue" ? `問題 ${idx + 1}` : `建議 ${idx + 1}`}
                                  </span>
                                  {items.length > 1 && (
                                    <button
                                      type="button"
                                      className={styles.issueRemove}
                                      onClick={() => removeSegmentRow(segMode, row.id)}
                                    >
                                      移除此筆
                                    </button>
                                  )}
                                </div>
                                <label className={styles.fieldLabel} htmlFor={`cu-seg-area-${segMode}-${row.id}`}>
                                  {segMode === "issue" ? "回報區域" : "相關區域"}
                                </label>
                                <div className={styles.issueAreaRow}>
                                  <input
                                    id={`cu-seg-area-${segMode}-${row.id}`}
                                    ref={(el) => {
                                      const k = areaRefKey(segMode, row.id);
                                      if (el) segmentAreaRefs.current.set(k, el);
                                      else segmentAreaRefs.current.delete(k);
                                    }}
                                    className={`${styles.input} ${styles.issueAreaInput}`}
                                    value={row.area}
                                    onChange={(e) => updateSegmentRow(segMode, row.id, { area: e.target.value })}
                                    placeholder={
                                      segMode === "issue"
                                        ? "例：ETF 試算、頁尾統計…"
                                        : "例：試算結果區、匯出功能…"
                                    }
                                  />
                                  <button
                                    type="button"
                                    className={styles.btnPickMini}
                                    onClick={() => openPickerForRow(segMode, row.id)}
                                  >
                                    在頁面選取
                                  </button>
                                </div>
                                {row.screenshotDataUrl ? (
                                  <div className={styles.screenshotBlock}>
                                    <span className={styles.fieldLabel}>畫面截圖（選取後自動產生）</span>
                                    <div className={styles.screenshotRow}>
                                      <div className={styles.screenshotThumbWrap}>
                                        <button
                                          type="button"
                                          className={styles.screenshotThumbBtn}
                                          onClick={() => setScreenshotLightboxUrl(row.screenshotDataUrl!)}
                                          aria-label="放大預覽截圖"
                                          title="點擊放大"
                                        >
                                          {/* eslint-disable-next-line @next/next/no-img-element -- data URL 預覽 */}
                                          <img
                                            src={row.screenshotDataUrl}
                                            alt="選取區塊截圖預覽"
                                            className={styles.screenshotThumb}
                                          />
                                        </button>
                                      </div>
                                      <div className={styles.screenshotActions}>
                                        <button
                                          type="button"
                                          className={styles.screenshotBtn}
                                          onClick={() => void copyScreenshot(row.screenshotDataUrl!)}
                                        >
                                          複製圖片
                                        </button>
                                        <button
                                          type="button"
                                          className={styles.screenshotBtn}
                                          onClick={() =>
                                            downloadScreenshot(
                                              row.screenshotDataUrl!,
                                              row.area || `${segMode === "issue" ? "問題" : "建議"}-${idx + 1}`,
                                            )
                                          }
                                        >
                                          下載
                                        </button>
                                        <button
                                          type="button"
                                          className={styles.screenshotBtnMuted}
                                          onClick={() =>
                                            updateSegmentRow(segMode, row.id, { screenshotDataUrl: undefined })
                                          }
                                        >
                                          移除截圖
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                ) : null}
                                <div className={styles.detailLabelRow}>
                                  <label
                                    className={`${styles.fieldLabel} ${styles.detailFieldLabel}`}
                                    htmlFor={`cu-seg-detail-${segMode}-${row.id}`}
                                  >
                                    {segMode === "issue" ? "問題說明" : "建議說明"}
                                  </label>
                                  <select
                                    className={styles.detailPresetSelect}
                                    aria-label={segMode === "issue" ? "插入問題說明範本" : "插入建議說明範本"}
                                    value={detailPresetSelect[row.id] ?? ""}
                                    onChange={(e) => {
                                      const id = e.target.value;
                                      const list =
                                        segMode === "issue" ? ISSUE_DETAIL_PRESETS : FEATURE_DETAIL_PRESETS;
                                      const found = list.find((p) => p.id === id);
                                      if (found) applyDetailPreset(segMode, row.id, found.text);
                                      setDetailPresetSelect((s) => ({ ...s, [row.id]: "" }));
                                    }}
                                  >
                                    <option value="">常用範本…</option>
                                    {(segMode === "issue" ? ISSUE_DETAIL_PRESETS : FEATURE_DETAIL_PRESETS).map(
                                      (p) => (
                                        <option key={p.id} value={p.id}>
                                          {p.label}
                                        </option>
                                      ),
                                    )}
                                  </select>
                                </div>
                                <p className={styles.detailPresetHint}>
                                  範本開頭會帶入目前「{segMode === "issue" ? "回報區域" : "相關區域"}」；未填時為「待選」，選區或改區域名後會自動換成簡稱。說明欄已有內容時只接範本本文（不重複區域名）。
                                </p>
                                <textarea
                                  id={`cu-seg-detail-${segMode}-${row.id}`}
                                  ref={(el) => {
                                    const k = detailRefKey(segMode, row.id);
                                    if (el) segmentDetailRefs.current.set(k, el);
                                    else segmentDetailRefs.current.delete(k);
                                  }}
                                  className={`${styles.textarea} ${styles.issueDetailTextarea} ${messageError ? styles.textareaError : ""}`}
                                  value={row.detail}
                                  onChange={(e) => updateSegmentRow(segMode, row.id, { detail: e.target.value })}
                                  placeholder={
                                    segMode === "issue"
                                      ? "這裡出了什麼問題？如何重現？"
                                      : "希望增加或改善什麼？為什麼有幫助？"
                                  }
                                  rows={3}
                                />
                              </div>
                            ))}
                          </div>
                          <button
                            type="button"
                            className={styles.btnAddIssue}
                            onClick={() => addSegmentRow(segMode)}
                          >
                            {segMode === "issue" ? "＋ 新增一筆問題" : "＋ 新增一筆建議"}
                          </button>
                          {messageError && (
                            <p className={styles.fieldError}>
                              {segMode === "issue"
                                ? "請至少完成一筆：須填「回報區域」且「問題說明」至少 4 個字（可多筆）。"
                                : "請至少完成一筆：須填「相關區域」且「建議說明」至少 4 個字（可多筆）。"}
                            </p>
                          )}
                        </>
                      );
                    })()}
                  </>
                ) : (
                  <>
                    <label className={styles.fieldLabel} htmlFor="cu-message">
                      詳細內容<span className={styles.required}>*</span>
                    </label>
                    <textarea
                      id="cu-message"
                      className={`${styles.textarea} ${messageError ? styles.textareaError : ""}`}
                      value={messageBody}
                      onChange={(e) => {
                        setMessageBody(e.target.value);
                        setMessageError(false);
                      }}
                      placeholder="請描述狀況、重現步驟或合作需求…"
                      rows={5}
                    />
                    {messageError && (
                      <p className={styles.fieldError}>請至少輸入數個字，方便我們協助您。</p>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          <div className={styles.ctaBlock}>
            <button type="submit" className={styles.btnPrimary} disabled={loading} aria-busy={loading}>
              {loading ? (
                <>
                  <span className={styles.spinner} aria-hidden />
                  處理中…
                </>
              ) : (
                <>🚀 送出訊息</>
              )}
            </button>
            <button
              type="button"
              className={styles.btnDraft}
              onClick={() => void saveDraftMain()}
              title="複製收件人、主旨與內文到剪貼簿，並立即暫存表單"
            >
              {mainDraftCopied ? "✓ 已複製並暫存" : "另存草稿（複製全文 · 暫存瀏覽器）"}
            </button>
          </div>
        </form>
        </div>
        </HomeFooterMobileExpand>
      </div>

      {sendModalOpen && (
        <div className={styles.sendModalBackdrop} role="presentation" onClick={() => setSendModalOpen(false)}>
          <div
            className={styles.sendModalCard}
            role="dialog"
            aria-modal="true"
            aria-labelledby="cu-send-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.sendModalHeader}>
              <div>
                <h3 id="cu-send-modal-title" className={styles.sendModalTitle}>
                  選擇寄送方式
                </h3>
                <p className={styles.sendModalSubtitle}>最快方式：直接用 Gmail 寄出</p>
              </div>
              <button
                type="button"
                className={styles.sendModalCloseX}
                onClick={() => setSendModalOpen(false)}
                aria-label="關閉"
              >
                ×
              </button>
            </div>

            <button type="button" className={styles.sendModalPrimary} onClick={() => openWebCompose("gmail")}>
              🚀 用 Gmail 寄送（推薦）
            </button>

            <div className={styles.sendModalSecondarySection}>
              <p className={styles.sendModalSecondaryHeading}>其他信箱</p>
              <div className={styles.sendModalOutlineRow} role="group" aria-label="其他網頁信箱">
                <button type="button" className={styles.sendModalOutlineBtn} onClick={() => openWebCompose("outlook")}>
                  Outlook
                </button>
                <button type="button" className={styles.sendModalOutlineBtn} onClick={() => openWebCompose("yahoo")}>
                  Yahoo
                </button>
              </div>
            </div>

            <button
              type="button"
              className={`${styles.sendModalFallback} ${draftCopied ? styles.sendModalFallbackSuccess : ""}`}
              onClick={() => void copyDraftToClipboard()}
            >
              {draftCopied ? "✔ 已複製" : "📋 複製信件內容"}
            </button>

            <details className={styles.sendModalDetails}>
              <summary className={styles.sendModalSummary}>ℹ️ 為什麼需要登入？</summary>
              <div className={styles.sendModalDetailsBody}>
                <p>
                  本站<strong>不會代寄</strong>：點 Gmail／Outlook／Yahoo 會開<strong>撰寫視窗</strong>並帶入收件人、主旨與內文（等同你手動填好的草稿），須在你自己的信箱按「寄出」。
                </p>
                <p>
                  按鈕會盡量開<strong>小視窗</strong>；若被擋彈窗會改開<strong>新分頁</strong>。內文很長時採用 Gmail 網頁版網址帶入，比 <code className={styles.sendModalCode}>mailto:</code>{" "}
                  穩定（<code className={styles.sendModalCode}>mailto</code> 容易超過長度上限）。
                </p>
                <p>
                  <strong>若須先登入</strong>，登入後有時網址帶入的內文會消失：可先按「📋 複製信件內容」，登入後在撰寫區<strong>貼上</strong>再寄出。主頁「另存草稿」也會暫存表單並複製全文。
                </p>
                <p>
                  <strong>若完全沒開啟視窗</strong>：可能被瀏覽器擋下，請用「📋 複製信件內容」或主頁「另存草稿」後手動貼上。
                </p>
              </div>
            </details>
          </div>
        </div>
      )}

      <IssueRegionPicker open={issuePickerOpen} onCapture={handleRegionPick} onClose={closeIssuePicker} />

      {screenshotLightboxUrl ? (
        <div
          className={styles.screenshotLightboxBackdrop}
          role="dialog"
          aria-modal="true"
          aria-label="截圖放大預覽"
          onClick={() => setScreenshotLightboxUrl(null)}
        >
          <div className={styles.screenshotLightboxInner} onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className={styles.screenshotLightboxClose}
              onClick={() => setScreenshotLightboxUrl(null)}
            >
              關閉
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element -- data URL 放大預覽 */}
            <img
              src={screenshotLightboxUrl}
              alt="截圖放大預覽"
              className={styles.screenshotLightboxImg}
            />
          </div>
        </div>
      ) : null}

      {toastMessage && (
        <div className={styles.toast} role="status">
          ✔ {toastMessage}
        </div>
      )}
    </>
  );
}
