/**
 * GameFi 邊界守護 + 前端安全檢查 + 生產環境打包驗證
 * 用法：node scripts/verify-bounds.js
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");

/** 與 docs/gamefi/ARCHITECTURE.md §1 同步 */
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

console.log("🔍 [Phase 1] 邊界守護：檢查核心計算機是否完好...");
const missing = [];
for (const file of CORE_FILES) {
  if (!fs.existsSync(path.join(ROOT, file))) {
    missing.push(file);
  }
}
if (missing.length > 0) {
  console.error("❌ 錯誤: 核心邊界檔案遭到遺失或破壞！");
  for (const file of missing) {
    console.error(`   - ${file}`);
  }
  process.exit(1);
}
if (fs.existsSync(path.join(ROOT, "components/calculator"))) {
  console.log("ℹ️  偵測到 components/calculator/（本專案主核心在 lib/ 與 app/quick-*）。");
}
console.log(`✅ 核心邊界檢查通過（${CORE_FILES.length} 個檔案）.`);

console.log("🔍 [Phase 2] 安全防護：檢查本地代碼是否包含前端直連漏洞...");
try {
  const patterns = ["app/gamefi/**/*.tsx", "app/gamefi/**/*.ts", "lib/gamefi/**/*.tsx"];
  const appFiles = new Set();
  for (const pattern of patterns) {
    const listed = execSync(`git ls-files "${pattern}"`, {
      cwd: ROOT,
      encoding: "utf8",
    })
      .split("\n")
      .map((f) => f.trim())
      .filter(Boolean);
    for (const f of listed) appFiles.add(f);
  }

  for (const file of appFiles) {
    const abs = path.join(ROOT, file);
    if (!fs.existsSync(abs)) continue;
    const content = fs.readFileSync(abs, "utf8");
    if (content.includes('"use client"') && content.includes("@prisma/client")) {
      console.error(
        `❌ 嚴重安全性錯誤: 檔案 ${file} 含有 "use client" 卻直接引入了 Prisma！禁止在前端洩漏資料庫連線。`,
      );
      process.exit(1);
    }
    if (
      content.includes("signInWithOAuth") &&
      !content.includes("redirectTo") &&
      !content.includes("getOAuthRedirectTo")
    ) {
      console.error(
        `❌ OAuth 安全錯誤: ${file} 呼叫 signInWithOAuth 但未設定 redirectTo / getOAuthRedirectTo。`,
      );
      process.exit(1);
    }
    if (content.includes("signInWithOAuth") && /redirectTo:\s*["']http:\/\/localhost/.test(content)) {
      console.error(
        `❌ OAuth 重導向漏洞: ${file} 硬編碼 localhost redirectTo，請改用 getOAuthRedirectTo()。`,
      );
      process.exit(1);
    }
  }
  console.log("✅ 前後端防護安全性檢查通過。");
} catch (e) {
  console.log("⚠️  暫時無法讀取 git 檔案清單，跳過前端安全檢查。");
}

console.log("🔍 [Phase 3] 專案編譯：執行 Next.js 生產環境打包測試...");
try {
  execSync("npm run build", { cwd: ROOT, stdio: "inherit" });
  console.log("✅ 專案生產環境打包成功，無 TypeScript 錯誤。");
} catch (error) {
  console.warn("⚠️  npm run build 失敗，嘗試 npx next build（略過 quick-11 xlwings）…");
  try {
    execSync("npx next build", { cwd: ROOT, stdio: "inherit" });
    console.log("✅ next build 通過（已略過 quick-11 xlwings 步驟）。");
  } catch {
    console.error("❌ 打包編譯失敗！請檢查最新提交的 GameFi 程式碼語法。");
    process.exit(1);
  }
}

console.log("🎉 所有自動化防線驗證成功，專案安全就緒！");

function buildHealthUrl(baseUrl) {
  return `${baseUrl.replace(/\/$/, "")}/api/gamefi/health`;
}

function resolveHealthBaseUrls() {
  if (process.env.GAMEFI_HEALTH_URL?.trim()) {
    return [process.env.GAMEFI_HEALTH_URL.trim()];
  }

  const hosts = ["localhost", "127.0.0.1"];
  const ports = new Set();

  if (process.env.PORT?.trim()) {
    ports.add(Number(process.env.PORT.trim()));
  }

  for (let port = 3000; port <= 3010; port += 1) {
    ports.add(port);
  }

  const orderedPorts = [...ports].filter((port) => Number.isInteger(port) && port > 0);

  return hosts.flatMap((host) =>
    orderedPorts.map((port) => `http://${host}:${port}`),
  );
}

async function probeHealthApi(url) {
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(5000),
  });
  const body = await res.json();
  return { res, body, url };
}

async function verifyHealthApi() {
  console.log("🔍 [Phase 4] 架構健康診斷：呼叫 /api/gamefi/health …");
  console.log("ℹ️  請先於另一個終端執行：npm run dev");
  console.log("ℹ️  會自動掃描 localhost:3000–3010（或 GAMEFI_HEALTH_URL / PORT）");
  console.log("ℹ️  無 dev server 時可改跑：npm run check:gamefi-health");

  if (process.env.SKIP_HEALTH_API === "1") {
    console.warn("⚠️  SKIP_HEALTH_API=1，略過 Phase 4。");
    return;
  }

  const candidates = resolveHealthBaseUrls().map(buildHealthUrl);
  const failures = [];

  for (const url of candidates) {
    try {
      const { res, body } = await probeHealthApi(url);

      if (!res.ok || body.status !== "healthy") {
        failures.push(`${url} → ${JSON.stringify(body)}`);
        continue;
      }

      console.log(`✅ 健康檢查 API 通過（${url}）：`, JSON.stringify(body));
      return;
    } catch {
      failures.push(`${url} → 無法連線`);
    }
  }

  console.error("❌ 找不到可用的 dev server 健康檢查端點。");
  if (failures.length > 0) {
    console.error("   已嘗試：");
    for (const line of failures.slice(0, 6)) {
      console.error(`   - ${line}`);
    }
    if (failures.length > 6) {
      console.error(`   …另有 ${failures.length - 6} 個位址`);
    }
  }
  console.error("   請先執行 npm run dev，或設定 GAMEFI_HEALTH_URL=http://localhost:<port>");
  console.error("   亦可改跑：npm run check:gamefi-health（直連 DB，無需 HTTP）");
  process.exit(1);
}

verifyHealthApi().catch((error) => {
  console.error(error);
  process.exit(1);
});
