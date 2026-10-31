-- =============================================================================
-- 100 — DML: ruoli di default e matrice permessi per sezione
-- =============================================================================
-- Idempotente: le righe già presenti NON vengono sovrascritte (eventuali
-- personalizzazioni fatte a mano restano intatte).

INSERT INTO public.ruoli (nome, descrizione) VALUES
  ('admin',      'Accesso completo + gestione utenti'),
  ('dispatcher', 'Assegna corse, vede agenda tutti, no stipendi'),
  ('autista',    'Solo dati propri')
ON CONFLICT (nome) DO NOTHING;

-- sezione, can_view, can_edit per ciascun ruolo
INSERT INTO public.ruolo_permessi (ruolo_id, sezione, can_view, can_edit)
SELECT r.id, p.sezione, p.can_view, p.can_edit
FROM public.ruoli r
JOIN (VALUES
  -- admin: tutto
  ('admin', 'home', true, true), ('admin', 'turni', true, true), ('admin', 'corse', true, true),
  ('admin', 'cassa', true, true), ('admin', 'spese', true, true), ('admin', 'carburante', true, true),
  ('admin', 'stipendio', true, true), ('admin', 'report', true, true), ('admin', 'invia', true, true),
  ('admin', 'agenda', true, true), ('admin', 'admin', true, true), ('admin', 'whatsapp', true, true),
  -- dispatcher
  ('dispatcher', 'home', true, false), ('dispatcher', 'turni', true, false), ('dispatcher', 'corse', true, true),
  ('dispatcher', 'cassa', false, false), ('dispatcher', 'spese', false, false), ('dispatcher', 'carburante', false, false),
  ('dispatcher', 'stipendio', false, false), ('dispatcher', 'report', false, false), ('dispatcher', 'invia', false, false),
  ('dispatcher', 'agenda', true, false), ('dispatcher', 'admin', false, false), ('dispatcher', 'whatsapp', true, true),
  -- autista: solo dati propri, niente amministrazione
  ('autista', 'home', true, false), ('autista', 'turni', true, true), ('autista', 'corse', true, true),
  ('autista', 'cassa', true, false), ('autista', 'spese', true, true), ('autista', 'carburante', true, true),
  ('autista', 'stipendio', true, false), ('autista', 'report', true, false), ('autista', 'invia', true, false),
  ('autista', 'agenda', true, false), ('autista', 'admin', false, false), ('autista', 'whatsapp', true, true)
) AS p(ruolo, sezione, can_view, can_edit) ON p.ruolo = r.nome
ON CONFLICT (ruolo_id, sezione) DO NOTHING;

-- Autisti senza ruolo (es. creati prima di SP5) → ruolo 'autista'
UPDATE public.autisti
SET ruolo_id = (SELECT id FROM public.ruoli WHERE nome = 'autista')
WHERE ruolo_id IS NULL;
