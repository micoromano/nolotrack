-- =============================================================================
-- 900 — DML OPZIONALE: dati dimostrativi per provare l'app
-- =============================================================================
-- NON viene eseguito automaticamente. Inserisce, per l'utente indicato,
-- configurazione salario, targhe, turni, corse, spese e rifornimenti del mese
-- corrente. L'utente deve esistere già (es. creato con scripts/crea-admin.mjs).
--
-- Uso (Docker):
--   docker compose exec -T db psql -U supabase_admin -d postgres \
--     -v email=mario@example.com < database/dml/900_dati_demo.sql
-- Uso (PostgreSQL qualsiasi):
--   psql "$DATABASE_URL" -v email=mario@example.com -f database/dml/900_dati_demo.sql
--
-- Rieseguibile: i turni sono in upsert, le altre righe demo hanno nota '[demo]'
-- e vengono cancellate e ricreate.
-- =============================================================================
\set ON_ERROR_STOP on

SELECT id AS demo_uid FROM public.autisti WHERE email = :'email' \gset
\if :{?demo_uid}
\else
  \echo 'ERRORE: nessun autista con email' :'email'
  \quit
\endif

BEGIN;

-- Configurazione salario (solo se ancora assente)
INSERT INTO public.configurazione_salario (tariffa_oraria, percentuale_cash, percentuale_carta, percentuale_uber)
SELECT 10, 0.10, 0.08, 0.05
WHERE NOT EXISTS (SELECT 1 FROM public.configurazione_salario);

INSERT INTO public.targhe (autista_id, targa) VALUES
  (:'demo_uid', 'AB123CD'), (:'demo_uid', 'EF456GH')
ON CONFLICT DO NOTHING;

DELETE FROM public.corse      WHERE autista_id = :'demo_uid' AND note = '[demo]';
DELETE FROM public.spese      WHERE autista_id = :'demo_uid' AND descrizione LIKE '[demo]%';
DELETE FROM public.carburante WHERE autista_id = :'demo_uid' AND note = '[demo]';

-- Un turno per ogni giorno feriale del mese corrente fino a oggi
INSERT INTO public.turni (autista_id, data, ora_inizio, ora_fine, note)
SELECT :'demo_uid', g::date, '08:00', (time '16:00' + (EXTRACT(DAY FROM g)::int % 3) * interval '1 hour'), '[demo]'
FROM generate_series(date_trunc('month', current_date), current_date, interval '1 day') g
WHERE EXTRACT(ISODOW FROM g) < 6
ON CONFLICT (autista_id, data) DO NOTHING;

-- Due corse per giorno lavorato, metodi di pagamento a rotazione
INSERT INTO public.corse (autista_id, data, ora_partenza, origine, destinazione, tipo_pagamento, importo, mancia, note, cliente_nome, n_pax)
SELECT :'demo_uid', t.data, v.ora, v.origine, v.destinazione,
       (ARRAY['cash', 'carta', 'uber', 'cash'])[1 + (EXTRACT(DAY FROM t.data)::int + v.n) % 4],
       v.importo, CASE WHEN v.n = 1 AND EXTRACT(DAY FROM t.data)::int % 5 = 0 THEN 5 ELSE 0 END,
       '[demo]', v.cliente, 2
FROM public.turni t
CROSS JOIN (VALUES
  (0, time '09:00', 'Aeroporto di Fiumicino', 'Piazza di Spagna, Roma', 60, 'Sig. Rossi'),
  (1, time '14:30', 'Stazione Termini, Roma', 'Aeroporto di Ciampino', 45, 'Sig.ra Bianchi')
) AS v(n, ora, origine, destinazione, importo, cliente)
WHERE t.autista_id = :'demo_uid' AND t.note = '[demo]';

INSERT INTO public.spese (autista_id, data, descrizione, importo) VALUES
  (:'demo_uid', date_trunc('month', current_date)::date, '[demo] Lavaggio auto', 15),
  (:'demo_uid', current_date, '[demo] Parcheggio', 8);

INSERT INTO public.carburante (autista_id, data, targa, km, litri, prezzo_litro, importo, note) VALUES
  (:'demo_uid', date_trunc('month', current_date)::date, 'AB123CD', 120500, 45, 1.789, 80.51, '[demo]'),
  (:'demo_uid', current_date, 'AB123CD', 121300, 40, 1.799, 71.96, '[demo]');

COMMIT;

\echo 'Dati demo inseriti per' :'email'
