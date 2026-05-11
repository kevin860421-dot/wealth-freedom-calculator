import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "小額貸款代價計算機｜利息、機會成本與稅後損失（示意）｜財富自由計算機",
  description:
    "信貸級距本息攤還、總利息，並以與大計算機相同之合併課稅與二代健保 2.11% 邏輯估算本金若改投之稅後複利；情境試算僅供參考。",
};

export default function Quick12Layout({ children }: { children: ReactNode }) {
  return children;
}
