const DEFAULT_PRODUCTION_ORIGIN = "https://wealth-freedom-calculator.vercel.app";

/** 官網 origin（sitemap、JSON-LD、canonical、og:image 共用） */
export function getSiteOrigin(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (explicit) return explicit;

  // Production 勿用 VERCEL_URL（含 deployment hash，外部爬蟲常 401，og:image 會空白）
  if (process.env.VERCEL_ENV === "production") {
    const prodHost = process.env.VERCEL_PROJECT_PRODUCTION_URL?.replace(/\/$/, "");
    if (prodHost) return prodHost.startsWith("http") ? prodHost : `https://${prodHost}`;
    return DEFAULT_PRODUCTION_ORIGIN;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return "http://localhost:3000";
}

export function absoluteUrl(path: string, origin = getSiteOrigin()): string {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${origin}${path.startsWith("/") ? path : `/${path}`}`;
}
