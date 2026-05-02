"use client";

import { lazy, Suspense } from "react";
import styles from "./blog.module.css";

type Props = {
  route: string;
  title: string;
  note?: string;
};

const Quick8 = lazy(() => import("../quick-8/page"));
const Quick9 = lazy(() => import("../quick-9/page"));
const Quick10 = lazy(() => import("../quick-10/page"));

function resolveCalculator(route: string) {
  if (route === "/quick-8") return Quick8;
  if (route === "/quick-9") return Quick9;
  if (route === "/quick-10") return Quick10;
  return null;
}

export function BlogMiniCalculatorEmbed({ route, title, note }: Props) {
  const Calculator = resolveCalculator(route);

  return (
    <section className={styles.card} aria-label={`內嵌小計算機：${title}`}>
      <h2 style={{ marginTop: 0 }}>{title}</h2>
      <p className={styles.grafTight}>{note ?? "直接在文內試算，先看結論再回到完整工具微調。"}</p>

      {Calculator ? (
        <div className="wf-inline-calculator" style={{ marginTop: 8 }}>
          <style jsx global>{`
            .wf-inline-calculator main {
              background: transparent !important;
              min-height: auto !important;
              padding-top: 0 !important;
              padding-bottom: 0 !important;
            }
          `}</style>
          <Suspense
            fallback={
              <div style={{ padding: 16, fontSize: 14, opacity: 0.9 }}>
                小計算機載入中...
              </div>
            }
          >
            <Calculator />
          </Suspense>
        </div>
      ) : (
        <div style={{ marginTop: 8, padding: 12, borderRadius: 12, border: "1px solid rgba(255,255,255,0.12)" }}>
          目前僅支援 quick-8 / quick-9 / quick-10 直接內嵌。
        </div>
      )}

    </section>
  );
}

