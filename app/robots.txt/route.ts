import { getSiteOrigin } from "@/lib/site-origin";

export const dynamic = "force-dynamic";

/** 正式站 /robots.txt。Metadata 檔 app/robots.ts 在現網回 404，改由這支直接回純文字。 */
export function GET() {
  const origin = getSiteOrigin();
  const body = [
    "User-Agent: *",
    "Allow: /",
    "Disallow: /gamefi/",
    "Disallow: /quick-11/excel-preview",
    "Disallow: /quick-11/exit-modal-preview",
    "Disallow: /quick-11/sim-reset",
    "",
    `Sitemap: ${origin}/sitemap.xml`,
    "",
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
