import { createClient } from "@supabase/supabase-js";
import { supabaseServerUrl } from "./config";

/** Client con service_role (bypassa RLS). Solo lato server; null se la chiave manca. */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return null;
  return createClient(supabaseServerUrl(), key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
