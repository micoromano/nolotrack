#!/bin/sh
# =============================================================================
# Importa utenti e dati da un progetto Supabase cloud nell'installazione Docker
# =============================================================================
#   SUPABASE_DB_URL='postgresql://postgres.<ref>:<password>@aws-0-<regione>.pooler.supabase.com:5432/postgres' \
#     ./scripts/importa-da-supabase.sh
#
# Connection string: Supabase → Project Settings → Database → Connection string
#   → "Session pooler" (porta 5432). La "Direct connection" è solo IPv6.
#
# Cosa importa:
#   • auth.users e auth.identities (colonne essenziali): gli utenti mantengono
#     email, password e collegamento Google — nessuno deve reimpostare nulla;
#   • tutti i dati dello schema public (autisti, turni, corse, spese, …).
# Cosa NON importa: sessioni attive (tutti rifaranno login), storage, log.
#
# ⚠ SOSTITUISCE i dati locali (prima fa un backup di sicurezza).
# Richiede lo stack avviato (docker compose up -d). L'export usa un container
# postgres:17 (compatibile con qualsiasi versione di Supabase cloud).
# =============================================================================
set -eu
cd "$(dirname "$0")/.."

: "${SUPABASE_DB_URL:?Imposta SUPABASE_DB_URL (vedi intestazione dello script)}"
# Opzioni extra per il container di export (usato nei test: --network ...)
DOCKER_EXPORT_OPTS="${DOCKER_EXPORT_OPTS:-}"
DIR="backups/import_supabase_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$DIR"

pg17() { docker run --rm -i $DOCKER_EXPORT_OPTS -e PGCONNECT_TIMEOUT=15 postgres:17-alpine "$@"; }

echo "1/6 Verifica connessione a Supabase…"
pg17 psql "$SUPABASE_DB_URL" -tAc "select 'ok: ' || count(*) || ' utenti' from auth.users"

echo "2/6 Export utenti (auth)…"
pg17 psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -c "\copy (
  select id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
         invited_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
         created_at, updated_at,
         coalesce(confirmation_token, '') as confirmation_token,
         coalesce(recovery_token, '') as recovery_token,
         coalesce(email_change_token_new, '') as email_change_token_new,
         coalesce(email_change, '') as email_change
  from auth.users) to stdout with csv header" > "$DIR/auth_users.csv"
pg17 psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -c "\copy (
  select id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
  from auth.identities) to stdout with csv header" > "$DIR/auth_identities.csv"

echo "3/6 Export dati applicativi (public)…"
# Il filtro rimuove i comandi dei pg_dump recenti che PostgreSQL 15 non conosce
pg17 pg_dump "$SUPABASE_DB_URL" --data-only --schema=public --no-owner --no-privileges \
  | sed -e '/^\\restrict /d' -e '/^\\unrestrict /d' -e '/^SET transaction_timeout/d' \
  > "$DIR/public_data.sql"
# pg_dump è in pipe con sed: il suo esito va verificato dal contenuto del file
grep -q "PostgreSQL database dump complete" "$DIR/public_data.sql" \
  || { echo "ERRORE: export dei dati incompleto ($DIR/public_data.sql)"; exit 1; }
echo "    → $(($(wc -l < "$DIR/auth_users.csv") - 1)) utenti, dump public $(du -h "$DIR/public_data.sql" | cut -f1) in $DIR"

echo "4/6 Backup di sicurezza dei dati locali…"
./scripts/backup.sh

echo "5/6 Import nel database locale…"
docker compose stop app rest >/dev/null
# Tutto in UNA transazione: se qualcosa fallisce, il DB locale resta com'era.
# session_replication_role=replica: niente trigger (es. creazione automatica
# autisti) né controlli FK durante il caricamento — i dati arrivano già coerenti.
# (printf e non echo: in /bin/sh "echo '\copy'" interpreta "\c" e tronca la riga)
{
  printf '%s\n' "SET client_min_messages = warning;" \
    "SET session_replication_role = replica;" \
    "DO \$\$ DECLARE t text; BEGIN
       SELECT string_agg(format('%I.%I', schemaname, tablename), ', ') INTO t
       FROM pg_tables WHERE schemaname = 'public';
       IF t IS NOT NULL THEN EXECUTE 'TRUNCATE ' || t || ' CASCADE'; END IF;
       TRUNCATE auth.users CASCADE;
     END \$\$;" \
    "\\copy auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, invited_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change) from stdin with csv header"
  cat "$DIR/auth_users.csv"
  printf '%s\n' '\.' \
    "\\copy auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at) from stdin with csv header"
  cat "$DIR/auth_identities.csv"
  printf '%s\n' '\.'
  cat "$DIR/public_data.sql"
  printf '%s\n' "SET session_replication_role = origin;"
} | docker compose exec -T db psql -U supabase_admin -d postgres -v ON_ERROR_STOP=1 -q --single-transaction >/dev/null \
  || { echo "ERRORE durante l'import: nessuna modifica applicata al DB locale."; docker compose up -d --no-build >/dev/null; exit 1; }

echo "6/6 Riallineo lo schema (ruoli/permessi mancanti) e riavvio…"
docker compose run --rm migrate >/dev/null
docker compose up -d --no-build

docker compose exec -T db psql -U supabase_admin -d postgres -tAc "select 'Import completato: ' || (select count(*) from auth.users) || ' utenti, ' || (select count(*) from public.corse) || ' corse, ' || (select count(*) from public.turni) || ' turni'"
echo "Gli utenti accedono con le stesse credenziali di prima."
