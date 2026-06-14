import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { quick11ExcelDownloadResponse, readQuick11ExcelBuffer } from "@/lib/quick11-excel-serve";
import { isQuick11ExcelDownloadEnabled, QUICK11_SHARE_UNLOCK_COOKIE } from "@/lib/quick11-marketing";

export const runtime = "nodejs";

/** 須先分享試算結果（cookie 解鎖）才可下載 Excel */
export async function GET() {
  if (!isQuick11ExcelDownloadEnabled()) {
    return NextResponse.json({ error: "Excel 範本更新中，暫停下載。" }, { status: 503 });
  }

  const cookieStore = await cookies();
  if (cookieStore.get(QUICK11_SHARE_UNLOCK_COOKIE)?.value !== "1") {
    return NextResponse.json(
      { error: "請先在破產計算機頁分享試算結果，再下載 Excel 範本。" },
      { status: 403 },
    );
  }

  const buffer = readQuick11ExcelBuffer();
  if (!buffer) {
    return NextResponse.json({ error: "Excel 範本尚未就緒。" }, { status: 404 });
  }

  return quick11ExcelDownloadResponse(buffer, "private, no-store");
}
