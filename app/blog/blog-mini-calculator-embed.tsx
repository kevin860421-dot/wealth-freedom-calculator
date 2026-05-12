"use client";

/**
 * quick-1～12：皆 lazy 載入「純 UI 元件」（非 route page），包在 `.wf-inline-calculator`。
 * 第11台：`QuickCalculator11Content` 與 `/quick-11` 頁面為同一份元件。第12台：`QuickCalculator12Content` 與 `/quick-12` 同一份。
 */
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { quick11EmbedPresetFromSlug } from "../quick-11/loan-scenarios";
import styles from "./blog.module.css";
import "./mini-calculator-embed.css";

type Props = {
  route: string;
  title: string;
  note?: string;
  /** 小計算機專屬文 slug：quick-11 時帶入，文內試算與 `loan-scenarios` 快捷鈕數字一致 */
  miniBlogSlug?: string;
};

const Quick8 = lazy(() => import("../quick-8/page"));
const Quick9 = lazy(() => import("../quick-9/page"));
const Quick10 = lazy(() => import("../quick-10/page"));
const Quick11 = lazy(() => import("../quick-11/QuickCalculator11Content"));
const Quick1 = lazy(() => import("../quick-1/view"));
const Quick2 = lazy(() => import("../quick-2/page"));
const Quick3 = lazy(() => import("../quick-3/page"));
const Quick4 = lazy(() => import("../quick-4/page"));
const Quick5 = lazy(() => import("../quick-5/page"));
const Quick6 = lazy(() => import("../quick-6/page"));
const Quick7 = lazy(() => import("../quick-7/page"));
const Quick12 = lazy(() => import("../quick-12/QuickCalculator12Content"));

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
  if (route === "/quick-11") return Quick11;
  if (route === "/quick-12") return Quick12;
  return null;
}

export function BlogMiniCalculatorEmbed({ route, title, note, miniBlogSlug }: Props) {
  const Calculator = resolveCalculator(route);
  const quick11Anchor = route === "/quick-11" && miniBlogSlug ? quick11EmbedPresetFromSlug(miniBlogSlug) : undefined;
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
    <section aria-label={`文內試算：${title}`}>
      <h2 className={styles.miniEmbedSectionTitle}>{title}</h2>
      <p className={styles.grafTight}>{note ?? "直接在文內試算，先看結論再回到完整工具微調。"}</p>

      {Calculator != null ? (
        <div ref={mountRef} className={styles.miniEmbedMount}>
          {!shouldMount ? (
            <div className={styles.miniEmbedPlaceholder}>小計算機即將載入...</div>
          ) : (
            <div className="isolate w-full wf-inline-calculator">
              <Suspense fallback={<div className={styles.miniEmbedFallback}>小計算機載入中...</div>}>
                {route === "/quick-1" ? (
                  <Calculator showArticleToggle={false} />
                ) : route === "/quick-11" ? (
                  <div className="not-prose isolate w-full min-w-0">
                    <Calculator embeddedInMiniBlog initialEmbedPreset={quick11Anchor} />
                  </div>
                ) : route === "/quick-12" ? (
                  <div className="not-prose isolate w-full min-w-0">
                    <Calculator embeddedInMiniBlog />
                  </div>
                ) : (
                  <Calculator />
                )}
              </Suspense>
            </div>
          )}
        </div>
      ) : (
        <div className={styles.miniEmbedUnsupported}>目前僅支援 quick-1 ~ quick-12 文內試算。</div>
      )}
    </section>
  );
}
