-- =============================================================================
-- 050 — Spese (riducono il saldo cassa)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.spese (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  autista_id   uuid NOT NULL REFERENCES public.autisti(id) ON DELETE CASCADE,
  data         date NOT NULL,
  descrizione  text NOT NULL,
  importo      numeric NOT NULL,
  created_at   timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS spese_autista_data_idx ON public.spese (autista_id, data DESC);

ALTER TABLE public.spese ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "spese_own_rows" ON public.spese;
CREATE POLICY "spese_own_rows" ON public.spese
  FOR ALL USING (autista_id = auth.uid()) WITH CHECK (autista_id = auth.uid());
