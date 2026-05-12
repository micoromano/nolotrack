create table public.carburante (
  id uuid default gen_random_uuid() primary key,
  autista_id uuid not null references public.autisti(id) on delete cascade,
  data date not null,
  targa text not null,
  km numeric(10,1),             -- nullable: può essere "nd" nel foglio Excel
  litri numeric(8,3) not null,
  prezzo_litro numeric(8,4),
  importo numeric(10,2) not null,
  note text,
  created_at timestamptz default now()
);
alter table public.carburante enable row level security;
create policy "autista vede suo carburante" on public.carburante
  for all using (autista_id = auth.uid());
