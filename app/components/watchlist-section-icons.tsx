import type { SVGProps } from "react";

/** 新增／建立 — 常見於表單與清單 CTA */
export function IconPlus(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden {...props}>
      <path
        d="M12 5v14M5 12h14"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** 自選／關注清單常用星形圖示（線條風格，與首頁深色主題一致） */
export function IconWatchlistStar(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden {...props}>
      <path
        d="M12 3.5l2.35 5.32 5.78.52-4.38 3.8 1.32 5.64L12 15.89l-5.07 2.89 1.32-5.64-4.38-3.8 5.78-.52L12 3.5z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
  );
}
