import type { Metadata } from "next";
import { Quick11ExitModalPreviewClient } from "./preview-client";

export const metadata: Metadata = {
  title: "四步驟轉化彈窗預覽｜破產計算機",
  robots: { index: false, follow: false },
};

export default function Quick11ExitModalPreviewPage() {
  return <Quick11ExitModalPreviewClient />;
}
