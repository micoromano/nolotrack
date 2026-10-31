-- =============================================================================
-- 990 — Privilegi per i ruoli API (PostgREST)
-- =============================================================================
-- anon          → nessun accesso ai dati (le pagine pubbliche non leggono il DB)
-- authenticated → CRUD, filtrato dalle policy RLS
-- service_role  → tutto, bypassa RLS (webhook WhatsApp, invito utenti, script admin)
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

REVOKE ALL ON ALL TABLES    IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES    IN SCHEMA public TO authenticated, service_role;
GRANT USAGE, SELECT                  ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.is_admin()        FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.is_admin()        TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- Aggiorna la cache dello schema di PostgREST (ignorato se PostgREST non c'è)
NOTIFY pgrst, 'reload schema';
