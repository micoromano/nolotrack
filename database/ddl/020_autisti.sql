-- =============================================================================
-- 020 — Autisti (profilo applicativo 1:1 con auth.users)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.autisti (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome        text,
  email       text,
  ruolo       text DEFAULT 'autista',        -- legacy, mantenuto per compatibilità
  ruolo_id    uuid REFERENCES public.ruoli(id),
  telefono    text,                          -- numero WhatsApp (SP7)
  created_at  timestamptz DEFAULT now()
);
-- Upgrade da installazioni precedenti
ALTER TABLE public.autisti ADD COLUMN IF NOT EXISTS ruolo_id uuid REFERENCES public.ruoli(id);
ALTER TABLE public.autisti ADD COLUMN IF NOT EXISTS telefono text;

-- L'utente corrente è admin? (SECURITY DEFINER: evita la ricorsione RLS su autisti)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.autisti a JOIN public.ruoli r ON r.id = a.ruolo_id
    WHERE a.id = auth.uid() AND r.nome = 'admin'
  );
$$;

ALTER TABLE public.autisti ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "autisti_own_read" ON public.autisti;
CREATE POLICY "autisti_own_read" ON public.autisti
  FOR SELECT USING (id = auth.uid());

DROP POLICY IF EXISTS "autisti_admin_read" ON public.autisti;
CREATE POLICY "autisti_admin_read" ON public.autisti
  FOR SELECT TO authenticated USING (public.is_admin());

-- L'autista può aggiornare il proprio profilo (es. telefono WhatsApp)
DROP POLICY IF EXISTS "autisti_own_update" ON public.autisti;
CREATE POLICY "autisti_own_update" ON public.autisti
  FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- Crea automaticamente il profilo autista quando nasce un utente in auth.users
-- (invito admin, script crea-admin, primo login Google per utenti già invitati).
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.autisti (id, nome, email, ruolo, ruolo_id)
  VALUES (
    NEW.id,
    coalesce(
      NEW.raw_user_meta_data ->> 'nome',
      NEW.raw_user_meta_data ->> 'full_name',
      split_part(NEW.email, '@', 1)
    ),
    NEW.email,
    'autista',
    (SELECT id FROM public.ruoli WHERE nome = 'autista')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
