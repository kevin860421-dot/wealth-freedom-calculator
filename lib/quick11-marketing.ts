/** 破產計算機（quick-11）導流／Excel 索取共用常數 */

import { absoluteUrl } from "./site-origin";

export const QUICK11_EXCEL_UNLOCK_CODE = "自由666";

/** 對外顯示名稱（頁底、四步驟彈窗一致） */
export const QUICK11_EXCEL_DISPLAY_NAME = "本息＋DTI 試算 Excel（公式可改）";

/** 站內下載（須先分享解鎖 cookie） */
export const QUICK11_EXCEL_DOWNLOAD_PATH = "/api/quick-11/excel";

/**
 * Meta 私訊／自動回覆「按鈕網址」用：公開直連，按下去即下載 .xlsx。
 * 部署後貼完整網址，見 getQuick11ExcelPublicDownloadUrl()。
 */
export const QUICK11_EXCEL_PUBLIC_DOWNLOAD_PATH = "/api/quick-11/excel/public";

export function getQuick11ExcelPublicDownloadUrl(): string {
  return absoluteUrl(QUICK11_EXCEL_PUBLIC_DOWNLOAD_PATH);
}

/** 分享試算後寫入 cookie，API 下載會檢查 */
export const QUICK11_SHARE_UNLOCK_COOKIE = "quick11_excel_unlock";

/**
 * 粉專／Messenger 導流（第四步按鈕用 `<a href>` 直開，較不易被擋彈窗）。
 * 可覆寫：NEXT_PUBLIC_FB_PAGE_URL（例 m.me 私訊：https://m.me/wealth.freedom.calculator）
 */
const QUICK11_FB_PAGE_DEFAULT = "https://www.facebook.com/wealth.freedom.calculator";

export const QUICK11_FB_PAGE_URL =
  process.env.NEXT_PUBLIC_FB_PAGE_URL?.trim() || QUICK11_FB_PAGE_DEFAULT;

/** FB 自動回覆已設定的私訊關鍵字（與 Meta 後台一致） */
export const QUICK11_EXCEL_FB_KEYWORDS = ["自由666", "Excel", "666"] as const;

export function isQuick11FbMessengerConfigured(): boolean {
  const url = QUICK11_FB_PAGE_URL;
  return url.length > 0 && !url.includes("sharer/sharer.php");
}

/** 第四步用：facebook.com 粉專網址自動轉 m.me 私訊（較適合貼上解鎖碼） */
export function getQuick11FbMessengerUrl(pageUrl = QUICK11_FB_PAGE_URL): string {
  const trimmed = pageUrl.trim();
  if (!trimmed) return trimmed;
  if (/m\.me\//i.test(trimmed)) return trimmed;
  const fbUser = trimmed.match(/facebook\.com\/([^/?#]+)/i)?.[1];
  if (fbUser && fbUser !== "profile.php" && fbUser !== "pages") {
    return `https://m.me/${fbUser}`;
  }
  return trimmed;
}

/** GA 表現佳、可互導的部落格（財富試算筆記 8） */
export const QUICK11_SUCCESS_BLOG_PATH = "/blog/annual-vs-monthly-dividend-tax-rhythm";

export const QUICK11_SUCCESS_BLOG_TITLE = "年配改月配：現金流變密了，稅負節奏也會跟著變嗎";

/** 未發布 quick-11 專文（serial ≥ 66）起套用 SEO 微整形版文案 */
export const QUICK11_V2_COPY_FROM_SERIAL = 66;

/**
 * 離開彈窗：須停留滿這毫秒才會觸發（破產計算機建議 45s；純文章頁可改 30s）。
 * 同一 session 仍只出現一次（sessionStorage）。
 */
export const QUICK11_EXIT_INTENT_MIN_DWELL_MS = 45_000;

/** 純閒置或 Wizard 已分享後，再隔這毫秒顯示底部 quick-1 浮動卡 */
export const QUICK11_IDLE_NUDGE_AFTER_MS = 3 * 60 * 1000;

/** 高意圖（高 DTI、深度試算、Wizard 零／半進度）：較短等待 */
export const QUICK11_IDLE_NUDGE_ENGAGED_AFTER_MS = 90 * 1000;

/** 本機預覽離開彈窗（免等 45 秒、不寫入 session） */
export const QUICK11_EXIT_MODAL_PREVIEW_PATH = "/quick-11/exit-modal-preview";

/** 本機預覽 Excel 範本版面（非文字、表格視覺） */
export const QUICK11_EXCEL_PREVIEW_PATH = "/quick-11/excel-preview";

/** 模擬用：一鍵清除 quick-11 本機狀態（勿連結至正式 /quick-11 頁） */
export const QUICK11_SIM_RESET_PATH = "/quick-11/sim-reset";

/** Excel 索取彈窗：限時倒數視窗（毫秒） */
export const QUICK11_EXCEL_OFFER_WINDOW_MS = 24 * 60 * 60 * 1000;

/** localStorage：首次開啟彈窗起算 24 小時截止時間戳 */
export const QUICK11_EXCEL_COUNTDOWN_STORAGE_KEY = "quick11-excel-24h-deadline";

export function quick11SlugSerial(slug: string): number | null {
  const m = slug.match(/-s(\d{3})$/);
  return m ? Number(m[1]) : null;
}

export function shouldUseQuick11V2ArticleCopy(slug: string, publishAtIso: string): boolean {
  const serial = quick11SlugSerial(slug);
  if (serial != null && serial >= QUICK11_V2_COPY_FROM_SERIAL) return true;
  return Date.parse(publishAtIso) >= Date.parse("2026-06-05T20:38:42+08:00");
}
