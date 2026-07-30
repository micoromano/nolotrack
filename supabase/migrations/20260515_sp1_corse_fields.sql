-- Eseguire nel SQL Editor del dashboard Supabase

CREATE SEQUENCE IF NOT EXISTS corse_n_ordine_seq START WITH 1 INCREMENT BY 1;

ALTER TABLE corse
  ADD COLUMN IF NOT EXISTS n_ordine      INTEGER DEFAULT nextval('corse_n_ordine_seq'),
  ADD COLUMN IF NOT EXISTS anno_ordine   INTEGER DEFAULT EXTRACT(YEAR FROM NOW())::INTEGER,
  ADD COLUMN IF NOT EXISTS rif_agenzia   TEXT,
  ADD COLUMN IF NOT EXISTS agenzia       TEXT,
  ADD COLUMN IF NOT EXISTS cliente_nome  TEXT,
  ADD COLUMN IF NOT EXISTS cliente_tel   TEXT,
  ADD COLUMN IF NOT EXISTS n_pax         INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS ora_fine      TIME,
  ADD COLUMN IF NOT EXISTS tipo_servizio TEXT;

-- Popola n_ordine per righe esistenti che hanno NULL
UPDATE corse
SET
  n_ordine    = nextval('corse_n_ordine_seq'),
  anno_ordine = EXTRACT(YEAR FROM data)::INTEGER
WHERE n_ordine IS NULL;
