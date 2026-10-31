import { createBrowserClient } from "@supabase/ssr";
import { supabaseBrowserUrl, supabaseCookieOptions } from "./config";

export function createClient() {
  return createBrowserClient(
    supabaseBrowserUrl(),
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookieOptions: supabaseCookieOptions }
  );
}
