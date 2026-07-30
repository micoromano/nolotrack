-- SP7: Sezione WhatsApp (Meta Cloud API) — messaggistica autista/cliente
-- Eseguire nel SQL Editor di Supabase

-- Numero WhatsApp dell'autista (per il flusso di comunicazione servizio)
ALTER TABLE autisti ADD COLUMN IF NOT EXISTS telefono text;

-- Stato di avanzamento del servizio, aggiornato dai bottoni WhatsApp
ALTER TABLE corse ADD COLUMN IF NOT EXISTS stato_servizio text NOT NULL DEFAULT 'da_iniziare';
ALTER TABLE corse ADD CONSTRAINT corse_stato_servizio_check
  CHECK (stato_servizio IN ('da_iniziare', 'in_corso', 'attesa_pagamento', 'pagato', 'completato'));

-- Template messaggio riutilizzabili con placeholder {{nome}}
CREATE TABLE IF NOT EXISTS whatsapp_templates (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  autista_id  uuid NOT NULL REFERENCES autisti(id) ON DELETE CASCADE,
  nome        text NOT NULL,
  categoria   text NOT NULL CHECK (categoria IN ('autista', 'cliente', 'libero')),
  corpo       text NOT NULL,
  created_at  timestamptz DEFAULT now(),
  UNIQUE (autista_id, nome)
);

ALTER TABLE whatsapp_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "whatsapp_templates_owner" ON whatsapp_templates
  FOR ALL TO authenticated
  USING (autista_id = auth.uid())
  WITH CHECK (autista_id = auth.uid());

-- Log messaggi inviati/ricevuti (usato anche dal webhook con service role)
CREATE TABLE IF NOT EXISTS whatsapp_log (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  autista_id            uuid REFERENCES autisti(id) ON DELETE CASCADE,
  corsa_id              uuid REFERENCES corse(id) ON DELETE SET NULL,
  destinatario_tipo     text CHECK (destinatario_tipo IN ('autista', 'cliente')),
  telefono              text NOT NULL,
  direzione             text NOT NULL DEFAULT 'out' CHECK (direzione IN ('in', 'out')),
  tipo                  text NOT NULL CHECK (tipo IN ('testo', 'template', 'interactive_bottoni', 'interactive_lista', 'bottone_click')),
  contenuto             text,
  wa_message_id         text,
  stato                 text NOT NULL DEFAULT 'inviato' CHECK (stato IN ('inviato', 'consegnato', 'letto', 'errore', 'ricevuto')),
  errore_msg            text,
  created_at            timestamptz DEFAULT now()
);

ALTER TABLE whatsapp_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "whatsapp_log_select" ON whatsapp_log
  FOR SELECT TO authenticated
  USING (autista_id = auth.uid());
CREATE POLICY "whatsapp_log_insert" ON whatsapp_log
  FOR INSERT TO authenticated
  WITH CHECK (autista_id = auth.uid());
-- Nessuna policy UPDATE per "authenticated": gli aggiornamenti di stato (consegnato/letto)
-- e gli inserimenti in arrivo dal webhook pubblico usano il client con service role.

CREATE INDEX IF NOT EXISTS whatsapp_log_wa_message_id_idx ON whatsapp_log (wa_message_id);
CREATE INDEX IF NOT EXISTS whatsapp_log_autista_id_idx ON whatsapp_log (autista_id, created_at DESC);

-- Permessi sezione "whatsapp" per i ruoli esistenti (se la tabella ruoli esiste già, SP5)
INSERT INTO ruolo_permessi (ruolo_id, sezione, can_view, can_edit)
SELECT id, 'whatsapp', true, true FROM ruoli WHERE nome IN ('admin', 'dispatcher', 'autista')
ON CONFLICT DO NOTHING;
