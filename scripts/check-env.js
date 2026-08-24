/**
 * 本機 GameFi 環境變數診斷（不輸出密碼）。
 * 用法：node scripts/check-env.js
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");

const REQUIRED = [
  {
    name: "DATABASE_URL",
    files: [".env"],
    validate: (v) =>
      /^postgresql:\/\/.+@.+\.supabase\.com:\d+\/\w+/.test(v) ||
      /^postgresql:\/\/.+@db\..+\.supabase\.co:\d+\/\w+/.test(v),
    hint: "postgresql://…@…pooler…:6543/postgres 或 db.*.supabase.co:5432",
  },
  {
    name: "DIRECT_URL",
    files: [".env"],
    validate: (v) =>
      /^postgresql:\/\/postgres:.+@db\..+\.supabase\.co:5432\/postgres/.test(v) ||
      /^postgresql:\/\/postgres\..+@.+\.pooler\.supabase\.com:5432\/postgres/.test(v),
    hint: "postgresql://postgres:…@db.<ref>.supabase.co:5432/postgres（或 session pooler :5432）",
  },
  {
    name: "NEXT_PUBLIC_SUPABASE_URL",
    files: [".env.local", ".env"],
    validate: (v) => /^https:\/\/[a-z0-9]+\.supabase\.co\/?$/.test(v),
    hint: "https://<project-ref>.supabase.co",
  },
  {
    name: "AUTH_REDIRECT_URL",
    files: [".env.local", ".env"],
    validate: (v) => /^https?:\/\/.+\/gamefi\/auth\/callback\/?$/.test(v),
    hint: "http://localhost:3000/gamefi/auth/callback（本機）",
  },
];

const RECOMMENDED = [
  {
    name: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    files: [".env.local", ".env"],
    validate: (v) => v.length >= 20,
    hint: "sb_publishable_… 或 JWT anon key",
  },
  {
    name: "NEXT_PUBLIC_AUTH_REDIRECT_URL",
    files: [".env.local", ".env"],
    validate: (v) => /^https?:\/\/.+\/gamefi\/auth\/callback\/?$/.test(v),
    hint: "瀏覽器 OAuth 用；通常與 AUTH_REDIRECT_URL 相同",
  },
];

function parseEnvFile(filePath) {
  const abs = path.join(ROOT, filePath);
  if (!fs.existsSync(abs)) return {};
  const out = {};
  for (const line of fs.readFileSync(abs, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!out[key]) out[key] = val;
  }
  return out;
}

function maskValue(name, value) {
  if (!value) return "(未設定)";
  if (name.includes("URL") && !name.includes("KEY")) {
    try {
      const u = new URL(value);
      if (u.password) u.password = "***";
      if (u.username) u.username = u.username.includes(".") ? "postgres.***" : "***";
      return u.toString();
    } catch {
      return "(格式無法解析)";
    }
  }
  if (name.includes("KEY") || name.includes("PASSWORD")) {
    return `${value.slice(0, 6)}…(${value.length} chars)`;
  }
  return value;
}

function checkEntry(entry, envMaps) {
  let value = process.env[entry.name]?.trim();
  let source = value ? "process.env" : null;

  if (!value) {
    for (const file of entry.files) {
      const fromFile = envMaps[file]?.[entry.name]?.trim();
      if (fromFile) {
        value = fromFile;
        source = file;
        break;
      }
    }
  }

  if (!value) {
    return { ok: false, message: `缺少（請寫入 ${entry.files.join(" 或 ")}）` };
  }

  if (!entry.validate(value)) {
    return {
      ok: false,
      message: `已設定但格式可疑（${entry.hint}）`,
      masked: maskValue(entry.name, value),
      source,
    };
  }

  return {
    ok: true,
    message: "OK",
    masked: maskValue(entry.name, value),
    source: source ?? "process.env",
  };
}

function main() {
  console.log("🔍 GameFi 環境變數診斷\n");

  const envMaps = {};
  for (const f of [".env", ".env.local"]) {
    envMaps[f] = parseEnvFile(f);
    console.log(
      `📄 ${f}: ${fs.existsSync(path.join(ROOT, f)) ? "存在" : "不存在"}`,
    );
  }
  console.log("");

  let failed = 0;

  console.log("── 必要變數 ──");
  for (const entry of REQUIRED) {
    const result = checkEntry(entry, envMaps);
    const icon = result.ok ? "✅" : "❌";
    console.log(`${icon} ${entry.name}: ${result.message}`);
    if (result.masked) {
      console.log(`   └─ 來源: ${result.source} · ${result.masked}`);
    }
    if (!result.ok) failed += 1;
  }

  console.log("\n── 建議變數 ──");
  for (const entry of RECOMMENDED) {
    const result = checkEntry(entry, envMaps);
    const icon = result.ok ? "✅" : "⚠️ ";
    console.log(`${icon} ${entry.name}: ${result.ok ? "OK" : result.message}`);
    if (result.masked) {
      console.log(`   └─ 來源: ${result.source} · ${result.masked}`);
    }
  }

  console.log("\n── Phase 1B 線上檢查清單 ──");
  console.log("• Vercel: NEXT_PUBLIC_SUPABASE_*、DATABASE_URL、DIRECT_URL、AUTH_REDIRECT_URL");
  console.log("• Supabase → Auth → URL Configuration → Redirect URLs");
  console.log("• Google Cloud → APIs & Services → Credentials → OAuth Client → Authorized redirect URIs");

  if (failed > 0) {
    console.log(`\n❌ ${failed} 項必要變數未通過。`);
    process.exit(1);
  }

  console.log("\n✅ 必要環境變數檢查通過。");
}

main();
