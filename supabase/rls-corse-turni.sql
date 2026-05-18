-- supabase/rls-corse-turni.sql
-- Eseguire nel SQL Editor del dashboard Supabase

-- Abilita RLS sulle tabelle non ancora protette
ALTER TABLE corse ENABLE ROW LEVEL SECURITY;
ALTER TABLE turni ENABLE ROW LEVEL SECURITY;

-- Policy corse: ogni autista vede/modifica solo le proprie
CREATE POLICY "corse_own_rows" ON corse
  FOR ALL USING (autista_id = auth.uid())
  WITH CHECK (autista_id = auth.uid());

-- Policy turni: idem
CREATE POLICY "turni_own_rows" ON turni
  FOR ALL USING (autista_id = auth.uid())
  WITH CHECK (autista_id = auth.uid());
