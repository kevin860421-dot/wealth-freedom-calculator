import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { loadQuick11ExcelPreview } from "@/lib/quick11-excel-preview";
import { isQuick11DevToolsEnabled } from "@/lib/quick11-dev-tools";
import { Quick11ExcelPreviewView } from "./excel-preview-view";

export const metadata: Metadata = {
  title: "Excel 範本視覺預覽｜破產計算機",
  robots: { index: false, follow: false },
};

/** 本機 development：瀏覽器預覽 xlsx 版面與試算結果 */
export default async function Quick11ExcelPreviewPage() {
  if (!isQuick11DevToolsEnabled()) notFound();

  const { rows, footer, missingFile } = await loadQuick11ExcelPreview();

  return <Quick11ExcelPreviewView rows={rows} footer={footer} missingFile={missingFile} />;
}
