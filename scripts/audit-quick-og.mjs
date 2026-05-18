const base = process.argv[2] ?? "https://wealth-freedom-calculator.vercel.app";

function pick(html, re) {
  const m = html.match(re);
  return m ? m[1] : null;
}

for (let id = 1; id <= 12; id += 1) {
  const r = await fetch(`${base}/quick-${id}`);
  const h = await r.text();
  const title = pick(h, /<title>([^<]*)<\/title>/) ?? "?";
  const desc = pick(h, /<meta name="description" content="([^"]*)"/) ?? "?";
  const ogt = pick(h, /<meta property="og:title" content="([^"]*)"/);
  const ogd = pick(h, /<meta property="og:description" content="([^"]*)"/);
  const ogu = pick(h, /<meta property="og:url" content="([^"]*)"/);
  const ogi = pick(h, /<meta property="og:image" content="([^"]*)"/);
  console.log(
    JSON.stringify({
      id,
      titleLen: title.length,
      title,
      descLen: desc.length,
      ogTitle: ogt ?? "(same as root)",
      ogUrl: ogu ?? "(root)",
      ogImage: ogi ? (ogi.includes("og-share") ? "og-share.png" : ogi) : "?",
    }),
  );
}
