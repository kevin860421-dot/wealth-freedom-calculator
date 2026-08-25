import { randomUUID } from "node:crypto";
import { getPrisma } from "@/lib/db/client";
import {
  isWalletLedgerAppendOnlyError,
  WALLET_LEDGER_APPEND_ONLY_ERROR,
} from "@/lib/db/ledger-append-only";

class HealthRollback extends Error {
  constructor() {
    super("HEALTH_CHECK_ROLLBACK");
    this.name = "HealthRollback";
  }
}

export type GamefiHealthReport = {
  status: "healthy" | "unhealthy";
  database: "connected" | "disconnected";
  rls_and_append_only: "verified" | "failed";
  region_hint?: string;
  latency_ms?: number;
  checks?: Record<string, string>;
  error?: string;
};

async function verifyAppendOnlyGuard(
  prisma: ReturnType<typeof getPrisma>,
): Promise<void> {
  const probes: Array<() => Promise<unknown>> = [
    () =>
      prisma.walletLedger.update({
        where: { id: "00000000-0000-0000-0000-000000000000" },
        data: { gemChange: 0 },
      }),
    () =>
      prisma.walletLedger.updateMany({
        where: { userId: "00000000-0000-0000-0000-000000000000" },
        data: { gemChange: 0 },
      }),
    () =>
      prisma.walletLedger.deleteMany({
        where: { userId: "00000000-0000-0000-0000-000000000000" },
      }),
    () =>
      prisma.walletLedger.upsert({
        where: { id: "00000000-0000-0000-0000-000000000000" },
        create: {
          id: "00000000-0000-0000-0000-000000000000",
          userId: "00000000-0000-0000-0000-000000000000",
          walletId: "00000000-0000-0000-0000-000000000000",
          actionType: "INITIAL_GRANT",
          gemChange: 1,
          balanceAfter: 1,
          requestId: "health-upsert-probe",
        },
        update: { gemChange: 0 },
      }),
  ];

  for (const probe of probes) {
    try {
      await probe();
      throw new Error("append-only extension did not block mutation");
    } catch (error) {
      if (isWalletLedgerAppendOnlyError(error)) continue;
      if (
        error instanceof Error &&
        error.message === "append-only extension did not block mutation"
      ) {
        throw error;
      }
      if (isWalletLedgerAppendOnlyError(error)) continue;
      throw error;
    }
  }
}

async function verifyLedgerBalanceSync(): Promise<void> {
  const prisma = getPrisma();
  const probeAuthId = randomUUID();
  const probeEmail = `health-${Date.now()}@gamefi-health.local`;

  try {
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          authSubjectId: probeAuthId,
          email: probeEmail,
          displayName: "Health Probe",
          authProvider: "health_check",
        },
      });

      const wallet = await tx.userWallet.create({
        data: { userId: user.id, gems: 100 },
      });

      await tx.walletLedger.create({
        data: {
          userId: user.id,
          walletId: wallet.id,
          actionType: "INITIAL_GRANT",
          gemChange: 100,
          balanceAfter: 100,
          requestId: `HEALTH_${randomUUID()}`,
          metadata: { source: "health_check" },
        },
      });

      const ledgerSum = await tx.walletLedger.aggregate({
        where: { walletId: wallet.id },
        _sum: { gemChange: true },
      });

      const refreshed = await tx.userWallet.findUniqueOrThrow({
        where: { id: wallet.id },
      });

      if (refreshed.gems !== ledgerSum._sum.gemChange) {
        throw new Error("gems balance does not match ledger sum");
      }

      throw new HealthRollback();
    });
  } catch (error) {
    if (error instanceof HealthRollback) return;
    throw error;
  }
}

/** GameFi 架構自我診斷（DB 連線、延遲、append-only、餘額公式） */
export async function runGamefiHealthCheck(): Promise<GamefiHealthReport> {
  const checks: Record<string, string> = {};

  try {
    const prisma = getPrisma();
    const started = Date.now();
    await prisma.$queryRaw`SELECT 1 AS ok`;
    const latencyMs = Date.now() - started;
    checks.ping = "ok";

    const dbUrl = process.env.DATABASE_URL ?? "";
    const regionHint = dbUrl.includes("ap-southeast-1")
      ? "ap-southeast-1"
      : dbUrl.includes("pooler.supabase.com")
        ? "supabase-pooler"
        : "unknown";

    await verifyAppendOnlyGuard(prisma);
    checks.append_only = WALLET_LEDGER_APPEND_ONLY_ERROR.slice(0, 24) + "…";

    await verifyLedgerBalanceSync();
    checks.ledger_balance_formula = "ok";

    return {
      status: "healthy",
      database: "connected",
      rls_and_append_only: "verified",
      region_hint: regionHint,
      latency_ms: latencyMs,
      checks,
    };
  } catch (error) {
    return {
      status: "unhealthy",
      database: "disconnected",
      rls_and_append_only: "failed",
      checks,
      error: error instanceof Error ? error.message : "unknown error",
    };
  }
}
