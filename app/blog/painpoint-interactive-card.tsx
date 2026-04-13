"use client";

import { useMemo, useState } from "react";
import styles from "./blog.module.css";

type Choice = {
  id: string;
  label: string;
  resultTitle: string;
  resultBody: string;
};

export function PainpointInteractiveCard(props: {
  title: string;
  prompt: string;
  choices: Choice[];
}) {
  const { title, prompt, choices } = props;
  const [pickedId, setPickedId] = useState<string | null>(null);

  const picked = useMemo(() => choices.find((c) => c.id === pickedId) ?? null, [choices, pickedId]);

  return (
    <section className={styles.callout} aria-label={title}>
      <p className={styles.grafTight}>
        <strong>{title}</strong>
      </p>
      <p className={styles.grafTight} style={{ marginTop: "0.25rem" }}>
        {prompt}
      </p>

      <div className={styles.quiz} role="group" aria-label={title}>
        {choices.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setPickedId(c.id)}
            style={{
              width: "100%",
              textAlign: "left",
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid rgba(148, 163, 184, 0.25)",
              background: pickedId === c.id ? "rgba(56, 189, 248, 0.10)" : "rgba(15, 23, 42, 0.10)",
              color: "inherit",
              cursor: "pointer",
            }}
          >
            {c.label}
          </button>
        ))}
      </div>

      {picked ? (
        <div style={{ marginTop: 10 }}>
          <p className={styles.grafTight} style={{ marginBottom: 6 }}>
            <strong>{picked.resultTitle}</strong>
          </p>
          <p className={styles.grafTight} style={{ marginBottom: 0 }}>
            {picked.resultBody}
          </p>
        </div>
      ) : null}
    </section>
  );
}

