"use client";

import { BLOG_OUTLETS } from "@/app/postflow/outlet/platforms";

/** 只由開發模式的 require 載入。正式 build 不應包含這支。 */
export function AfterTaxRankOutletBar() {
  return (
    <section
      aria-label="各大部落格隔離預覽"
      style={{
        marginTop: "2.5rem",
        paddingTop: "1.25rem",
        borderTop: "1px solid #e7e5e4",
      }}
    >
      <p style={{ margin: "0 0 0.75rem", fontSize: "0.875rem", color: "#57534e" }}>
        要發到各大部落格的文章
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
        {BLOG_OUTLETS.map((item) => (
          <a
            key={item.key}
            href={`/postflow/outlet/${item.key}?series=after-tax-dividend-rank`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "#1c1917",
              background: "#fff",
              border: "1px solid #d6d3d1",
              borderRadius: "8px",
              padding: "0.4rem 0.8rem",
              fontSize: "0.95rem",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            {item.label}
          </a>
        ))}
      </div>
    </section>
  );
}
