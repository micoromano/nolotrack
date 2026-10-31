-- =============================================================================
-- 080 — Integrazioni esterne (Google Calendar) e notifiche Web Push
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.integrazioni (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  autista_id     uuid NOT NULL REFERENCES public.autisti(id) ON DELETE CASCADE,
  provider       text NOT NULL,                -- 'google_calendar'
  access_token   text,
  refresh_token  text,
  expires_at     timestamptz,
  calendar_id    text,
  created_at     timestamptz DEFAULT now(),
  UNIQUE (autista_id, provider)
);

ALTER TABLE public.integrazioni ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "integrazioni_own" ON public.integrazioni;
CREATE POLICY "integrazioni_own" ON public.integrazioni
  FOR ALL USING (autista_id = auth.uid()) WITH CHECK (autista_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  autista_id  uuid NOT NULL REFERENCES public.autisti(id) ON DELETE CASCADE,
  endpoint    text NOT NULL,
  p256dh      text NOT NULL,
  auth        text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT push_subscriptions_endpoint_key UNIQUE (endpoint)
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "push_subscriptions_owner" ON public.push_subscriptions;
CREATE POLICY "push_subscriptions_owner" ON public.push_subscriptions
  FOR ALL USING (autista_id = auth.uid()) WITH CHECK (autista_id = auth.uid());
