/**
 * 直接執行 GameFi 健康診斷（無需 HTTP / dev server）
 * 用法：npm run check:gamefi-health
 */
import { runGamefiHealthCheck } from "@/lib/gamefi/health/diagnostics";
import { getPrisma } from "@/lib/db/client";

async function main(): Promise<void> {
  const report = await runGamefiHealthCheck();
  console.log(JSON.stringify(report, null, 2));
  if (report.status !== "healthy") {
    process.exit(1);
  }
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await getPrisma().$disconnect();
  });
