#!/bin/sh
# Applica lo schema applicativo NoloTrack (database/ddl + database/dml/[0-8]*).
# Eseguito a ogni `docker compose up`: tutti gli script sono idempotenti,
# quindi serve sia per la prima installazione sia per gli aggiornamenti.
# I DML 9xx (es. dati demo) sono opzionali e vanno lanciati a mano.
set -eu

export PGHOST="${PGHOST:-db}"
export PGPORT="${PGPORT:-5432}"
export PGUSER="${PGUSER:-supabase_admin}"
export PGDATABASE="${PGDATABASE:-postgres}"
export PGPASSWORD="${POSTGRES_PASSWORD:?POSTGRES_PASSWORD mancante}"

echo "[migrate] attendo il database su $PGHOST:$PGPORT…"
until pg_isready -q; do sleep 1; done

# GoTrue crea/aggiorna auth.users al suo avvio: il trigger in 020_autisti.sql ne ha bisogno
echo "[migrate] attendo lo schema auth…"
until [ "$(psql -tAc "select to_regclass('auth.users') is not null")" = "t" ]; do sleep 1; done

# Nasconde i NOTICE "esiste già, salto" ma lascia passare warning ed errori
export PGOPTIONS="-c client_min_messages=warning"

for f in /database/ddl/*.sql /database/dml/[0-8]*.sql; do
  [ -f "$f" ] || continue
  echo "[migrate] → $(basename "$f")"
  if ! psql -v ON_ERROR_STOP=1 --no-psqlrc -q -f "$f"; then
    echo "[migrate] ERRORE in $(basename "$f") — installazione interrotta" >&2
    exit 1
  fi
done

# Verifica finale: le tabelle principali devono esistere
psql -v ON_ERROR_STOP=1 -tAc "select 'public.autisti'::regclass, 'public.corse'::regclass, 'public.turni'::regclass" >/dev/null
echo "[migrate] schema applicato correttamente"
