-- =============================================================================
-- 010 — Ruoli e permessi per sezione (SP5)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.ruoli (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome        text NOT NULL UNIQUE,          -- 'admin' | 'dispatcher' | 'autista'
  descrizione text,
  created_at  timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ruolo_permessi (
  ruolo_id  uuid REFERENCES public.ruoli(id) ON DELETE CASCADE,
  sezione   text NOT NULL,                   -- home, turni, corse, cassa, ... admin, whatsapp
  can_view  boolean DEFAULT false,
  can_edit  boolean DEFAULT false,
  PRIMARY KEY (ruolo_id, sezione)
);

ALTER TABLE public.ruoli          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ruolo_permessi ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ruoli_read" ON public.ruoli;
CREATE POLICY "ruoli_read" ON public.ruoli
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "ruoli_permessi_read" ON public.ruolo_permessi;
CREATE POLICY "ruoli_permessi_read" ON public.ruolo_permessi
  FOR SELECT TO authenticated USING (true);
