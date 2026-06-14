import { NextResponse } from "next/server";
import { quick11ExcelDownloadResponse, readQuick11ExcelBuffer } from "@/lib/quick11-excel-serve";
import { isQuick11ExcelDownloadEnabled } from "@/lib/quick11-marketing";

export const runtime = "nodejs";

/**
 * 公開直連下載（Meta 私訊按鈕、自動回覆 CTA 用）。
 * 按下去即 attachment 下載，不需站內 cookie。
 */
export async function GET() {
  if (!isQuick11ExcelDownloadEnabled()) {
    return NextResponse.json({ error: "Excel 範本更新中，暫停下載。" }, { status: 503 });
  }

  const buffer = readQuick11ExcelBuffer();
  if (!buffer) {
    return NextResponse.json({ error: "Excel 範本尚未就緒。" }, { status: 404 });
  }
  return quick11ExcelDownloadResponse(buffer);
}
