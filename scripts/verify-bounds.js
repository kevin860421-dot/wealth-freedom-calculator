/**
 * GameFi 邊界守護：確認計算機核心檔案存在，且專案可通過型別檢查（可選完整 build）。
 *
 * 用法：
 *   node scripts/verify-bounds.js
 *   VERIFY_FULL_BUILD=1 node scripts/verify-bounds.js
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");

/** 與 docs/gamefi/ARCHITECTURE.md §1 同步：禁止 GameFi 改動的核心檔案 */
const CORE_FILES = [
  "app/page.tsx",
  "app/home-client-page.tsx",
  "lib/home-simulation-engine.ts",
  "lib/home-simulation.worker.ts",
  "lib/calculator-persistence.ts",
  "lib/table-calculator.ts",
  "lib/dividend-tax-sandbox.ts",
  "lib/home-tax-nhi-shared.ts",
  "app/quick-1/logic.ts",
  "app/quick-2/logic.ts",
  "app/quick-3/logic.ts",
  "app/quick-4/logic.ts",
  "app/quick-5/logic.ts",
  "app/quick-6/logic.ts",
  "app/quick-7/logic.ts",
  "app/quick-8/logic.ts",
  "app/quick-9/logic.ts",
  "app/quick-10/logic.ts",
  "app/quick-11/logic.ts",
  "app/quick-12/logic.ts",
];

function assertCoreFilesExist() {
  console.log("🔍 [Phase 1] 檢查計算機核心邊界…");
  const missing = [];
  for (const rel of CORE_FILES) {
    const abs = path.join(ROOT, rel);
    if (!fs.existsSync(abs)) {
      missing.push(rel);
    }
  }
  if (missing.length > 0) {
    console.error("❌ 核心檔案遺失：");
    for (const file of missing) {
      console.error(`   - ${file}`);
    }
    process.exit(1);
  }
  console.log(`✅ 核心邊界完好（${CORE_FILES.length} 個檔案存在）。`);
}

function runTypecheck() {
  console.log("🔍 [Phase 2] 執行 TypeScript 型別檢查…");
  try {
    execSync("npm run typecheck", { cwd: ROOT, stdio: "inherit" });
    console.log("✅ 型別檢查通過。");
  } catch {
    console.error("❌ 型別檢查失敗！請檢查 GameFi 新增程式碼。");
    process.exit(1);
  }
}

function runFullBuild() {
  console.log("🔍 [Phase 3] 執行 Next.js 完整編譯（VERIFY_FULL_BUILD=1）…");
  try {
    execSync("npm run build", { cwd: ROOT, stdio: "inherit" });
    console.log("✅ 專案編譯成功。");
  } catch {
    console.error("❌ 編譯失敗！");
    process.exit(1);
  }
}

assertCoreFilesExist();
runTypecheck();
if (process.env.VERIFY_FULL_BUILD === "1") {
  runFullBuild();
} else {
  console.log(
    "ℹ️  略過完整 build（本機預設僅 typecheck）。CI 或部署前請設 VERIFY_FULL_BUILD=1。",
  );
}
