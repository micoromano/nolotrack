-- Tabella per le subscription web push
create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  autista_id uuid not null references autisti(id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now(),
  constraint push_subscriptions_endpoint_key unique (endpoint)
);

-- RLS: ogni autista vede solo le proprie subscription
alter table push_subscriptions enable row level security;

create policy "push_subscriptions_owner" on push_subscriptions
  for all using (autista_id = auth.uid());
