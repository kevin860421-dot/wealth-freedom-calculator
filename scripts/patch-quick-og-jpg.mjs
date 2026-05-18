import sharp from "sharp";
import fs from "fs";
import path from "path";

const root = path.resolve(import.meta.dirname, "..");

for (let n = 1; n <= 12; n++) {
  const layoutPath = path.join(root, "app", `quick-${n}`, "layout.tsx");
  const jpgPath = path.join(root, "public", `og-quick-${n}.jpg`);
  const meta = await sharp(jpgPath).metadata();
  let text = fs.readFileSync(layoutPath, "utf8");
  text = text.replace(/\/og-quick-\d+\.(png|jpg)/g, `/og-quick-${n}.jpg`);
  if (/width:\s*\d+/.test(text)) {
    text = text.replace(/width:\s*\d+,\s*\n\s*height:\s*\d+,/, `width: ${meta.width},\n        height: ${meta.height},`);
  }
  fs.writeFileSync(layoutPath, text);
  const kb = Math.round(fs.statSync(jpgPath).size / 1024);
  console.log(`${n}\t${meta.width}x${meta.height}\t${kb} KB`);
}
