/**
 * 從正式站下載 og-quick-N.jpg，轉成 FB 較穩的規格：
 * - 1200×630（1.91:1）
 * - 非漸進式 JPEG（progressive: false）
 */
import fs from "fs";
import path from "path";
import sharp from "sharp";

const ORIGIN = process.argv[2] ?? "https://wealth-freedom-calculator.vercel.app";
const OUT_DIR = path.join(import.meta.dirname, "..", "public");
const TARGET_W = 1200;
const TARGET_H = 630;

for (let id = 1; id <= 12; id++) {
  const src = `${ORIGIN}/og-quick-${id}.jpg`;
  const out = path.join(OUT_DIR, `og-quick-${id}.jpg`);
  try {
    const res = await fetch(src);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const input = Buffer.from(await res.arrayBuffer());
    const meta = await sharp(input).metadata();
    await sharp(input)
      .resize(TARGET_W, TARGET_H, { fit: "cover", position: "centre" })
      .jpeg({ quality: 88, progressive: false, mozjpeg: false })
      .toFile(out);
    const outMeta = await sharp(out).metadata();
    const kb = Math.round(fs.statSync(out).size / 1024);
    console.log(
      `${id}\t${meta.width}x${meta.height} (prog ${meta.isProgressive}) -> ${outMeta.width}x${outMeta.height} (prog ${outMeta.isProgressive}) ${kb} KB`,
    );
  } catch (e) {
    console.error(`${id}\tFAIL ${e.message}`);
  }
}
