"use client";

import { getQuickFaqs } from "@/lib/quick-seo-faq-data";

export function QuickFaqSection({ id }: { id: number }) {
  const faqs = getQuickFaqs(id);
  if (faqs.length === 0) return null;

  return (
    <section
      aria-labelledby={`quick-${id}-faq-heading`}
      style={{
        marginTop: 12,
        borderRadius: 14,
        border: "1px solid rgba(148,163,184,0.22)",
        background: "rgba(15,23,42,0.52)",
        padding: "12px 14px",
        color: "#cbd5e1",
        lineHeight: 1.75,
      }}
    >
      <h2
        id={`quick-${id}-faq-heading`}
        style={{
          margin: "0 0 10px",
          color: "#e8eefc",
          fontSize: 17,
          lineHeight: 1.35,
          fontWeight: 900,
        }}
      >
        常見問題（FAQ）
      </h2>
      <dl style={{ margin: 0 }}>
        {faqs.map((item) => (
          <div key={item.question} style={{ marginBottom: 14 }}>
            <dt style={{ margin: 0, color: "#f1f5f9", fontWeight: 800, fontSize: 15 }}>{item.question}</dt>
            <dd style={{ margin: "6px 0 0", fontSize: 14 }}>{item.answer}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
