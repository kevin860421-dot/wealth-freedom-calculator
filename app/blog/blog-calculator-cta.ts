/** 每篇文章正文僅一個指向首頁計算機的主按鈕；Modal／底部條改為捲動至此錨點。 */
export const WF_BLOG_CALCULATOR_CTA_ID = "wf-blog-calculator-cta";

export function scrollToBlogCalculatorCta(): void {
  if (typeof document === "undefined") return;
  document.getElementById(WF_BLOG_CALCULATOR_CTA_ID)?.scrollIntoView({
    behavior: "smooth",
    block: "center",
  });
}
