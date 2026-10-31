-- =============================================================================
-- 090 — WhatsApp (SP7): template locali e log messaggi
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.whatsapp_templates (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  autista_id  uuid NOT NULL REFERENCES public.autisti(id) ON DELETE CASCADE,
  nome        text NOT NULL,
  categoria   text NOT NULL CHECK (categoria IN ('autista', 'cliente', 'libero')),
  corpo       text NOT NULL,                  -- con placeholder {{chiave}}
  created_at  timestamptz DEFAULT now(),
  UNIQUE (autista_id, nome)
);

ALTER TABLE public.whatsapp_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "whatsapp_templates_owner" ON public.whatsapp_templates;
CREATE POLICY "whatsapp_templates_owner" ON public.whatsapp_templates
  FOR ALL TO authenticated
  USING (autista_id = auth.uid()) WITH CHECK (autista_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.whatsapp_log (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  autista_id         uuid REFERENCES public.autisti(id) ON DELETE CASCADE,
  corsa_id           uuid REFERENCES public.corse(id) ON DELETE SET NULL,
  destinatario_tipo  text CHECK (destinatario_tipo IN ('autista', 'cliente')),
  telefono           text NOT NULL,
  direzione          text NOT NULL DEFAULT 'out' CHECK (direzione IN ('in', 'out')),
  tipo               text NOT NULL CHECK (tipo IN ('testo', 'template', 'interactive_bottoni', 'interactive_lista', 'bottone_click')),
  contenuto          text,
  wa_message_id      text,
  stato              text NOT NULL DEFAULT 'inviato' CHECK (stato IN ('inviato', 'consegnato', 'letto', 'errore', 'ricevuto')),
  errore_msg         text,
  created_at         timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS whatsapp_log_wa_message_id_idx ON public.whatsapp_log (wa_message_id);
CREATE INDEX IF NOT EXISTS whatsapp_log_autista_id_idx    ON public.whatsapp_log (autista_id, created_at DESC);

ALTER TABLE public.whatsapp_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "whatsapp_log_select" ON public.whatsapp_log;
CREATE POLICY "whatsapp_log_select" ON public.whatsapp_log
  FOR SELECT TO authenticated USING (autista_id = auth.uid());
DROP POLICY IF EXISTS "whatsapp_log_insert" ON public.whatsapp_log;
CREATE POLICY "whatsapp_log_insert" ON public.whatsapp_log
  FOR INSERT TO authenticated WITH CHECK (autista_id = auth.uid());
-- Nessun UPDATE per "authenticated": le ricevute (consegnato/letto) e i messaggi
-- in arrivo li scrive il webhook pubblico con la service role (bypassa RLS).
