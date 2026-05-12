import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const postsDir = path.join(__dirname, "../app/blog/posts");
const regPath = path.join(postsDir, "registry.ts");
const snipPath = path.join(postsDir, "_fire-seo-registry-snippet.txt");

let reg = fs.readFileSync(regPath, "utf8");
const snip = fs.readFileSync(snipPath, "utf8").trim();
if (reg.includes("tw-etf-dca-tax-dividend-checklist")) {
  console.log("registry already merged");
  process.exit(0);
}

const oldBlock = `export const BLOG_POST_REGISTRY: BlogPostRegistryEntry[] = [
  // ─────────────────────────────────────────────────────────
  // 實戰對決（19）～（30）：消費／投資／崩盤／退休路徑
  // ─────────────────────────────────────────────────────────`;

const newBlock = `export const BLOG_POST_REGISTRY: BlogPostRegistryEntry[] = [
  // ─────────────────────────────────────────────────────────
  // 財富試算筆記（1）～（50）：主試算／長尾 SEO（排程見各 publishAtIso）
  // ─────────────────────────────────────────────────────────
${snip}
  // ─────────────────────────────────────────────────────────
  // 實戰對決（19）～（30）：消費／投資／崩盤／退休路徑
  // ─────────────────────────────────────────────────────────`;

if (!reg.includes(oldBlock)) {
  console.error("needle not found");
  process.exit(1);
}
reg = reg.replace(oldBlock, newBlock);
fs.writeFileSync(regPath, reg);
console.log("registry merged");
