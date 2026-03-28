/**
 * 刪除 .next（清除 Turbopack／建置快取）。若仍見 ChunkLoadError 或 (stale)，先執行後再 npm run dev。
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const nextDir = path.join(root, ".next");

if (fs.existsSync(nextDir)) {
  fs.rmSync(nextDir, { recursive: true, force: true });
  console.log("[dev:clean] 已刪除 .next");
} else {
  console.log("[dev:clean] 無 .next 目錄");
}
