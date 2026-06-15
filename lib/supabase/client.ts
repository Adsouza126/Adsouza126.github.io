"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase client for use in Client Components (runs in the browser).
 *
 * We intentionally don't pass a generated `Database` generic here. Query
 * results are typed at each call site via our hand-written domain types in
 * `lib/types.ts`, which keeps embedded-relation selects ergonomic.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
