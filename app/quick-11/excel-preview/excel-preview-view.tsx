import Link from "next/link";
import type { Quick11ExcelPreviewFooter, Quick11ExcelPreviewRow } from "@/lib/quick11-excel-preview";
import {
  QUICK11_EXCEL_DOWNLOAD_PATH,
  QUICK11_EXCEL_PUBLIC_DOWNLOAD_PATH,
  QUICK11_EXCEL_PREVIEW_PATH,
} from "@/lib/quick11-marketing";
import { QUICK11_EXCEL_STATIC_PATH } from "@/lib/quick11-excel-serve";

type Props = {
  rows: Quick11ExcelPreviewRow[];
  footer: Quick11ExcelPreviewFooter;
  missingFile: boolean;
};

function SideCell({ row }: { row: Quick11ExcelPreviewRow }) {
  if (!row.side) return <td className="w-[28%] bg-[#F8F9FA]" />;
  const { label, value, highlight } = row.side;
  const isPanel = row.kind === "panel";
  const isHeader = row.side.label === "摘要";

  if (isPanel) {
    return (
      <td colSpan={2} className="border border-[#E2E8F0] bg-[#0B2545] px-3 py-2 text-[12px] font-black text-white">
        {label}
      </td>
    );
  }

  const trBg = highlight ? "bg-[#EFF6FF]" : isHeader ? "bg-[#F0F4F8]" : "bg-white";
  return (
    <>
      <td className={`whitespace-nowrap border border-[#E2E8F0] py-2 pl-3 pr-2 text-[13px] ${trBg} ${isHeader ? "font-bold text-[#475569]" : "text-[#1E293B]"}`}>
        {label}
      </td>
      <td className={`whitespace-nowrap border border-[#E2E8F0] px-3 py-2 text-right text-[13px] font-bold ${trBg} ${isHeader ? "text-[#475569]" : "text-sky-700"}`}>
        {value}
      </td>
    </>
  );
}

function MainCells({ row }: { row: Quick11ExcelPreviewRow }) {
  if (row.kind === "spacer") {
    return (
      <td colSpan={4} className="h-2 bg-[#F8F9FA]" />
    );
  }

  if (row.kind === "title") {
    return (
      <td colSpan={4} className="border-b border-[#E2E8F0] bg-white px-4 py-3 text-[16px] font-black text-[#1E293B]">
        {row.cells[0]}
      </td>
    );
  }

  if (row.kind === "subtitle") {
    return (
      <td colSpan={4} className="bg-white px-4 py-2 text-[13px] font-bold text-[#475569]">
        {row.cells[0]}
      </td>
    );
  }

  if (row.kind === "panel") {
    return (
      <td colSpan={4} className="border border-[#E2E8F0] bg-[#0B2545] px-4 py-2 text-[12px] font-black text-white">
        {row.cells[0]}
      </td>
    );
  }

  if (row.kind === "warnBanner") {
    const bg =
      row.highlight === "warn"
        ? "bg-red-50 text-red-700"
        : row.highlight === "warnMid"
          ? "bg-orange-50 text-orange-800"
          : "bg-emerald-50 text-emerald-700";
    return (
      <td colSpan={4} className={`border border-[#E2E8F0] px-4 py-3 text-[13px] font-bold ${bg}`}>
        {row.cells[0]}
      </td>
    );
  }

  if (row.kind === "disclaimer") {
    return (
      <td colSpan={4} className="bg-[#F8F9FA] px-4 py-2 text-[11px] text-[#64748B]">
        {row.cells[0]}
      </td>
    );
  }

  const isHeader = row.kind === "header";
  const isHealthRow = row.kind === "data" && row.cells[0] === "財務健康狀態";
  const isDtiRow = row.kind === "data" && row.cells[0] === "DTI 債務收入比";

  if (isHealthRow) {
    const bg =
      row.highlight === "warn"
        ? "bg-red-50"
        : row.highlight === "warnMid"
          ? "bg-orange-50"
          : "bg-emerald-50";
    const text =
      row.highlight === "warn"
        ? "text-red-600"
        : row.highlight === "warnMid"
          ? "text-orange-700"
          : "text-emerald-700";
    return (
      <>
        <td className={`whitespace-nowrap border border-[#E2E8F0] py-2.5 pl-4 pr-3 font-bold ${bg} ${text}`}>
          {row.cells[0]}
        </td>
        <td colSpan={3} className={`whitespace-nowrap border border-[#E2E8F0] px-3 py-2.5 font-bold ${bg} ${text}`}>
          {row.cells[1]}
        </td>
      </>
    );
  }

  const trClass = isHeader ? "bg-[#EFF6FF]" : "bg-white";

  return (
    <>
      {row.cells.map((cell, ci) => {
        const isValueCol = ci === 1;
        const isUnitCol = ci === 2;
        let tdClass = `whitespace-nowrap border border-[#E2E8F0] py-2.5 align-middle ${trClass} `;
        if (ci === 0) tdClass += "pl-4 pr-3 text-[#1E293B] ";
        else if (isHeader && isValueCol) tdClass += "px-3 text-right font-bold text-[#475569] ";
        else if (isHeader) tdClass += "px-3 ";
        else if (row.highlight === "input" && isValueCol) tdClass += "px-3 text-right font-bold text-sky-600 ";
        else if (isDtiRow && isValueCol) tdClass += "px-3 text-right font-bold text-amber-600 ";
        else if (row.highlight === "result" && isValueCol) tdClass += "px-3 text-right font-bold text-sky-700 ";
        else if (isUnitCol) tdClass += "px-3 text-center text-[#64748B] ";
        else if (ci === 3) tdClass += "px-3 text-left text-[#64748B] ";
        else if (isValueCol) tdClass += "px-3 text-right ";
        if (isHeader) tdClass += "text-[12px] font-bold text-[#475569] ";
        if (isHeader && isUnitCol) tdClass += "text-center ";

        return (
          <td key={ci} className={tdClass} title={cell}>
            {cell}
          </td>
        );
      })}
    </>
  );
}

export function Quick11ExcelPreviewView({ rows, footer, missingFile }: Props) {
  return (
    <div className="min-h-[100dvh] bg-[#F8F9FA] px-3 py-5 text-[#2D3748] font-['Microsoft_JhengHei','微軟正黑體',sans-serif]">
      <div className="mx-auto max-w-[1080px]">
        <div className="mb-4 rounded-xl border border-amber-400/50 bg-amber-50 px-4 py-3 text-[13px] text-amber-950">
          <p className="font-black">🛠 Excel 範本預覽（瀏覽器版）</p>
          <p className="mt-1 text-amber-900/90">
            <strong>Cursor 裡的 .xlsx 無法預覽版面</strong>，請用下方按鈕在瀏覽器開啟，或用 Excel 開啟下載檔。
            新版：首頁藍／綠按鈕開啟「本息均攤／本金平均」明細分頁，可【新建視窗】拖至右側。
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <a
              href={QUICK11_EXCEL_STATIC_PATH}
              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-[12px] font-bold text-white hover:bg-emerald-700"
            >
              下載新版 v5（靜態直連）
            </a>
            <a
              href={QUICK11_EXCEL_PUBLIC_DOWNLOAD_PATH}
              className="rounded-lg bg-sky-600 px-3 py-1.5 text-[12px] font-bold text-white hover:bg-sky-700"
            >
              API 下載 .xlsx
            </a>
            <Link
              href={QUICK11_EXCEL_PREVIEW_PATH}
              className="rounded-lg border border-amber-800/20 bg-white px-3 py-1.5 text-[12px] font-bold text-amber-950 hover:bg-amber-100/80"
            >
              重新整理預覽
            </Link>
            <Link
              href="/quick-11/exit-modal-preview"
              className="rounded-lg border border-amber-800/20 bg-white px-3 py-1.5 text-[12px] font-bold text-amber-950 hover:bg-amber-100/80"
            >
              Wizard 預覽
            </Link>
          </div>
          <p className="mt-2 text-[12px] text-amber-900/80">
            本機預覽網址：<code className="rounded bg-white/80 px-1">http://localhost:3000{QUICK11_EXCEL_PREVIEW_PATH}</code>
          </p>
        </div>

        {missingFile ? (
          <p className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-[14px] text-red-800">
            找不到 Excel 檔。請執行{" "}
            <code className="rounded bg-white px-1">node scripts/generate-quick11-loan-excel.mjs</code>
          </p>
        ) : (
          <>
            <div className="overflow-x-auto rounded-xl border border-[#E2E8F0] bg-white shadow-sm">
              <table className="w-full min-w-[1100px] border-collapse text-[14px] table-fixed">
                <colgroup>
                  <col className="w-[26%]" />
                  <col className="w-[14%]" />
                  <col className="w-[8%]" />
                  <col className="w-[32%]" />
                  <col className="w-[1%]" />
                  <col className="w-[12%]" />
                  <col className="w-[7%]" />
                </colgroup>
                <tbody>
                  {rows.map((row, i) => {
                    const fullWidth = ["title", "subtitle", "warnBanner", "disclaimer"].includes(row.kind);
                    const hasSide = row.side && !fullWidth;

                    if (fullWidth) {
                      const spanAll =
                        row.kind === "title" || row.kind === "subtitle" || row.kind === "warnBanner" || row.kind === "disclaimer";
                      return (
                        <tr key={i}>
                          {spanAll ? (
                            <td
                              colSpan={7}
                              className={
                                row.kind === "title"
                                  ? "border-b border-[#E2E8F0] bg-white px-4 py-3 text-[16px] font-black text-[#1E293B]"
                                  : row.kind === "subtitle"
                                    ? "bg-white px-4 py-2 text-[13px] font-bold text-[#475569]"
                                    : row.kind === "warnBanner"
                                      ? `border border-[#E2E8F0] px-4 py-3 text-[13px] font-bold ${row.highlight === "warn" ? "bg-red-50 text-red-700" : row.highlight === "warnMid" ? "bg-orange-50 text-orange-800" : "bg-emerald-50 text-emerald-700"}`
                                      : "bg-[#F8F9FA] px-4 py-2 text-[11px] text-[#64748B]"
                              }
                            >
                              {row.cells[0]}
                            </td>
                          ) : null}
                        </tr>
                      );
                    }

                    if (row.kind === "spacer") {
                      return (
                        <tr key={i}>
                          <MainCells row={row} />
                          <td className="bg-[#F8F9FA]" />
                          {row.side ? <SideCell row={row} /> : <td colSpan={2} className="bg-[#F8F9FA]" />}
                        </tr>
                      );
                    }

                    return (
                      <tr key={i}>
                        <MainCells row={row} />
                        <td className="w-[1%] bg-[#F8F9FA]" />
                        {hasSide ? <SideCell row={row} /> : <td colSpan={2} className="bg-[#F8F9FA]" />}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-8 flex justify-center">
              <a
                href={footer.homeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-white px-6 py-2.5 text-[14px] font-bold text-sky-600 shadow-sm transition hover:border-sky-200 hover:bg-sky-50/80 hover:shadow"
              >
                前往財富自由計算機 ➔
              </a>
            </div>
          </>
        )}

        <p className="mt-3 text-center text-[12px] text-[#718096]">
          站內解鎖下載：{QUICK11_EXCEL_DOWNLOAD_PATH}
        </p>
      </div>
    </div>
  );
}
