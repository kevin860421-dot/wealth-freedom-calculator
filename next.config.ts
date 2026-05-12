import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  /** 供 client 讀取（mini-blog 排程預覽等）；正式 production build 會內嵌為 `production`。 */
  env: {
    NEXT_PUBLIC_VERCEL_ENV: process.env.VERCEL_ENV ?? "",
  },
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
};

export default nextConfig;
