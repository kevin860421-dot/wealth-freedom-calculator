import Link from "next/link";
import type { Quick11ExcelPreviewFooter, Quick11ExcelPreviewRow } from "@/lib/quick11-excel-preview";
import {
  QUICK11_EXCEL_DOWNLOAD_PATH,
  QUICK11_EXCEL_PUBLIC_DOWNLOAD_PATH,
} from "@/lib/quick11-marketing";

type Props = {
  rows: Quick11ExcelPreviewRow[];
  footer: Quick11ExcelPreviewFooter;
  missingFile: boolean;
};

export function Quick11ExcelPreviewView({ rows, footer, missingFile }: Props) {
  return (
    <div className="min-h-[100dvh] bg-[#F8F9FA] px-3 py-5 text-[#2D3748] font-['Microsoft_JhengHei','微軟正黑體',sans-serif]">
      <div className="mx-auto max-w-[920px]">
        <div className="mb-4 rounded-xl border border-amber-400/50 bg-amber-50 px-4 py-3 text-[13px] text-amber-950">
          <p className="font-black">🛠 本機 Excel 視覺預覽（development only）</p>
          <p className="mt-1 text-amber-900/90">
            下方表格對應 <code className="rounded bg-white/80 px-1">quick11-loan-dti-template.xlsx</code>
            ；欄寬已調為單行顯示。
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <a
              href={QUICK11_EXCEL_PUBLIC_DOWNLOAD_PATH}
              className="rounded-lg bg-sky-600 px-3 py-1.5 text-[12px] font-bold text-white hover:bg-sky-700"
            >
              下載 .xlsx
            </a>
            <Link
              href="/quick-11/exit-modal-preview"
              className="rounded-lg border border-amber-800/20 bg-white px-3 py-1.5 text-[12px] font-bold text-amber-950 hover:bg-amber-100/80"
            >
              Wizard 預覽
            </Link>
          </div>
        </div>

        {missingFile ? (
          <p className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-[14px] text-red-800">
            找不到 Excel 檔。請執行{" "}
            <code className="rounded bg-white px-1">node scripts/generate-quick11-loan-excel.mjs</code>
          </p>
        ) : (
          <>
            <div className="overflow-x-auto rounded-xl border border-[#E2E8F0] bg-white shadow-sm">
              <table className="w-full min-w-[860px] border-collapse text-[14px] table-fixed">
                <colgroup>
                  <col className="w-[26%]" />
                  <col className="w-[18%]" />
                  <col className="w-[10%]" />
                  <col className="w-[46%]" />
                </colgroup>
                <tbody>
                  {rows.map((row, i) => {
                    if (row.kind === "spacer") {
                      return (
                        <tr key={i}>
                          <td colSpan={4} className="h-3 bg-[#F8F9FA]" />
                        </tr>
                      );
                    }
                    if (row.kind === "title") {
                      return (
                        <tr key={i} className="bg-white">
                          <td
                            colSpan={4}
                            className="whitespace-nowrap border-b border-[#E2E8F0] px-4 py-3 text-[16px] font-black"
                          >
                            {row.cells[0]}
                          </td>
                        </tr>
                      );
                    }
                    if (row.kind === "section") {
                      return (
                        <tr key={i} className="bg-[#F8F9FA]">
                          <td colSpan={4} className="whitespace-nowrap px-4 py-2 text-[13px] font-black">
                            {row.cells[0]}
                          </td>
                        </tr>
                      );
                    }

                    const isHeader = row.kind === "header";
                    const isWarnRow = row.highlight === "warn" || row.highlight === "warnMid";
                    const isHealthRow =
                      row.kind === "data" && row.cells[0] === "財務健康狀態";

                    if (isHealthRow) {
                      const trClass =
                        row.highlight === "warn"
                          ? "bg-red-50"
                          : row.highlight === "warnMid"
                            ? "bg-orange-50"
                            : "bg-white";
                      const msgClass =
                        row.highlight === "warn"
                          ? "font-bold text-red-600"
                          : row.highlight === "warnMid"
                            ? "font-bold text-orange-700"
                            : "font-bold text-emerald-600";
                      return (
                        <tr key={i} className={trClass}>
                          <td
                            className={`whitespace-nowrap border border-[#E2E8F0] py-2.5 pl-4 pr-3 ${msgClass}`}
                          >
                            {row.cells[0]}
                          </td>
                          <td
                            colSpan={3}
                            className={`whitespace-nowrap border border-[#E2E8F0] px-3 py-2.5 text-left ${msgClass}`}
                          >
                            {row.cells[1]}
                          </td>
                        </tr>
                      );
                    }

                    const trClass = isHeader
                      ? "bg-[#F0F4F8]"
                      : isWarnRow && row.highlight === "warn"
                        ? "bg-red-50"
                        : isWarnRow && row.highlight === "warnMid"
                          ? "bg-orange-50"
                          : "bg-white";

                    return (
                      <tr key={i} className={trClass}>
                        {row.cells.map((cell, ci) => {
                          const isValueCol = ci === 1;
                          const isUnitCol = ci === 2;
                          const padClass =
                            ci === 0 ? "pl-4 pr-3" : isUnitCol ? "px-3" : "px-3";
                          let tdClass =
                            `whitespace-nowrap border border-[#E2E8F0] py-2.5 align-middle ${padClass} `;

                          if (isHeader) tdClass += "font-bold text-[#4A5568] ";
                          if (isHeader && isUnitCol) tdClass += "text-center ";
                          if (row.highlight === "input" && isValueCol) {
                            tdClass += "text-right font-bold text-sky-600 ";
                          } else if (row.highlight === "result" && isValueCol && row.cells[0] === "DTI 債務收入比") {
                            tdClass += "text-right font-bold text-amber-600 ";
                          } else if (row.highlight === "result" && isValueCol) {
                            tdClass += "text-right font-bold text-sky-700 ";
                          } else if (isUnitCol) {
                            tdClass += "text-center text-[#4A5568] ";
                          } else if (row.kind === "data" && ci === 3) {
                            tdClass += "text-left text-[#4A5568] ";
                          } else if (row.highlight === "warn" && ci <= 1) {
                            tdClass += "font-bold text-red-600 ";
                          } else if (row.highlight === "warnMid" && ci <= 1) {
                            tdClass += "font-bold text-orange-700 ";
                          } else if (isValueCol && row.kind === "data") {
                            tdClass += "text-right ";
                          } else if (row.highlight === "warn" && ci === 1) {
                            tdClass += "text-left ";
                          }

                          return (
                            <td key={ci} className={tdClass} title={cell}>
                              {cell}
                            </td>
                          );
                        })}
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
