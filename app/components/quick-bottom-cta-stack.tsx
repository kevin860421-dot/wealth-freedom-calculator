"use client";

import { QuickCalculatorCrossLinks } from "./quick-calculator-cross-links";
import { QuickMainCalculatorCta, type QuickMainCalculatorCtaProps } from "./quick-main-calculator-cta";

type QuickBottomCtaStackProps = QuickMainCalculatorCtaProps & {
  isLight?: boolean;
};

/** 進入大計算機 CTA + 站內互連卡（CTA 下、延伸文章／SEO 上） */
export function QuickBottomCtaStack({ isLight = false, ...ctaProps }: QuickBottomCtaStackProps) {
  return (
    <div className="flex w-full flex-col gap-2.5">
      <QuickMainCalculatorCta {...ctaProps} />
      <QuickCalculatorCrossLinks currentQuickId={ctaProps.quickId} isLight={isLight} />
    </div>
  );
}
