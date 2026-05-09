import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "破產計算機｜2026 房貸試算與 DTI 破產預警",
  description: "同時計算本息均攤與本金平均攤還，顯示每期利息明細、DTI 房貸收入比與破產預警，幫你看清銀行拿走多少錢。",
};

export default function Quick11Layout({ children }: { children: ReactNode }) {
  return children;
}
