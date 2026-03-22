import { NextResponse } from "next/server";
import { getPublicStatsSnapshot, incrementEngagement, incrementPageView } from "@/lib/stats-store";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(getPublicStatsSnapshot());
}

export async function POST(req: Request) {
  let body: { action?: string } = {};
  try {
    body = (await req.json()) as { action?: string };
  } catch {
    /* ignore */
  }
  if (body.action === "pageview") {
    return NextResponse.json(incrementPageView());
  }
  if (body.action === "engage") {
    return NextResponse.json(incrementEngagement());
  }
  return NextResponse.json({ error: "unknown action" }, { status: 400 });
}
