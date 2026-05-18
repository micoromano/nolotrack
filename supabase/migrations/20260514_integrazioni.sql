CREATE TABLE IF NOT EXISTS integrazioni (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  autista_id   uuid NOT NULL REFERENCES autisti(id) ON DELETE CASCADE,
  provider     text NOT NULL, -- 'google_calendar'
  access_token text,
  refresh_token text,
  expires_at   timestamptz,
  calendar_id  text, -- ID del calendario Google selezionato
  created_at   timestamptz DEFAULT now(),
  UNIQUE(autista_id, provider)
);

ALTER TABLE integrazioni ENABLE ROW LEVEL SECURITY;

CREATE POLICY "integrazioni_own" ON integrazioni
  FOR ALL USING (autista_id = auth.uid())
  WITH CHECK (autista_id = auth.uid());
