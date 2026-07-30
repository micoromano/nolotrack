-- supabase/rls-check.sql
-- Eseguire nel SQL Editor per verificare che RLS sia attivo su tutte le tabelle user-data

SELECT
  t.tablename,
  t.rowsecurity AS rls_enabled,
  COUNT(p.policyname) AS policy_count
FROM pg_tables t
LEFT JOIN pg_policies p ON p.tablename = t.tablename
WHERE t.schemaname = 'public'
  AND t.tablename IN ('corse','turni','spese','carburante','targhe','integrazioni','autisti','ruoli','ruolo_permessi')
GROUP BY t.tablename, t.rowsecurity
ORDER BY t.tablename;

-- ── RLS su autisti ─────────────────────────────────────────────────────────────
-- Eseguire se rls_enabled = false per autisti

ALTER TABLE autisti ENABLE ROW LEVEL SECURITY;

-- Ogni autista legge solo il proprio profilo
CREATE POLICY "autisti_own_read" ON autisti
  FOR SELECT USING (id = auth.uid());

-- Le operazioni admin (lettura di tutti gli autisti) avvengono via
-- SUPABASE_SERVICE_ROLE_KEY lato server, che bypassa RLS automaticamente.
