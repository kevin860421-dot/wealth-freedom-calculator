/** Supabase 專案 URL／金鑰（Auth + 未來 Realtime） */

export function getSupabaseUrl(): string {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    process.env.SUPABASE_URL?.trim() ||
    "";
  if (!url) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL 未設定");
  }
  return url;
}

export function getSupabaseAnonKey(): string {
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    process.env.SUPABASE_ANON_KEY?.trim() ||
    "";
  if (!key) {
    throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY 未設定");
  }
  return key;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    (process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
      process.env.SUPABASE_URL?.trim()) &&
      (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
        process.env.SUPABASE_ANON_KEY?.trim()),
  );
}

/** OAuth 回傳 URL（伺服器端；本機與 Vercel 各設一組） */
export function getAuthRedirectUrl(): string {
  const fromEnv =
    process.env.AUTH_REDIRECT_URL?.trim() ||
    process.env.NEXT_PUBLIC_AUTH_REDIRECT_URL?.trim();
  if (fromEnv) return fromEnv;

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    return `https://${vercel}/gamefi/auth/callback`;
  }

  return "http://localhost:3000/gamefi/auth/callback";
}

/** OAuth 回傳 URL（瀏覽器端 signInWithOAuth） */
export function getPublicAuthRedirectUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_AUTH_REDIRECT_URL?.trim();
  if (fromEnv) return fromEnv;

  if (typeof window !== "undefined") {
    return `${window.location.origin}/gamefi/auth/callback`;
  }

  return getAuthRedirectUrl();
}
