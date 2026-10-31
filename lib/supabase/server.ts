import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseServerUrl, supabaseCookieOptions } from "./config";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    supabaseServerUrl(),
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: supabaseCookieOptions,
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );
}
