#!/usr/bin/env node
/**
 * 產生 docs/sitemap-reference.xml（供 GSC 參考／備份；正式站仍用 app/sitemap.ts 動態 /sitemap.xml）
 * 執行：node scripts/export-sitemap-reference.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

// 動態 import TS 模組（透過 tsx 執行）
const { QUICK4_TICKER_POSTS, QUICK4_PUBLISH_DATES } = await import(
  "../app/mini-blog/posts/quick4-posts-tickers.ts"
);
const { QUICK4_COMPARISON_POSTS } = await import("../app/mini-blog/posts/quick4-comparison-posts.ts");

const BASE = "https://wealth-freedom-calculator.vercel.app";
const now = new Date().toISOString();

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function urlEntry(loc, lastmod, priority, changefreq = "monthly") {
  return [
    "  <url>",
    `    <loc>${esc(loc)}</loc>`,
    `    <lastmod>${lastmod}</lastmod>`,
    `    <changefreq>${changefreq}</changefreq>`,
    `    <priority>${priority}</priority>`,
    "  </url>",
  ].join("\n");
}

const staticPages = [
  { loc: BASE, priority: "1.0", changefreq: "weekly" },
  { loc: `${BASE}/blog`, priority: "0.8", changefreq: "weekly" },
  { loc: `${BASE}/mini-blog`, priority: "0.8", changefreq: "weekly" },
  ...["quick-1", "quick-2", "quick-3", "quick-4", "quick-5", "quick-6", "quick-7", "quick-8", "quick-9", "quick-10", "quick-11", "quick-12"].map(
    (id) => ({ loc: `${BASE}/${id}`, priority: "0.8", changefreq: "weekly" }),
  ),
];

const entries = [
  ...staticPages.map((p) => urlEntry(p.loc, now, p.priority, p.changefreq)),
  ...QUICK4_COMPARISON_POSTS.map((p) => {
    const iso = QUICK4_PUBLISH_DATES[p.slug] ?? now;
    return urlEntry(`${BASE}/mini-blog/${p.slug}`, new Date(iso).toISOString(), "0.87");
  }),
  ...QUICK4_TICKER_POSTS.map((p) => {
    const iso = QUICK4_PUBLISH_DATES[p.slug] ?? now;
    return urlEntry(`${BASE}/mini-blog/${p.slug}`, new Date(iso).toISOString(), "0.88");
  }),
];

const xml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...entries,
  "</urlset>",
  "",
].join("\n");

const outDir = path.join(root, "docs");
const outFile = path.join(outDir, "sitemap-reference.xml");
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outFile, xml, "utf8");

console.log(`Wrote ${outFile}`);
console.log(`Total URLs: ${entries.length} (100 ticker mini-blog + ${QUICK4_COMPARISON_POSTS.length} comparison + ${staticPages.length} core)`);
