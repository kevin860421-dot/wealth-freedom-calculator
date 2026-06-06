"use client";

import { useRouter } from "next/navigation";
import { Quick11ExcelLeadBlock } from "./quick11-excel-lead-block";

/** mini-blog 專文：導回破產計算機並打開四步驟彈窗 */
export function Quick11ExcelLeadBlockForArticle() {
  const router = useRouter();
  return (
    <Quick11ExcelLeadBlock
      onOpenWizard={() => {
        router.push("/quick-11?wizard=1#quick11-excel-lead");
      }}
    />
  );
}
