/**
 * 一鍵修復：結束占用 3000～3004 的程序、刪除 .next/dev/lock。
 * 若 3000 / 3004 都連不上、或出現 Unable to acquire lock，先執行：
 *   npm run dev:repair
 * 再執行：
 *   npm run dev
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const ports = [3000, 3001, 3002, 3003, 3004];

async function main() {
  const { default: killPort } = await import("kill-port");
  for (const p of ports) {
    try {
      await killPort(p);
    } catch {
      /* ignore */
    }
  }
  const lockPath = path.join(root, ".next", "dev", "lock");
  if (fs.existsSync(lockPath)) {
    try {
      fs.unlinkSync(lockPath);
      console.log("[dev:repair] 已刪除 .next/dev/lock");
    } catch (e) {
      console.error("[dev:repair] 無法刪除 lock（請關閉仍開著的 next dev 視窗後再試）:", e.message);
      process.exit(1);
    }
  } else {
    console.log("[dev:repair] 無 lock 檔（正常）");
  }
  console.log("[dev:repair] 完成。請在同一專案目錄執行：npm run dev");
  console.log("[dev:repair] 成功後請用終端機顯示的網址（多為 http://localhost:3000/）");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
