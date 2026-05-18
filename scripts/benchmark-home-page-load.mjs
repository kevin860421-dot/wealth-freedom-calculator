const base = process.argv[2] ?? "https://wealth-freedom-calculator.vercel.app";

async function main() {
  const t0 = performance.now();
  const html = await (await fetch(`${base}/`)).text();
  const htmlMs = performance.now() - t0;

  const scripts = [
    ...html.matchAll(/(?:src|href)="(\/_next\/static\/[^"]+\.js[^"]*)"/g),
  ].map((m) => m[1]);
  const unique = [...new Set(scripts)];

  let totalBytes = 0;
  let totalMs = 0;
  const rows = [];

  for (const p of unique) {
    const s = performance.now();
    const r = await fetch(`${base}${p}`);
    const buf = await r.arrayBuffer();
    const ms = performance.now() - s;
    totalBytes += buf.byteLength;
    totalMs += ms;
    rows.push({ name: p.split("/").pop(), kb: buf.byteLength / 1024, ms });
  }

  rows.sort((a, b) => b.kb - a.kb);

  console.log(`Base: ${base}/`);
  console.log(`HTML: ${htmlMs.toFixed(0)} ms (${(html.length / 1024).toFixed(1)} KB)`);
  console.log(`JS chunks: ${unique.length}, total ${(totalBytes / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Sequential JS download: ${totalMs.toFixed(0)} ms (cold, no browser cache)`);
  console.log(`HTML + all JS (lower bound, no parse/hydrate): ${(htmlMs + totalMs).toFixed(0)} ms`);
  console.log("Top 5 chunks:");
  for (const r of rows.slice(0, 5)) {
    console.log(`  ${r.kb.toFixed(1)} KB  ${r.ms.toFixed(0)} ms  ${r.name}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
