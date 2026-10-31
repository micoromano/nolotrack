-- =============================================================================
-- 030 — Turni di lavoro (un turno per autista per giorno)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.turni (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  autista_id    uuid NOT NULL REFERENCES public.autisti(id) ON DELETE CASCADE,
  data          date NOT NULL,
  ora_inizio    time NOT NULL,
  ora_fine      time NOT NULL,
  -- ore decimali (8.5 = 8h30m); l'app impone ora_fine > ora_inizio
  ore_lavorate  numeric GENERATED ALWAYS AS (
                  EXTRACT(EPOCH FROM (ora_fine - ora_inizio)) / 3600
                ) STORED,
  note          text,
  created_at    timestamptz DEFAULT now(),
  UNIQUE (autista_id, data)
);

CREATE INDEX IF NOT EXISTS turni_autista_data_idx ON public.turni (autista_id, data DESC);

ALTER TABLE public.turni ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "turni_own_rows" ON public.turni;
CREATE POLICY "turni_own_rows" ON public.turni
  FOR ALL USING (autista_id = auth.uid()) WITH CHECK (autista_id = auth.uid());
