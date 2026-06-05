"use client";

import { QUICK11_EXCEL_UNLOCK_CODE, QUICK11_FB_PAGE_URL, isQuick11FbMessengerConfigured } from "@/lib/quick11-marketing";

export async function copyQuick11UnlockCode(): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(QUICK11_EXCEL_UNLOCK_CODE);
    return true;
  } catch {
    window.prompt("請複製解鎖密碼：", QUICK11_EXCEL_UNLOCK_CODE);
    return false;
  }
}

export function openQuick11FbMessenger(): void {
  if (!isQuick11FbMessengerConfigured()) return;
  window.open(QUICK11_FB_PAGE_URL, "_blank", "noopener,noreferrer");
}

export async function copyQuick11UnlockAndOpenFb(): Promise<boolean> {
  const copied = await copyQuick11UnlockCode();
  openQuick11FbMessenger();
  return copied;
}
