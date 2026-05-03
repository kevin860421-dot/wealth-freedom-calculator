"use client";

import { lazy, Suspense, useEffect, useRef, useState } from "react";
import styles from "./blog.module.css";

type Props = {
  route: string;
  title: string;
  note?: string;
};

const Quick8 = lazy(() => import("../quick-8/page"));
const Quick9 = lazy(() => import("../quick-9/page"));
const Quick10 = lazy(() => import("../quick-10/page"));
const Quick1 = lazy(() => import("../quick-1/view"));
const Quick2 = lazy(() => import("../quick-2/page"));
const Quick3 = lazy(() => import("../quick-3/page"));
const Quick4 = lazy(() => import("../quick-4/page"));
const Quick5 = lazy(() => import("../quick-5/page"));
const Quick6 = lazy(() => import("../quick-6/page"));
const Quick7 = lazy(() => import("../quick-7/page"));

function resolveCalculator(route: string) {
  if (route === "/quick-1") return Quick1;
  if (route === "/quick-2") return Quick2;
  if (route === "/quick-3") return Quick3;
  if (route === "/quick-4") return Quick4;
  if (route === "/quick-5") return Quick5;
  if (route === "/quick-6") return Quick6;
  if (route === "/quick-7") return Quick7;
  if (route === "/quick-8") return Quick8;
  if (route === "/quick-9") return Quick9;
  if (route === "/quick-10") return Quick10;
  return null;
}

export function BlogMiniCalculatorEmbed({ route, title, note }: Props) {
  const Calculator = resolveCalculator(route);
  const [shouldMount, setShouldMount] = useState(false);
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (shouldMount) return;
    const node = mountRef.current;
    if (!node) return;

    if (typeof IntersectionObserver === "undefined") {
      setShouldMount(true);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShouldMount(true);
          io.disconnect();
        }
      },
      { rootMargin: "320px 0px" },
    );

    io.observe(node);
    return () => io.disconnect();
  }, [shouldMount]);

  return (
    <section className={styles.card} aria-label={`內嵌小計算機：${title}`}>
      <h2 style={{ marginTop: 0 }}>{title}</h2>
      <p className={styles.grafTight}>{note ?? "直接在文內試算，先看結論再回到完整工具微調。"}</p>

      {Calculator ? (
        <div ref={mountRef} className="wf-inline-calculator" style={{ marginTop: 8 }}>
          {!shouldMount ? (
            <div
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.16)",
                background: "rgba(255,255,255,0.04)",
                color: "rgba(219,234,254,0.95)",
                fontWeight: 700,
                textAlign: "center",
              }}
            >
              小計算機即將載入...
            </div>
          ) : (
            <>
              <style jsx global>{`
                .wf-inline-calculator main {
                  background: transparent !important;
                  min-height: auto !important;
                  padding-top: 0 !important;
                  padding-bottom: 0 !important;
                }
                .wf-inline-calculator .quick-blog-links-toggle {
                  display: none !important;
                }
              `}</style>
              <Suspense
                fallback={
                  <div style={{ padding: 16, fontSize: 14, opacity: 0.9 }}>
                    小計算機載入中...
                  </div>
                }
              >
                {route === "/quick-1" ? <Calculator showArticleToggle={false} /> : <Calculator />}
              </Suspense>
            </>
          )}
        </div>
      ) : (
        <div style={{ marginTop: 8, padding: 12, borderRadius: 12, border: "1px solid rgba(255,255,255,0.12)" }}>
          目前僅支援 quick-1 ~ quick-10 直接內嵌。
        </div>
      )}

    </section>
  );
}

