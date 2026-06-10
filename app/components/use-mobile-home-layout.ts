"use client";

import { useEffect, useState } from "react";

/** 首頁手機區塊：含 ?mobile=1 預覽 */
export function useMobileHomeLayout() {
  const [mobileLayout, setMobileLayout] = useState(false);

  useEffect(() => {
    const sync = () => {
      const preview = document.documentElement.getAttribute("data-preview-mobile") === "true";
      setMobileLayout(preview || window.matchMedia("(max-width: 768px)").matches);
    };
    sync();
    const mq = window.matchMedia("(max-width: 768px)");
    mq.addEventListener("change", sync);
    const mo = new MutationObserver(sync);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-preview-mobile"] });
    return () => {
      mq.removeEventListener("change", sync);
      mo.disconnect();
    };
  }, []);

  return mobileLayout;
}
