"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase/browser";
import { getPublicAuthRedirectUrl, isSupabaseConfigured } from "@/lib/supabase/env";

type MeResponse = {
  user: {
    id: string;
    email: string | null;
    displayName: string;
    authProvider: string | null;
  };
  wallet: {
    id: string;
    gems: number;
    status: string;
  };
};

type LoadState =
  | { status: "loading" }
  | { status: "guest" }
  | { status: "authenticated"; data: MeResponse }
  | { status: "error"; message: string };

function GoogleMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

export function GamefiWalletShell() {
  const searchParams = useSearchParams();
  const authError = searchParams.get("error");
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [authBusy, setAuthBusy] = useState(false);

  const loadProfile = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setState({
        status: "error",
        message: "Supabase 尚未設定（NEXT_PUBLIC_SUPABASE_URL / ANON_KEY）",
      });
      return;
    }

    const supabase = getSupabaseBrowser();
    if (!supabase) {
      setState({ status: "guest" });
      return;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      setState({ status: "guest" });
      return;
    }

    try {
      const res = await fetch("/api/gamefi/me", { credentials: "include" });
      if (res.status === 401) {
        setState({ status: "guest" });
        return;
      }
      if (!res.ok) {
        throw new Error(`API ${res.status}`);
      }
      const data = (await res.json()) as MeResponse;
      setState({ status: "authenticated", data });
    } catch (err) {
      setState({
        status: "error",
        message: err instanceof Error ? err.message : "載入失敗",
      });
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    if (!supabase) return;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void loadProfile();
    });

    return () => subscription.unsubscribe();
  }, [loadProfile]);

  async function handleGoogleSignIn() {
    const supabase = getSupabaseBrowser();
    if (!supabase) return;

    setAuthBusy(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: getPublicAuthRedirectUrl(),
          queryParams: { prompt: "select_account" },
        },
      });
      if (error) {
        setState({ status: "error", message: error.message });
      }
    } finally {
      setAuthBusy(false);
    }
  }

  async function handleSignOut() {
    const supabase = getSupabaseBrowser();
    if (!supabase) return;

    setAuthBusy(true);
    try {
      await supabase.auth.signOut();
      setState({ status: "guest" });
    } finally {
      setAuthBusy(false);
    }
  }

  return (
    <main
      className="mx-auto flex min-h-[70vh] max-w-lg flex-col justify-center px-4 py-12"
      style={{ color: "var(--morandi-text-body)" }}
    >
      <p
        className="mb-2 text-sm font-medium tracking-wide"
        style={{ color: "var(--morandi-text-soft)" }}
      >
        GameFi · Phase 1B
      </p>
      <h1
        className="mb-2 text-2xl font-semibold tracking-tight sm:text-3xl"
        style={{ color: "var(--morandi-text)" }}
      >
        我的寶石錢包
      </h1>
      <p className="mb-8 text-sm leading-relaxed" style={{ color: "var(--morandi-text-soft)" }}>
        使用 Google 登入後，系統會為你建立專屬錢包並贈送 1000 顆初始寶石（僅供試玩）。
      </p>

      <div
        className="rounded-2xl border p-6 shadow-lg backdrop-blur-sm"
        style={{
          borderColor: "var(--morandi-border)",
          backgroundColor: "var(--morandi-surface)",
        }}
      >
        {state.status === "loading" && (
          <p className="text-center text-sm" style={{ color: "var(--morandi-text-soft)" }}>
            載入中…
          </p>
        )}

        {state.status === "error" && (
          <p className="text-center text-sm" style={{ color: "#d4a5a5" }}>
            {state.message}
          </p>
        )}

        {authError && state.status !== "authenticated" && (
          <p
            className="mb-4 rounded-lg px-3 py-2 text-sm"
            style={{
              backgroundColor: "rgba(180, 100, 100, 0.15)",
              color: "#e8c4c4",
            }}
          >
            登入失敗：{decodeURIComponent(authError)}
          </p>
        )}

        {state.status === "guest" && (
          <div className="flex flex-col items-stretch gap-4">
            <button
              type="button"
              disabled={authBusy}
              onClick={() => void handleGoogleSignIn()}
              className="flex items-center justify-center gap-3 rounded-xl px-5 py-3.5 text-sm font-semibold transition hover:brightness-110 disabled:opacity-60"
              style={{
                backgroundColor: "var(--morandi-text)",
                color: "var(--morandi-void)",
              }}
            >
              <GoogleMark />
              {authBusy ? "導向 Google…" : "使用 Google 帳號一鍵登入"}
            </button>
          </div>
        )}

        {state.status === "authenticated" && (
          <div className="space-y-5">
            <div>
              <p className="text-xs uppercase tracking-wider" style={{ color: "var(--morandi-text-muted)" }}>
                暱稱
              </p>
              <p className="mt-1 text-lg font-medium" style={{ color: "var(--morandi-text)" }}>
                {state.data.user.displayName}
              </p>
            </div>
            {state.data.user.email && (
              <div>
                <p className="text-xs uppercase tracking-wider" style={{ color: "var(--morandi-text-muted)" }}>
                  Email
                </p>
                <p className="mt-1 text-sm" style={{ color: "var(--morandi-text-body)" }}>
                  {state.data.user.email}
                </p>
              </div>
            )}
            <div
              className="rounded-xl border px-4 py-4"
              style={{
                borderColor: "var(--morandi-border)",
                backgroundColor: "var(--morandi-bg-mid)",
              }}
            >
              <p className="text-xs uppercase tracking-wider" style={{ color: "var(--morandi-text-muted)" }}>
                寶石餘額 · Gems Balance
              </p>
              <p
                className="mt-2 text-3xl font-semibold tabular-nums"
                style={{ color: "var(--morandi-highlight)" }}
              >
                {state.data.wallet.gems.toLocaleString("zh-TW")}
              </p>
            </div>
            <button
              type="button"
              disabled={authBusy}
              onClick={() => void handleSignOut()}
              className="w-full rounded-xl border px-4 py-2.5 text-sm transition hover:brightness-110 disabled:opacity-60"
              style={{
                borderColor: "var(--morandi-border)",
                color: "var(--morandi-text-soft)",
              }}
            >
              登出
            </button>
          </div>
        )}
      </div>

      <p className="mt-8 text-center text-xs" style={{ color: "var(--morandi-text-muted)" }}>
        <Link href="/" className="underline-offset-2 hover:underline">
          ← 返回財富自由計算機首頁
        </Link>
      </p>
    </main>
  );
}
