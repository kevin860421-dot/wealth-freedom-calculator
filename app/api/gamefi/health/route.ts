import { NextResponse } from "next/server";
import { runGamefiHealthCheck } from "@/lib/gamefi/health/diagnostics";

export const dynamic = "force-dynamic";

function isHealthAuthorized(request: Request): boolean {
  if (process.env.NODE_ENV === "development") {
    return true;
  }

  const secret = process.env.GAMEFI_HEALTH_SECRET?.trim();
  if (!secret) {
    return false;
  }

  const headerSecret = request.headers.get("x-gamefi-health-secret");
  const querySecret = new URL(request.url).searchParams.get("secret");
  return headerSecret === secret || querySecret === secret;
}

/** GameFi 架構健康診斷（development 或 GAMEFI_HEALTH_SECRET） */
export async function GET(request: Request) {
  if (!isHealthAuthorized(request)) {
    return NextResponse.json(
      {
        status: "forbidden",
        error: "Health check requires development mode or GAMEFI_HEALTH_SECRET",
      },
      { status: 403 },
    );
  }

  const report = await runGamefiHealthCheck();

  if (report.status !== "healthy") {
    return NextResponse.json(report, { status: 503 });
  }

  return NextResponse.json({
    status: report.status,
    database: report.database,
    rls_and_append_only: report.rls_and_append_only,
    region_hint: report.region_hint,
    latency_ms: report.latency_ms,
    checks: report.checks,
  });
}
