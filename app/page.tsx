import type { Metadata } from "next";
import { HomeJsonLd } from "@/app/components/home-json-ld";
import Home from "./home-client-page";

export const metadata: Metadata = {
  title: "退休計算機 Excel｜免費試算，可下載",
  description:
    "輸入目前本金、每月投入和退休後每月花費，算出幾歲達標。算完可下載 Excel，免註冊。",
  alternates: { canonical: "/" },
  openGraph: {
    title: "退休計算機 Excel｜免費試算，可下載",
    description:
      "輸入目前本金、每月投入和退休後每月花費，算出幾歲達標。算完可下載 Excel，免註冊。",
    url: "https://wealth-freedom-calculator.vercel.app/",
    images: [
      {
        url: "https://wealth-freedom-calculator.vercel.app/og/home-excel.png",
        width: 1200,
        height: 630,
        alt: "退休計算機 Excel：輸入本金、每月投入和退休後每月花費，算出幾歲達標，可下載",
      },
    ],
  },
};

/** 首頁：JSON-LD 僅在此路由注入，小計算機頁不重複 FAQ */
export default function HomePage() {
  return (
    <>
      <HomeJsonLd />
      <Home />
    </>
  );
}
