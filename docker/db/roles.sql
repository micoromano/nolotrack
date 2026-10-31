-- Eseguito UNA volta alla creazione del volume del DB (init-scripts di supabase/postgres).
-- Imposta la password dei ruoli di servizio usati da GoTrue e PostgREST.
\set pgpass `echo "$POSTGRES_PASSWORD"`

ALTER USER authenticator       WITH PASSWORD :'pgpass';
ALTER USER supabase_auth_admin WITH PASSWORD :'pgpass';
