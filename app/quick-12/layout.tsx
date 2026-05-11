import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "實領薪資與稅務負擔計算機｜勞健保、二代健保、綜所稅累進（示意）｜財富自由計算機",
  description:
    "月薪投保、年終與兼職／股利單筆給付；勞健保簡化自付率、二代健保 2.11% 與大計算機一致、綜所 5%～40% 累進差額試算；情境僅供參考。",
};

export default function Quick12Layout({ children }: { children: ReactNode }) {
  return children;
}
