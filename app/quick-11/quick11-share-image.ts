"use client";

import { isMobileShareContext, QUICK11_SHARE_TITLE } from "./quick11-share-platform";

/** opened=分享 sheet 已開；cancelled=使用者關閉；unsupported=不支援 */
export type Quick11ShareSnapshotResult = "opened" | "cancelled" | "unsupported";

export { QUICK11_SHARE_TITLE };

export type Quick11ClipboardCopyResult = "copied" | "unsupported" | "failed";

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

/** 截圖完成後寫入剪貼簿（Chrome／Edge 桌面較穩；Android Chrome 多可；iOS Safari 常不支援） */
export async function copyQuick11ScreenshotToClipboard(dataUrl: string): Promise<Quick11ClipboardCopyResult> {
  if (typeof navigator === "undefined" || !navigator.clipboard?.write) {
    return "unsupported";
  }
  if (typeof ClipboardItem === "undefined") {
    return "unsupported";
  }
  try {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const mime = blob.type && blob.type.startsWith("image/") ? blob.type : "image/jpeg";
    try {
      await navigator.clipboard.write([new ClipboardItem({ [mime]: blob })]);
    } catch {
      const png = await dataUrlToPngBlob(dataUrl);
      await navigator.clipboard.write([new ClipboardItem({ "image/png": png })]);
    }
    return "copied";
  } catch {
    return "failed";
  }
}

export type Quick11ScreenshotSaveResult = "saved" | "failed";

/** 觸發瀏覽器下載／存檔（Android 較穩；iOS 可能存到「檔案」或僅預覽） */
export async function saveQuick11ScreenshotToDevice(
  dataUrl: string,
  filename = "破產計算機試算.jpg",
): Promise<Quick11ScreenshotSaveResult> {
  try {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = filename;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 2000);
    return "saved";
  } catch {
    try {
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = filename;
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
      return "saved";
    } catch {
      return "failed";
    }
  }
}

export type Quick11PostCaptureResult = {
  clipboard: Quick11ClipboardCopyResult;
  saved: Quick11ScreenshotSaveResult | "skipped";
};

/** 截圖完成後：手機試複製＋存檔；電腦只複製剪貼簿 */
export async function applyQuick11ScreenshotAfterCapture(dataUrl: string): Promise<Quick11PostCaptureResult> {
  const mobile = isMobileShareContext();
  const [clipboard, saved] = await Promise.all([
    copyQuick11ScreenshotToClipboard(dataUrl),
    mobile ? saveQuick11ScreenshotToDevice(dataUrl) : Promise.resolve("skipped" as const),
  ]);
  return { clipboard, saved };
}

export function getQuick11ScreenshotPostCaptureHint(result: Quick11PostCaptureResult): string {
  const mobile = isMobileShareContext();
  if (!mobile) {
    if (result.clipboard === "copied") return "📋 截圖已複製，可到 LINE／FB 直接貼上";
    if (result.clipboard === "unsupported") return "此裝置無法自動複製圖片，請用第二步分享";
    return "複製失敗，請改用第二步分享";
  }

  const copied = result.clipboard === "copied";
  const saved = result.saved === "saved";
  if (copied && saved) return "📋 已複製＋已存入手機，可貼上或到相簿／下載查看";
  if (copied) return "📋 已複製；若沒自動存檔，請用第二步分享";
  if (saved) return "📁 已存入手機；貼上若不支援，請用第二步分享";
  return "無法自動複製／存檔，請用第二步「分享試算截圖」";
}

function isAbortError(err: unknown): boolean {
  return err instanceof Error && err.name === "AbortError";
}

/** 同步把 data URL 轉成 File，供 click 手勢內直接 navigator.share({ files }) */
export function dataUrlToShareFile(dataUrl: string): File | null {
  try {
    const comma = dataUrl.indexOf(",");
    if (comma < 0) return null;
    const header = dataUrl.slice(0, comma);
    const b64 = dataUrl.slice(comma + 1);
    const mime = /data:(.*?);/i.exec(header)?.[1] ?? "image/jpeg";
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return new File([bytes], "quick11-screenshot.jpg", { type: mime });
  } catch {
    return null;
  }
}

/**
 * 手機原生分享 sheet（截圖 + title）。
 * 須在使用者 click 的同一個 call stack 內呼叫。
 */
export function openQuick11SystemSharePage(file?: File | null): Promise<Quick11ShareSnapshotResult> {
  if (typeof navigator.share !== "function") {
    return Promise.resolve("unsupported");
  }

  const payload: ShareData = file
    ? { files: [file], title: QUICK11_SHARE_TITLE }
    : { title: QUICK11_SHARE_TITLE, url: typeof window !== "undefined" ? window.location.href : "" };

  return navigator
    .share(payload)
    .then(() => "opened" as const)
    .catch((err) => (isAbortError(err) ? ("cancelled" as const) : ("unsupported" as const)));
}

export const saveQuick11SnapshotAndOpenSharePage = openQuick11SystemSharePage;
export const shareQuick11SnapshotFromDataUrl = openQuick11SystemSharePage;
