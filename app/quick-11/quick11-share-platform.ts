"use client";

export const QUICK11_SHARE_TITLE = "破產計算機試算結果";

export type Quick11SharePlatform = "line" | "facebook" | "threads";

/** 手機／平板：走 Web Share API 原生 sheet */
export function isMobileShareContext(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android|iPad|iPhone|iPod/i.test(navigator.userAgent);
}

export function prefersNativeShareSheet(): boolean {
  return isMobileShareContext() && typeof navigator.share === "function";
}

export function getQuick11SharePageUrl(): string {
  if (typeof window !== "undefined" && window.location.href) {
    return window.location.href;
  }
  return "https://wealth-freedom-calculator.vercel.app/quick-11";
}

export function buildQuick11ShareText(url = getQuick11SharePageUrl()): string {
  return `我剛完成破產計算機試算，快來看看你的 DTI 與月付壓力 👇\n${url}`;
}

export function getQuick11PlatformShareUrl(platform: Quick11SharePlatform, url = getQuick11SharePageUrl()): string {
  const text = buildQuick11ShareText(url);
  switch (platform) {
    case "line":
      return `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
    case "facebook":
      return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    case "threads":
      return `https://www.threads.net/intent/post?text=${encodeURIComponent(text)}`;
  }
}

export async function copyQuick11ShareLink(url = getQuick11SharePageUrl()): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(buildQuick11ShareText(url));
    return true;
  } catch {
    return false;
  }
}

export function openQuick11PlatformShare(platform: Quick11SharePlatform): void {
  const url = getQuick11SharePageUrl();
  window.open(getQuick11PlatformShareUrl(platform, url), "_blank", "noopener,noreferrer");
  if (platform === "facebook") {
    void copyQuick11ShareLink(url);
  }
}
