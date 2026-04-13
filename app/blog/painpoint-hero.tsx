import styles from "./painpoint-hero.module.css";

function paletteById(id: number) {
  const palettes = [
    { a: "#0ea5e9", b: "#22c55e", c: "#0f172a" }, // sky/green
    { a: "#a855f7", b: "#f97316", c: "#0f172a" }, // purple/orange
    { a: "#ef4444", b: "#f59e0b", c: "#0f172a" }, // red/amber
    { a: "#14b8a6", b: "#3b82f6", c: "#0f172a" }, // teal/blue
    { a: "#e11d48", b: "#8b5cf6", c: "#0f172a" }, // rose/violet
    { a: "#22c55e", b: "#06b6d4", c: "#0f172a" }, // green/cyan
    { a: "#f97316", b: "#38bdf8", c: "#0f172a" }, // orange/sky
  ];
  return palettes[Math.abs(id) % palettes.length]!;
}

export function PainpointHero(props: { no: number; title: string; subtitle: string }) {
  const { no, title, subtitle } = props;
  const p = paletteById(no);

  return (
    <figure className={styles.wrap} aria-label={`痛點短評（${no}）首圖（示意）`}>
      <div
        className={styles.card}
        style={{
          background: `radial-gradient(800px 300px at 20% 0%, ${p.a}33, transparent 60%), radial-gradient(700px 280px at 80% 30%, ${p.b}2e, transparent 60%), linear-gradient(180deg, rgba(15,23,42,0.92), rgba(2,6,23,0.92))`,
          borderColor: `${p.a}33`,
        }}
      >
        <div className={styles.badgeRow}>
          <span className={styles.badge}>PAINPOINT NOTE</span>
          <span className={styles.no}>#{String(no).padStart(2, "0")}</span>
        </div>
        <div className={styles.title}>{title}</div>
        <p className={styles.subtitle}>{subtitle}</p>

        <div className={styles.miniRow} aria-hidden>
          <span className={styles.dot} style={{ background: p.a }} />
          <span className={styles.dot} style={{ background: p.b }} />
          <span className={styles.dot} style={{ background: p.c }} />
          <span className={styles.miniText}>把焦慮翻成可行動的下一步</span>
        </div>
      </div>
      <figcaption className={styles.caption}>每篇使用不同配色之示意首圖，方便滑讀辨識。</figcaption>
    </figure>
  );
}

