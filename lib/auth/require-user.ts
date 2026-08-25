import type { User as SupabaseAuthUser } from "@supabase/supabase-js";
import type { User, UserWallet } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { getPrisma, type PrismaTx } from "@/lib/db/client";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** 新使用者註冊時一次性發放的 Gems（須同步寫入 WalletLedger INITIAL_GRANT） */
export const INITIAL_WALLET_GEMS = 1000;

export const INITIAL_GRANT_REQUEST_ID = "INITIAL_GRANT";

export class AuthRequiredError extends Error {
  readonly status = 401;

  constructor(message = "需要登入") {
    super(message);
    this.name = "AuthRequiredError";
  }
}

export type AuthenticatedSession = {
  authUser: SupabaseAuthUser;
  user: User;
  wallet: UserWallet;
};

function resolveAuthProvider(authUser: SupabaseAuthUser): string | null {
  const provider = authUser.app_metadata?.provider;
  if (typeof provider === "string" && provider.trim()) return provider.trim();
  if (authUser.email) return "email";
  return null;
}

function resolveDisplayName(authUser: SupabaseAuthUser): string {
  const meta = authUser.user_metadata;
  const fromMeta =
    (typeof meta?.full_name === "string" && meta.full_name) ||
    (typeof meta?.name === "string" && meta.name) ||
    "";
  return fromMeta.trim() || authUser.email?.split("@")[0]?.trim() || "使用者";
}

/**
 * 建立 User + UserWallet(1000) + WalletLedger(INITIAL_GRANT +1000)。
 * 單一 transaction；禁止僅 UPDATE gems 無 ledger。
 */
export async function provisionUserWithWallet(
  authUser: SupabaseAuthUser,
  tx?: PrismaTx,
): Promise<{ user: User; wallet: UserWallet }> {
  const run = async (client: PrismaTx) => {
    const user = await client.user.create({
      data: {
        authSubjectId: authUser.id,
        email: authUser.email ?? null,
        displayName: resolveDisplayName(authUser),
        authProvider: resolveAuthProvider(authUser),
      },
    });

    const wallet = await client.userWallet.create({
      data: {
        userId: user.id,
        gems: INITIAL_WALLET_GEMS,
      },
    });

    await client.walletLedger.create({
      data: {
        userId: user.id,
        walletId: wallet.id,
        actionType: "INITIAL_GRANT",
        gemChange: INITIAL_WALLET_GEMS,
        balanceAfter: INITIAL_WALLET_GEMS,
        requestId: INITIAL_GRANT_REQUEST_ID,
        metadata: { source: "registration" },
      },
    });

    return { user, wallet };
  };

  if (tx) return run(tx);
  return getPrisma().$transaction(run);
}

/**
 * 依 Supabase auth.users.id 取得或建立 Application User（含錢包與初始 ledger）。
 */
export async function ensureApplicationUser(
  authUser: SupabaseAuthUser,
): Promise<AuthenticatedSession> {
  const prisma = getPrisma();

  const existing = await prisma.user.findUnique({
    where: { authSubjectId: authUser.id },
    include: { wallet: true },
  });

  if (existing?.wallet) {
    return { authUser, user: existing, wallet: existing.wallet };
  }

  if (existing && !existing.wallet) {
    const wallet = await prisma.$transaction(async (tx) => {
      const created = await tx.userWallet.create({
        data: {
          userId: existing.id,
          gems: INITIAL_WALLET_GEMS,
        },
      });
      await tx.walletLedger.create({
        data: {
          userId: existing.id,
          walletId: created.id,
          actionType: "INITIAL_GRANT",
          gemChange: INITIAL_WALLET_GEMS,
          balanceAfter: INITIAL_WALLET_GEMS,
          requestId: INITIAL_GRANT_REQUEST_ID,
          metadata: { source: "wallet_backfill" },
        },
      });
      return created;
    });
    return { authUser, user: existing, wallet };
  }

  try {
    const { user, wallet } = await provisionUserWithWallet(authUser);
    return { authUser, user, wallet };
  } catch (err) {
    if (
      err instanceof PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      const raced = await prisma.user.findUnique({
        where: { authSubjectId: authUser.id },
        include: { wallet: true },
      });
      if (raced?.wallet) {
        return { authUser, user: raced, wallet: raced.wallet };
      }
    }
    throw err;
  }
}

/**
 * Server API 唯一信任的身分來源：Supabase session → auth.users.id → Application User。
 * 禁止信任 body.userId / query.uid。
 */
export async function requireUser(): Promise<AuthenticatedSession> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user: authUser },
    error,
  } = await supabase.auth.getUser();

  if (error || !authUser) {
    throw new AuthRequiredError();
  }

  return ensureApplicationUser(authUser);
}
