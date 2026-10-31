#!/bin/sh
# =============================================================================
# Backup completo del database (dati + utenti/password) in ./backups/
# =============================================================================
#   ./scripts/backup.sh                 → backups/nolotrack_AAAAMMGG_HHMMSS.dump
#   CONSERVA=14 ./scripts/backup.sh     → tiene solo gli ultimi 14 backup
# Formato custom di pg_dump (compresso), si ripristina con scripts/ripristina.sh
# Contiene i DATI degli schemi public (app) e auth (utenti, password cifrate):
# la struttura delle tabelle è nel codice (database/ddl) e la ricrea il migrate.
# Da pianificare con cron, es. ogni notte alle 3:
#   0 3 * * * cd /opt/nolotrack && ./scripts/backup.sh >> backups/backup.log 2>&1
# =============================================================================
set -eu
cd "$(dirname "$0")/.."
mkdir -p backups

FILE="backups/nolotrack_$(date +%Y%m%d_%H%M%S).dump"
docker compose exec -T db pg_dump -U supabase_admin -d postgres \
  --format=custom --data-only \
  --schema=public --schema=auth \
  --exclude-table-data=auth.schema_migrations \
  > "$FILE"

echo "Backup creato: $FILE ($(du -h "$FILE" | cut -f1))"

if [ -n "${CONSERVA:-}" ]; then
  ls -1t backups/nolotrack_*.dump | tail -n +"$((CONSERVA + 1))" | xargs -r rm -f
  echo "Mantenuti gli ultimi $CONSERVA backup"
fi
