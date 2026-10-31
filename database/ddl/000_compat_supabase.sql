-- =============================================================================
-- 000 — Compatibilità Supabase (ruoli API, schema auth, auth.uid())
-- =============================================================================
-- Su Supabase (cloud o immagine supabase/postgres del docker-compose) tutto
-- questo esiste già e il file NON fa nulla.
-- Su un PostgreSQL "nudo" (>= 14) crea il minimo indispensabile perché gli
-- script successivi (FK verso auth.users, policy RLS con auth.uid()) funzionino:
-- utile per restore dati, reportistica o per agganciare in seguito GoTrue/PostgREST.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;  -- gen_random_uuid() su PG < 13 / crypt()

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    CREATE ROLE anon NOLOGIN NOINHERIT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated NOLOGIN NOINHERIT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    CREATE ROLE service_role NOLOGIN NOINHERIT BYPASSRLS;
  END IF;
END $$;

CREATE SCHEMA IF NOT EXISTS auth;

-- Tabella utenti minimale: solo se non c'è già (GoTrue/Supabase la creano completa).
CREATE TABLE IF NOT EXISTS auth.users (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email               text UNIQUE,
  encrypted_password  text,
  raw_user_meta_data  jsonb DEFAULT '{}'::jsonb,
  created_at          timestamptz DEFAULT now()
);

-- auth.uid(): id utente dal JWT (PostgREST imposta request.jwt.claims).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'auth' AND p.proname = 'uid'
  ) THEN
    EXECUTE $f$
      CREATE FUNCTION auth.uid() RETURNS uuid
      LANGUAGE sql STABLE AS $body$
        SELECT nullif(
          coalesce(
            current_setting('request.jwt.claim.sub', true),
            nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub'
          ), ''
        )::uuid
      $body$
    $f$;
  END IF;
END $$;

GRANT USAGE ON SCHEMA auth TO anon, authenticated, service_role;
