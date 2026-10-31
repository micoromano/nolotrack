-- =============================================================================
-- 070 — Carburante e targhe veicoli
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.carburante (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  autista_id    uuid NOT NULL REFERENCES public.autisti(id) ON DELETE CASCADE,
  data          date NOT NULL,
  targa         text NOT NULL,
  km            numeric(10, 1),               -- nullable ("nd" nel vecchio Excel)
  litri         numeric(8, 3) NOT NULL,
  prezzo_litro  numeric(8, 4),
  importo       numeric(10, 2) NOT NULL,
  note          text,
  created_at    timestamptz DEFAULT now()
);

ALTER TABLE public.carburante ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "autista vede suo carburante" ON public.carburante;
CREATE POLICY "autista vede suo carburante" ON public.carburante
  FOR ALL USING (autista_id = auth.uid()) WITH CHECK (autista_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.targhe (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  autista_id  uuid NOT NULL REFERENCES public.autisti(id) ON DELETE CASCADE,
  targa       text NOT NULL,
  created_at  timestamptz DEFAULT now(),
  UNIQUE (autista_id, targa)
);

ALTER TABLE public.targhe ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "autista vede sue targhe" ON public.targhe;
CREATE POLICY "autista vede sue targhe" ON public.targhe
  FOR ALL USING (autista_id = auth.uid()) WITH CHECK (autista_id = auth.uid());
