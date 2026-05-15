/**
 * 抽測 quick-1～quick-12 本機 production HTML 回應時間與大小
 * 先執行：npm run build && npm run start
 * 再執行：node scripts/benchmark-quick-pages.mjs [baseUrl]
 */
const base = process.argv[2] ?? "http://127.0.0.1:3000";

const routes = Array.from({ length: 12 }, (_, i) => `/quick-${i + 1}`);

async function measure(path) {
  const url = `${base}${path}`;
  const t0 = performance.now();
  const res = await fetch(url, { headers: { Accept: "text/html" } });
  const text = await res.text();
  const ms = performance.now() - t0;
  return {
    path,
    status: res.status,
    ms,
    kb: Math.round((text.length / 1024) * 10) / 10,
  };
}

async function main() {
  console.log(`Base: ${base}\n`);
  console.log("路由".padEnd(12), "狀態".padStart(6), "耗時(ms)".padStart(10), "HTML(KB)".padStart(10));
  console.log("-".repeat(42));

  const results = [];
  for (const path of routes) {
    try {
      const r = await measure(path);
      results.push(r);
      console.log(
        path.padEnd(12),
        String(r.status).padStart(6),
        r.ms.toFixed(1).padStart(10),
        String(r.kb).padStart(10),
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.log(path.padEnd(12), "ERR".padStart(6), msg.slice(0, 24).padStart(10));
      results.push({ path, status: 0, ms: NaN, kb: 0 });
    }
  }

  const ok = results.filter((r) => r.status === 200 && Number.isFinite(r.ms));
  if (ok.length) {
    const times = ok.map((r) => r.ms).sort((a, b) => a - b);
    const median = times[Math.floor(times.length / 2)];
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const max = times[times.length - 1];
    const min = times[0];
    console.log("-".repeat(42));
    console.log(`成功 ${ok.length}/${routes.length}  最快 ${min.toFixed(1)} ms  中位 ${median.toFixed(1)} ms  平均 ${avg.toFixed(1)} ms  最慢 ${max.toFixed(1)} ms`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
