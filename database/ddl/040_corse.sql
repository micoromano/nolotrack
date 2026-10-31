-- =============================================================================
-- 040 — Corse / servizi (+ campi ordine SP1, mance, multivaluta, stato WhatsApp SP7)
-- =============================================================================
CREATE SEQUENCE IF NOT EXISTS public.corse_n_ordine_seq START WITH 1 INCREMENT BY 1;

CREATE TABLE IF NOT EXISTS public.corse (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  autista_id        uuid NOT NULL REFERENCES public.autisti(id) ON DELETE CASCADE,
  data              date NOT NULL,
  ora_partenza      time NOT NULL,
  origine           text NOT NULL,
  destinazione      text NOT NULL,
  tipo_pagamento    text NOT NULL CHECK (tipo_pagamento IN ('cash', 'carta', 'uber', 'noninc')),
  importo           numeric NOT NULL DEFAULT 0,   -- nella valuta originale
  note              text,
  created_at        timestamptz DEFAULT now()
);

-- Colonne aggiunte nel tempo (ADD COLUMN IF NOT EXISTS = sicuro anche in upgrade)
ALTER TABLE public.corse
  ADD COLUMN IF NOT EXISTS mancia           numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS valuta           text    NOT NULL DEFAULT 'EUR',
  ADD COLUMN IF NOT EXISTS tasso_cambio     numeric NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS includi_in_cassa boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS n_ordine         integer DEFAULT nextval('public.corse_n_ordine_seq'),
  ADD COLUMN IF NOT EXISTS anno_ordine      integer DEFAULT EXTRACT(YEAR FROM now())::integer,
  ADD COLUMN IF NOT EXISTS rif_agenzia      text,
  ADD COLUMN IF NOT EXISTS agenzia          text,
  ADD COLUMN IF NOT EXISTS cliente_nome     text,
  ADD COLUMN IF NOT EXISTS cliente_tel      text,
  ADD COLUMN IF NOT EXISTS n_pax            integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS ora_fine         time,
  ADD COLUMN IF NOT EXISTS tipo_servizio    text,
  ADD COLUMN IF NOT EXISTS stato_servizio   text NOT NULL DEFAULT 'da_iniziare';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'corse_valuta_check') THEN
    ALTER TABLE public.corse ADD CONSTRAINT corse_valuta_check
      CHECK (valuta IN ('EUR', 'USD', 'GBP', 'CHF'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'corse_stato_servizio_check') THEN
    ALTER TABLE public.corse ADD CONSTRAINT corse_stato_servizio_check
      CHECK (stato_servizio IN ('da_iniziare', 'in_corso', 'attesa_pagamento', 'pagato', 'completato'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS corse_autista_data_idx ON public.corse (autista_id, data DESC);

ALTER TABLE public.corse ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "corse_own_rows" ON public.corse;
CREATE POLICY "corse_own_rows" ON public.corse
  FOR ALL USING (autista_id = auth.uid()) WITH CHECK (autista_id = auth.uid());
