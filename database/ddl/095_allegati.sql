-- =============================================================================
-- 095 — Allegati (file salvati su Cloudflare R2 o altro storage S3-compatibile)
-- =============================================================================
-- Il DB conserva solo i metadati; il file sta nel bucket sotto `chiave`.
-- Ogni allegato appartiene a UNA sola voce (spesa, rifornimento o corsa):
-- se la voce viene eliminata, l'allegato sparisce in cascata e il trigger
-- mette la chiave in coda in `allegati_da_eliminare`, così l'app può
-- rimuovere anche il file dal bucket (vedi /api/allegati/pulizia).
CREATE TABLE IF NOT EXISTS public.allegati (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  autista_id     uuid NOT NULL REFERENCES public.autisti(id) ON DELETE CASCADE,
  spesa_id       uuid REFERENCES public.spese(id)      ON DELETE CASCADE,
  carburante_id  uuid REFERENCES public.carburante(id) ON DELETE CASCADE,
  corsa_id       uuid REFERENCES public.corse(id)      ON DELETE CASCADE,
  chiave         text NOT NULL UNIQUE,          -- percorso dell'oggetto nel bucket
  nome_file      text NOT NULL,
  content_type   text NOT NULL,
  dimensione     bigint NOT NULL CHECK (dimensione > 0),
  caricato       boolean NOT NULL DEFAULT false, -- true dopo la conferma dell'upload
  created_at     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT allegati_una_voce CHECK (num_nonnulls(spesa_id, carburante_id, corsa_id) = 1)
);

CREATE INDEX IF NOT EXISTS allegati_spesa_idx      ON public.allegati (spesa_id)      WHERE spesa_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS allegati_carburante_idx ON public.allegati (carburante_id) WHERE carburante_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS allegati_corsa_idx      ON public.allegati (corsa_id)      WHERE corsa_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS allegati_non_caricati_idx ON public.allegati (created_at) WHERE NOT caricato;

ALTER TABLE public.allegati ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allegati_own_rows" ON public.allegati;
CREATE POLICY "allegati_own_rows" ON public.allegati
  FOR ALL USING (autista_id = auth.uid())
  WITH CHECK (
    autista_id = auth.uid()
    -- la voce collegata deve essere dello stesso autista
    AND (spesa_id IS NULL OR EXISTS (
      SELECT 1 FROM public.spese s WHERE s.id = spesa_id AND s.autista_id = auth.uid()))
    AND (carburante_id IS NULL OR EXISTS (
      SELECT 1 FROM public.carburante c WHERE c.id = carburante_id AND c.autista_id = auth.uid()))
    AND (corsa_id IS NULL OR EXISTS (
      SELECT 1 FROM public.corse r WHERE r.id = corsa_id AND r.autista_id = auth.uid()))
  );

-- Coda dei file da cancellare dal bucket. Nessuna policy: la leggono e la
-- svuotano solo il service_role (route di pulizia) e il trigger qui sotto.
CREATE TABLE IF NOT EXISTS public.allegati_da_eliminare (
  chiave      text PRIMARY KEY,
  created_at  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.allegati_da_eliminare ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.allegati_accoda_eliminazione()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.allegati_da_eliminare (chiave)
  VALUES (OLD.chiave)
  ON CONFLICT (chiave) DO NOTHING;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS allegati_dopo_delete ON public.allegati;
CREATE TRIGGER allegati_dopo_delete
  AFTER DELETE ON public.allegati
  FOR EACH ROW EXECUTE FUNCTION public.allegati_accoda_eliminazione();

REVOKE EXECUTE ON FUNCTION public.allegati_accoda_eliminazione() FROM PUBLIC, anon, authenticated;
