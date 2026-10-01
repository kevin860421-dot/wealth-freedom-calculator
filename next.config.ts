import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";
import path from "path";

/**
 * 各大部落格預覽只用 `page.dev.tsx`。
 * Next 在 production build（含 Vercel preview）不把 `.dev.tsx` 當頁面，路由不會進部署產物。
 * 這是 Next.js 討論串 #29514 的做法：開發伺服器才註冊 dev-only pages。
 * 執行期 if 擋不住「程式已經被打包」；編譯期不收錄才是隔離。
 */
const pageExtensions = ["ts", "tsx", "js", "jsx"];

export default function nextConfig(phase: string): NextConfig {
  const devServer = phase === PHASE_DEVELOPMENT_SERVER;
  return {
    /** 供 client 讀取（mini-blog 排程預覽等）；正式 production build 會內嵌為 `production`。 */
    env: {
      NEXT_PUBLIC_VERCEL_ENV: process.env.VERCEL_ENV ?? "",
    },
    pageExtensions: devServer ? [...pageExtensions, "dev.tsx"] : pageExtensions,
    /**
     * React Compiler 會明顯加重 dev 編譯（尤其像 postflow/library 這種超大 client page）。
     * 僅在 NODE_ENV === "development" 時關閉；`next build` 等其餘情況維持開啟。
     */
    reactCompiler: process.env.NODE_ENV !== "development",
    /**
     * 父資料夾 `01-Financial-freedom` 另有 package-lock.json 時，Next 會誤判 workspace 根目錄。
     * 指定為「執行指令時的專案目錄」（請在專案根目錄執行 npm run dev / build）。
     * @see https://nextjs.org/docs/app/api-reference/config/next-config-js/output#caveats
     */
    outputFileTracingRoot: path.resolve(process.cwd()),
    allowedDevOrigins: ["127.0.0.1", "localhost"],
    async headers() {
      if (!devServer) return [];
      return [
        {
          source: "/postflow/outlet/:path*",
          headers: [
            { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
            { key: "Cache-Control", value: "private, no-store" },
          ],
        },
      ];
    },
  };
}
