/**
 * OAuth 回傳 URL（瀏覽器 signInWithOAuth 專用）。
 * 優先 NEXT_PUBLIC_AUTH_REDIRECT_URL / AUTH_REDIRECT_URL；
 * 若線上誤帶 localhost env，以目前 origin 覆寫，避免導回本機。
 */
import { getAuthRedirectUrl } from "@/lib/supabase/env";

const CALLBACK_PATH = "/gamefi/auth/callback";

function isLocalHost(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
}

function isProductionHost(hostname: string): boolean {
  return (
    hostname === "wealth-freedom-calculator.vercel.app" ||
    hostname.endsWith(".vercel.app")
  );
}

function buildCallbackUrl(origin: string): string {
  return `${origin.replace(/\/$/, "")}${CALLBACK_PATH}`;
}

/** Client / Server 皆可呼叫；OAuth 請在瀏覽器用此函式 */
export function getOAuthRedirectTo(): string {
  const fromPublic = process.env.NEXT_PUBLIC_AUTH_REDIRECT_URL?.trim();
  const fromServer = process.env.AUTH_REDIRECT_URL?.trim();
  const fromEnv = fromPublic || fromServer;

  if (typeof window !== "undefined") {
    const runtimeUrl = buildCallbackUrl(window.location.origin);
    const hostname = window.location.hostname;

    if (fromEnv) {
      try {
        const parsed = new URL(fromEnv);
        if (isLocalHost(parsed.hostname) && isProductionHost(hostname)) {
          console.warn(
            "[GameFi OAuth] 偵測到 production 環境卻設定 localhost redirect，已改用目前網域。",
          );
          return runtimeUrl;
        }
        return parsed.toString();
      } catch {
        return runtimeUrl;
      }
    }

    return runtimeUrl;
  }

  if (fromEnv) return fromEnv;
  return getAuthRedirectUrl();
}
