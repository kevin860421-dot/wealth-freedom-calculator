import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const QUICK11_EXCEL_FILENAME = "quick11-loan-dti-template.xlsx";

/** 瀏覽器下載時顯示的檔名（ASCII，相容舊版 UA） */
export const QUICK11_EXCEL_DOWNLOAD_AS = "quick11-home-v5-dual-sheets.xlsx";

/** 靜態直連（public/downloads，本機／部署皆可預覽下載） */
export const QUICK11_EXCEL_STATIC_PATH = "/downloads/quick11-loan-dti-template.xlsx";

export function quick11ExcelFilePath(): string {
  return path.join(process.cwd(), "assets", "downloads", QUICK11_EXCEL_FILENAME);
}

export function readQuick11ExcelBuffer(): Buffer | null {
  const filePath = quick11ExcelFilePath();
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath);
}

export function quick11ExcelDownloadResponse(buffer: Buffer, cacheControl = "no-store, max-age=0"): NextResponse {
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${QUICK11_EXCEL_DOWNLOAD_AS}"`,
      "Cache-Control": cacheControl,
    },
  });
}
