-- SP5: Tabelle ruoli e permessi per sezione
-- Eseguire nel SQL Editor di Supabase

-- Tabella ruoli
CREATE TABLE IF NOT EXISTS ruoli (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome        text NOT NULL UNIQUE,
  descrizione text,
  created_at  timestamptz DEFAULT now()
);

-- Tabella permessi per sezione
CREATE TABLE IF NOT EXISTS ruolo_permessi (
  ruolo_id  uuid REFERENCES ruoli(id) ON DELETE CASCADE,
  sezione   text NOT NULL,
  can_view  boolean DEFAULT false,
  can_edit  boolean DEFAULT false,
  PRIMARY KEY (ruolo_id, sezione)
);

-- Aggiungi ruolo_id alla tabella autisti (mantieni ruolo text per compatibilità)
ALTER TABLE autisti ADD COLUMN IF NOT EXISTS ruolo_id uuid REFERENCES ruoli(id);

-- Inserisci ruoli di default
INSERT INTO ruoli (nome, descrizione) VALUES
  ('admin',      'Accesso completo + gestione utenti'),
  ('dispatcher', 'Assegna corse, vede agenda tutti, no stipendi'),
  ('autista',    'Solo dati propri')
ON CONFLICT (nome) DO NOTHING;

-- Permessi admin (tutto)
INSERT INTO ruolo_permessi (ruolo_id, sezione, can_view, can_edit)
SELECT id, sezione, true, true FROM ruoli, unnest(ARRAY[
  'home','turni','corse','cassa','spese','carburante','stipendio','report','invia','agenda','admin'
]) AS sezione WHERE nome = 'admin'
ON CONFLICT DO NOTHING;

-- Permessi dispatcher
INSERT INTO ruolo_permessi (ruolo_id, sezione, can_view, can_edit)
SELECT id, sezione, can_view, can_edit FROM ruoli,
(VALUES
  ('home',true,false),('turni',true,false),('corse',true,true),
  ('cassa',false,false),('spese',false,false),('carburante',false,false),
  ('stipendio',false,false),('report',false,false),('invia',false,false),
  ('agenda',true,false),('admin',false,false)
) AS p(sezione, can_view, can_edit)
WHERE ruoli.nome = 'dispatcher'
ON CONFLICT DO NOTHING;

-- Permessi autista (solo propri dati, no admin)
INSERT INTO ruolo_permessi (ruolo_id, sezione, can_view, can_edit)
SELECT id, sezione, can_view, can_edit FROM ruoli,
(VALUES
  ('home',true,false),('turni',true,true),('corse',true,true),
  ('cassa',true,false),('spese',true,true),('carburante',true,true),
  ('stipendio',true,false),('report',true,false),('invia',true,false),
  ('agenda',true,false),('admin',false,false)
) AS p(sezione, can_view, can_edit)
WHERE ruoli.nome = 'autista'
ON CONFLICT DO NOTHING;

-- RLS per ruoli e ruolo_permessi (lettura per tutti gli autenticati)
ALTER TABLE ruoli ENABLE ROW LEVEL SECURITY;
ALTER TABLE ruolo_permessi ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ruoli_read" ON ruoli FOR SELECT TO authenticated USING (true);
CREATE POLICY "ruoli_permessi_read" ON ruolo_permessi FOR SELECT TO authenticated USING (true);

-- Verifica (da eseguire dopo):
-- SELECT r.nome, rp.sezione, rp.can_view, rp.can_edit
-- FROM ruoli r JOIN ruolo_permessi rp ON r.id = rp.ruolo_id
-- ORDER BY r.nome, rp.sezione;
-- Expected: 33 righe (11 sezioni × 3 ruoli)

-- Assegna ruolo admin a Marco:
-- UPDATE autisti
-- SET ruolo_id = (SELECT id FROM ruoli WHERE nome = 'admin')
-- WHERE email = 'marco.camelin@gmail.com';
