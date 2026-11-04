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

DIR="${DATABASE_DIR:-/database}"

# Tutti i file in UNA sessione, protetta da un advisory lock: se più istanze
# partono insieme (es. più repliche in Kubernetes) la seconda aspetta la prima
# invece di eseguire gli stessi DDL in parallelo.
{
  echo "SELECT pg_advisory_lock(727274);"
  for f in "$DIR"/ddl/*.sql "$DIR"/dml/[0-8]*.sql; do
    [ -f "$f" ] || continue
    printf '%s\n' "\\echo [migrate] → $(basename "$f")"
    cat "$f"
    echo
  done
  echo "SELECT pg_advisory_unlock(727274);"
} | psql -v ON_ERROR_STOP=1 --no-psqlrc -q -o /dev/null \
  || { echo "[migrate] ERRORE — vedi il messaggio sopra (il file è l'ultimo '→' stampato)" >&2; exit 1; }

# Verifica finale: le tabelle principali devono esistere
psql -v ON_ERROR_STOP=1 -tAc "select 'public.autisti'::regclass, 'public.corse'::regclass, 'public.turni'::regclass" >/dev/null
echo "[migrate] schema applicato correttamente"
