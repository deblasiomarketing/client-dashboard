import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser Supabase client for Client Components that need realtime
 * subscriptions or auth UI. Only ever the anon key. RLS still applies.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
