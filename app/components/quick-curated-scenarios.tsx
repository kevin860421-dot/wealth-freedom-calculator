"use client";

import Link from "next/link";
import { buildQuickScenarioHref, getQuickCuratedScenarios } from "@/lib/quick-curated-scenarios";

export function QuickCuratedScenarios({ id }: { id: number }) {
  const scenarios = getQuickCuratedScenarios(id);
  if (scenarios.length === 0) return null;

  return (
    <nav
      aria-labelledby={`quick-${id}-scenarios-heading`}
      style={{
        marginTop: 12,
        borderRadius: 14,
        border: "1px solid rgba(148,163,184,0.22)",
        background: "rgba(15,23,42,0.4)",
        padding: "12px 14px",
      }}
    >
      <h2
        id={`quick-${id}-scenarios-heading`}
        style={{
          margin: "0 0 10px",
          color: "#e8eefc",
          fontSize: 16,
          lineHeight: 1.35,
          fontWeight: 900,
        }}
      >
        精選試算情境（點選帶入參數）
      </h2>
      <p style={{ margin: "0 0 10px", color: "#94a3b8", fontSize: 13, lineHeight: 1.5 }}>
        以下為站內常用組合，方便分享與比較；搜尋收錄仍以本頁主網址為準。
      </p>
      <ul
        style={{
          margin: 0,
          padding: 0,
          listStyle: "none",
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        {scenarios.map((s) => (
          <li key={s.label}>
            <Link
              href={buildQuickScenarioHref(id, s.query)}
              style={{
                display: "inline-block",
                padding: "6px 12px",
                borderRadius: 999,
                border: "1px solid rgba(148,163,184,0.35)",
                background: "rgba(255,255,255,0.06)",
                color: "#e2e8f0",
                fontSize: 13,
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              {s.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
