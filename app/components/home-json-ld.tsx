import { buildHomeJsonLd } from "@/lib/home-json-ld";
import { getSiteOrigin } from "@/lib/site-origin";

export function HomeJsonLd() {
  const jsonLd = buildHomeJsonLd(getSiteOrigin());
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
    />
  );
}
