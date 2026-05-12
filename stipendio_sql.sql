-- Tabella configurazione_salario
-- La tabella è già esistente con lo schema base. Questo file documenta
-- la struttura attesa e le query di setup se dovesse essere ricreata.

-- Schema esistente (singola riga globale, nessun autista_id):
--   id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
--   tariffa_oraria  numeric(10, 4) NOT NULL DEFAULT 0
--   percentuale_cash  numeric(5, 4) NOT NULL DEFAULT 0   -- es. 0.35 = 35%
--   percentuale_carta numeric(5, 4) NOT NULL DEFAULT 0
--   percentuale_uber  numeric(5, 4) NOT NULL DEFAULT 0
--   aggiornato_il   timestamptz NOT NULL DEFAULT now()

-- Se vuoi aggiungere isolamento per autista (opzionale, schema alternativo):
--
-- ALTER TABLE configurazione_salario
--   ADD COLUMN IF NOT EXISTS autista_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
--
-- CREATE UNIQUE INDEX IF NOT EXISTS conf_salario_autista_idx
--   ON configurazione_salario (autista_id);
--
-- ALTER TABLE configurazione_salario ENABLE ROW LEVEL SECURITY;
--
-- CREATE POLICY "autista vede propria conf" ON configurazione_salario
--   FOR SELECT USING (auth.uid() = autista_id);
--
-- CREATE POLICY "autista inserisce propria conf" ON configurazione_salario
--   FOR INSERT WITH CHECK (auth.uid() = autista_id);
--
-- CREATE POLICY "autista aggiorna propria conf" ON configurazione_salario
--   FOR UPDATE USING (auth.uid() = autista_id);

-- Se la tabella non esiste ancora, creala (schema base globale):
CREATE TABLE IF NOT EXISTS configurazione_salario (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tariffa_oraria  numeric(10, 4) NOT NULL DEFAULT 0,
  percentuale_cash  numeric(5, 4) NOT NULL DEFAULT 0,
  percentuale_carta numeric(5, 4) NOT NULL DEFAULT 0,
  percentuale_uber  numeric(5, 4) NOT NULL DEFAULT 0,
  aggiornato_il   timestamptz NOT NULL DEFAULT now()
);
