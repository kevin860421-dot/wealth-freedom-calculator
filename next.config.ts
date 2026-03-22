import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  reactCompiler: true,
  /**
   * 父資料夾 `01-Financial-freedom` 另有 package-lock.json 時，Next 會誤判 workspace 根目錄。
   * 指定為「執行指令時的專案目錄」（請在專案根目錄執行 npm run dev / build）。
   * @see https://nextjs.org/docs/app/api-reference/config/next-config-js/output#caveats
   */
  outputFileTracingRoot: path.resolve(process.cwd()),
};

export default nextConfig;
