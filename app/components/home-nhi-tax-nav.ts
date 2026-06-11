/** 首頁頁尾捷徑 → 捲動並展開「二代健保與稅金」區塊 */
export const HOME_OPEN_NHI_TAX_EVENT = "home-open-nhi-tax-section";

export function openHomeNhiTaxSection() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(HOME_OPEN_NHI_TAX_EVENT));
}
