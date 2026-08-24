"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAnonKey, getSupabaseUrl, isSupabaseConfigured } from "@/lib/supabase/env";

let cached: SupabaseClient | null = null;

/** 瀏覽器端 Supabase client（Auth session 存 cookie） */
export function getSupabaseBrowser(): SupabaseClient | null {
  if (typeof window === "undefined") return null;
  if (!isSupabaseConfigured()) return null;
  if (cached) return cached;
  cached = createBrowserClient(getSupabaseUrl(), getSupabaseAnonKey());
  return cached;
}
