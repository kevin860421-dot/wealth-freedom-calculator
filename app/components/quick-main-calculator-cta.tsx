"use client";

import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { trackClickMainCalculator } from "@/lib/gtag-events";

const DEFAULT_STYLE: CSSProperties = {
  marginTop: 6,
  display: "flex",
  flexDirection: "column",
  gap: 10,
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  textDecoration: "none",
  padding: "22px 22px",
  borderRadius: 14,
  background: "#2563eb",
  color: "white",
  fontSize: 18,
  fontWeight: 900,
  lineHeight: 1.4,
  letterSpacing: "0.12em",
};

export type QuickMainCalculatorCtaProps = {
  /** 第 1～12 台小計算機編號，寫入 GA4 quick_id 與 from_page */
  quickId: number;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
  /** 預設：🔍 進入財富自由計算機 */
  label?: string;
};

export function QuickMainCalculatorCta({
  quickId,
  className,
  style,
  children,
  label = "🔍 進入財富自由計算機",
}: QuickMainCalculatorCtaProps) {
  const mergedStyle = className ? style : { ...DEFAULT_STYLE, ...style };

  return (
    <Link
      href="/"
      className={className}
      style={mergedStyle}
      onClick={() => trackClickMainCalculator(quickId)}
    >
      {children ?? <span style={{ lineHeight: 1.4, letterSpacing: "0.12em" }}>{label}</span>}
    </Link>
  );
}
