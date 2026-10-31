#!/bin/sh
# =============================================================================
# Ripristina un backup creato da scripts/backup.sh
# =============================================================================
#   ./scripts/ripristina.sh backups/nolotrack_20261031_030000.dump
#
# ⚠ SOSTITUISCE tutti i dati attuali (app + utenti). Prima di procedere crea
#   in automatico un backup di sicurezza dello stato attuale.
# La struttura del DB non viene toccata: è quella creata dal servizio migrate.
# =============================================================================
set -eu
cd "$(dirname "$0")/.."

FILE="${1:-}"
[ -f "$FILE" ] || { echo "Uso: $0 <file.dump>"; exit 1; }

# Il file deve essere un dump valido (formato custom di pg_dump), prima di toccare qualsiasi cosa
docker compose exec -T db pg_restore --list < "$FILE" >/dev/null 2>&1 \
  || { echo "ERRORE: $FILE non è un backup valido creato da scripts/backup.sh"; exit 1; }

printf "Ripristinare %s? I dati attuali verranno SOSTITUITI. Scrivi 'si' per continuare: " "$FILE"
read -r conferma
[ "$conferma" = "si" ] || { echo "Annullato."; exit 1; }

echo "1/4 Backup di sicurezza dello stato attuale…"
./scripts/backup.sh

echo "2/4 Arresto dei servizi che scrivono sul DB…"
docker compose stop app rest auth

echo "3/4 Svuotamento tabelle e caricamento dati (in un'unica transazione)…"
# Se qualcosa va storto, la transazione viene annullata e i dati restano com'erano.
{
  printf '%s\n' "SET client_min_messages = warning;" \
    "SET session_replication_role = replica;" \
    "DO \$\$ DECLARE t text; BEGIN
       SELECT string_agg(format('%I.%I', schemaname, tablename), ', ') INTO t
       FROM pg_tables
       WHERE schemaname IN ('public', 'auth')
         AND NOT (schemaname = 'auth' AND tablename = 'schema_migrations');
       IF t IS NOT NULL THEN EXECUTE 'TRUNCATE ' || t || ' CASCADE'; END IF;
     END \$\$;"
  # Se pg_restore fallisce a metà, questa istruzione volutamente errata fa
  # annullare l'intera transazione (ON_ERROR_STOP) invece di confermare il TRUNCATE.
  docker compose exec -T db pg_restore --data-only -f - < "$FILE" \
    || printf '%s\n' "SELECT ripristino_fallito__annullo_la_transazione();"
  printf '%s\n' "SET session_replication_role = origin;"
} | docker compose exec -T db psql -U supabase_admin -d postgres -v ON_ERROR_STOP=1 -q --single-transaction >/dev/null \
  || { echo "ERRORE: ripristino annullato, dati invariati."; docker compose up -d --no-build; exit 1; }

echo "4/4 Riavvio…"
docker compose up -d --no-build
echo "Ripristino completato da $FILE"
