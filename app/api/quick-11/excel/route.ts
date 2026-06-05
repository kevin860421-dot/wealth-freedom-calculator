import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { QUICK11_SHARE_UNLOCK_COOKIE } from "@/lib/quick11-marketing";

export const runtime = "nodejs";

const EXCEL_FILENAME = "quick11-loan-dti-template.xlsx";

function excelFilePath(): string {
  return path.join(process.cwd(), "assets", "downloads", EXCEL_FILENAME);
}

/** 須先分享試算結果（cookie 解鎖）才可下載 Excel */
export async function GET() {
  const cookieStore = await cookies();
  if (cookieStore.get(QUICK11_SHARE_UNLOCK_COOKIE)?.value !== "1") {
    return NextResponse.json(
      { error: "請先在破產計算機頁分享試算結果，再下載 Excel 範本。" },
      { status: 403 },
    );
  }

  const filePath = excelFilePath();
  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: "Excel 範本尚未就緒。" }, { status: 404 });
  }

  const buffer = fs.readFileSync(filePath);
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${EXCEL_FILENAME}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
