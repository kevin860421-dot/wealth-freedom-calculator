/**
 * 啟動前：釋放常用埠、刪除 stale lock → next dev（:3000）
 * → :3004 反向代理至 :3000（同一實例，另開分頁方便對照／手機寬度測試）
 * 不自動開系統瀏覽器；請在 Cursor：Ctrl+Shift+P →「Tasks: Run Task」→「財富自由計算機：內嵌瀏覽器（桌機＋手機 連開）」。
 *
 * 注意：:3004 僅在「npm run dev」（本腳本）成功啟動代理後才有；單跑 next dev 或終端已關閉則 3004 會失敗。
 * 手機 RWD 與埠無關：內嵌瀏覽器載入 :3000 後拉窄面板即可；或執行「手機代理 :3004」工作。
 */
import http from "http";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
process.chdir(root);

const DEV_PORT = 3000;
const MOBILE_PROXY_PORT = 3004;
const PORTS_TO_FREE = [3000, 3001, 3002, 3003, 3004];

/** 終端機 OSC 8 超連結（Cursor / VS Code 內建終端通常可點擊） */
function termLink(url, visible) {
  if (!process.stdout.isTTY) {
    return `${visible} ${url}`;
  }
  return `\u001b]8;;${url}\u001b\\${visible}\u001b]8;;\u001b\\`;
}

let proxyServer = null;
let nextChild = null;
let readyPoll = null;
let shuttingDown = false;
/** 反向代理 :3004 是否已成功 listen（供開分頁與提示用） */
let mobileProxyOk = false;

function cleanupProxy() {
  if (proxyServer) {
    try {
      proxyServer.close();
    } catch {
      /* ignore */
    }
    proxyServer = null;
  }
}

function cleanupNext() {
  if (nextChild && !nextChild.killed) {
    try {
      nextChild.kill("SIGTERM");
    } catch {
      /* ignore */
    }
  }
}

function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  if (readyPoll) clearInterval(readyPoll);
  cleanupProxy();
  cleanupNext();
}

async function waitForDevReady() {
  const deadline = Date.now() + 120_000;
  return new Promise((resolve, reject) => {
    readyPoll = setInterval(async () => {
      if (Date.now() > deadline) {
        clearInterval(readyPoll);
        readyPoll = null;
        reject(new Error("Timed out waiting for Next.js on port " + DEV_PORT));
        return;
      }
      try {
        const r = await fetch(`http://127.0.0.1:${DEV_PORT}/`, { signal: AbortSignal.timeout(2000) });
        if (r.ok) {
          clearInterval(readyPoll);
          readyPoll = null;
          resolve();
        }
      } catch {
        /* still booting */
      }
    }, 400);
  });
}

async function startMobileProxy() {
  const { default: httpProxy } = await import("http-proxy");
  const proxy = httpProxy.createProxyServer({
    target: `http://127.0.0.1:${DEV_PORT}`,
    ws: true,
  });

  proxy.on("error", (err, _req, res) => {
    if (res && typeof res.writeHead === "function" && !res.headersSent) {
      res.writeHead(502, { "Content-Type": "text/plain; charset=utf-8" });
    }
    if (res && typeof res.end === "function") {
      res.end("Proxy error: " + (err?.message ?? String(err)));
    }
  });

  proxyServer = http.createServer((req, res) => {
    proxy.web(req, res);
  });

  proxyServer.on("upgrade", (req, socket, head) => {
    proxy.ws(req, socket, head);
  });

  await new Promise((resolve, reject) => {
    proxyServer.listen(MOBILE_PROXY_PORT, "127.0.0.1", (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  mobileProxyOk = true;
}

function printCursorPreviewHint() {
  const desktop = `http://127.0.0.1:${DEV_PORT}/`;
  const mobileHome = `http://127.0.0.1:${DEV_PORT}/?mobile=1`;
  const mobileProxy = `http://127.0.0.1:${MOBILE_PROXY_PORT}/?mobile=1`;
  const linkPage = `http://127.0.0.1:${DEV_PORT}/dev-links.html`;

  /** 供 .vscode/tasks.json 背景工作偵測（勿改字串） */
  console.log("[dev] __CURSOR_EMBED_PREVIEW_READY__");

  console.log("\n[dev] 點下面開預覽：");
  console.log(`  ${termLink(linkPage, "連結總表")}`);
  console.log(`  ${termLink(desktop, "桌機")}`);
  console.log(`  ${termLink(mobileHome, "手機")}`);
  if (mobileProxyOk) {
    console.log(`  ${termLink(mobileProxy, "手機·3004")}`);
  }
  console.log("");
}

async function main() {
  const { default: killPort } = await import("kill-port");

  for (const p of PORTS_TO_FREE) {
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
    } catch {
      /* ignore */
    }
  }

  const nextCli = path.join(root, "node_modules", "next", "dist", "bin", "next");
  const nextExtraArgs = process.argv.slice(2);
  nextChild = spawn(process.execPath, [nextCli, "dev", ...nextExtraArgs], {
    cwd: root,
    stdio: "inherit",
    env: process.env,
  });

  nextChild.on("exit", (code, signal) => {
    cleanupProxy();
    if (signal) process.exit(1);
    process.exit(code ?? 0);
  });

  process.on("SIGINT", () => {
    shutdown();
    process.exit(130);
  });
  process.on("SIGTERM", () => {
    shutdown();
    process.exit(143);
  });

  try {
    await waitForDevReady();
    try {
      await startMobileProxy();
    } catch (e) {
      mobileProxyOk = false;
      console.error(
        "\n[dev] 3004 代理啟動失敗（不影響 :3000）。請在 Cursor 用「內嵌 Simple Browser」載入 :3000 並拉窄面板測手機版。\n",
        e
      );
    }
    printCursorPreviewHint();
  } catch (e) {
    console.error(e);
    shutdown();
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
