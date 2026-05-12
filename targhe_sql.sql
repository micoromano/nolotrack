-- Tabella targhe veicoli
create table public.targhe (
  id uuid default gen_random_uuid() primary key,
  autista_id uuid not null references public.autisti(id) on delete cascade,
  targa text not null,
  created_at timestamptz default now(),
  unique(autista_id, targa)
);
alter table public.targhe enable row level security;
create policy "autista vede sue targhe" on public.targhe
  for all using (autista_id = auth.uid());

-- Inserisci le targhe iniziali di Marco (opzionale, puoi farlo dall'app)
-- insert into public.targhe (autista_id, targa) values
--   (auth.uid(), 'GN118YK'),
--   (auth.uid(), 'GY707AN'),
--   (auth.uid(), 'HC271XW');
