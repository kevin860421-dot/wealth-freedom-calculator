import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** Supabase OAuth（Google）授權碼交換 Session，成功後導回 /gamefi */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/gamefi";
  const origin = requestUrl.origin;

  if (!code) {
    return NextResponse.redirect(
      `${origin}/gamefi?error=${encodeURIComponent("missing_code")}`,
    );
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      `${origin}/gamefi?error=${encodeURIComponent(error.message)}`,
    );
  }

  const safeNext = next.startsWith("/gamefi") ? next : "/gamefi";
  return NextResponse.redirect(`${origin}${safeNext}`);
}
