import { HomeJsonLd } from "@/app/components/home-json-ld";
import Home from "./home-client-page";

/** 首頁：JSON-LD 僅在此路由注入，小計算機頁不重複 FAQ */
export default function HomePage() {
  return (
    <>
      <HomeJsonLd />
      <Home />
    </>
  );
}
