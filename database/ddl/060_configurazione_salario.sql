-- =============================================================================
-- 060 — Configurazione salario (riga unica globale, nessun autista_id)
-- =============================================================================
-- Percentuali come decimali: 0.35 = 35%.
CREATE TABLE IF NOT EXISTS public.configurazione_salario (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tariffa_oraria     numeric(10, 4) NOT NULL DEFAULT 0,
  percentuale_cash   numeric(5, 4)  NOT NULL DEFAULT 0,
  percentuale_carta  numeric(5, 4)  NOT NULL DEFAULT 0,
  percentuale_uber   numeric(5, 4)  NOT NULL DEFAULT 0,
  aggiornato_il      timestamptz    NOT NULL DEFAULT now()
);

-- Comportamento identico all'installazione originale: ogni utente autenticato
-- legge e modifica la configurazione (pagina Stipendio → "Configura").
ALTER TABLE public.configurazione_salario ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "conf_salario_authenticated" ON public.configurazione_salario;
CREATE POLICY "conf_salario_authenticated" ON public.configurazione_salario
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
