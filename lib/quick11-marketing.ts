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
 * 粉專 Messenger 私訊網址（例：https://m.me/你的粉專用戶名）。
 * 未設定時按鈕仍會複製密碼，但不會誤開 FB「分享試算頁」對話框。
 */
export const QUICK11_FB_PAGE_URL = process.env.NEXT_PUBLIC_FB_PAGE_URL?.trim() || "";

/** FB 自動回覆已設定的私訊關鍵字（與 Meta 後台一致） */
export const QUICK11_EXCEL_FB_KEYWORDS = ["自由666", "Excel", "666"] as const;

export function isQuick11FbMessengerConfigured(): boolean {
  const url = QUICK11_FB_PAGE_URL;
  return url.length > 0 && !url.includes("sharer/sharer.php");
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

/** 本機預覽離開彈窗（免等 45 秒、不寫入 session） */
export const QUICK11_EXIT_MODAL_PREVIEW_PATH = "/quick-11/exit-modal-preview";

export function quick11SlugSerial(slug: string): number | null {
  const m = slug.match(/-s(\d{3})$/);
  return m ? Number(m[1]) : null;
}

export function shouldUseQuick11V2ArticleCopy(slug: string, publishAtIso: string): boolean {
  const serial = quick11SlugSerial(slug);
  if (serial != null && serial >= QUICK11_V2_COPY_FROM_SERIAL) return true;
  return Date.parse(publishAtIso) >= Date.parse("2026-06-05T20:38:42+08:00");
}
