import { NextResponse } from "next/server";
import { fetchTaiexFromTwse } from "@/lib/quick10-taiex-fetch";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

let cachedQuote: Awaited<ReturnType<typeof fetchTaiexFromTwse>> | null = null;
let cachedAtMs = 0;
const SERVER_CACHE_MS = 30 * 60 * 1000;

export async function GET() {
  const now = Date.now();
  if (cachedQuote && now - cachedAtMs < SERVER_CACHE_MS) {
    return NextResponse.json(cachedQuote, {
      headers: { "Cache-Control": "private, max-age=300" },
    });
  }
  const quote = await fetchTaiexFromTwse();
  cachedQuote = quote;
  cachedAtMs = now;
  return NextResponse.json(quote, {
    headers: { "Cache-Control": "private, max-age=300" },
  });
}
