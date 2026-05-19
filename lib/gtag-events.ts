/** GA4 自訂事件（需全站已載入 gtag，見 app/layout.tsx） */

import { getQuickGaFromPage } from "@/lib/quick-ga-from-page";

export function trackClickMainCalculator(quickId: number) {
  if (typeof window === "undefined") return;
  const gtag = (window as Window & { gtag?: (...args: unknown[]) => void }).gtag;
  if (typeof gtag !== "function") return;
  gtag("event", "click_main_calculator", {
    quick_id: quickId,
    from_page: getQuickGaFromPage(quickId),
  });
}
