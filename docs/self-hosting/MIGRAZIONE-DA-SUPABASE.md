# Migrazione da Supabase cloud

Per spostare un'installazione esistente (Vercel + Supabase cloud) sullo stack
Docker **senza perdere nulla**: gli utenti mantengono le stesse credenziali.

## Cosa viene trasferito

| Dato | Trasferito |
|---|---|
| Utenti, email, password (hash bcrypt), collegamento Google | ✅ |
| Tutti i dati dell'app: autisti, turni, corse, spese, carburante, targhe, configurazione, template e log WhatsApp, ruoli | ✅ |
| Sessioni attive | ❌ tutti rifanno il login (cambia `JWT_SECRET`) |
| Subscription push | ✅ ma vanno riattivate se cambia il dominio |
| Token Google Calendar | ✅ ma va ricollegato se cambia il dominio |

## Procedura

1. **Installa lo stack** seguendo [INSTALLAZIONE.md](INSTALLAZIONE.md) fino al
   passo 4 (non serve creare l'admin: arriva con l'import).

2. **Recupera la connection string** di Supabase: Project Settings → Database →
   *Connection string* → **Session pooler** (porta 5432). Esempio:
   ```
   postgresql://postgres.abcdefgh:PASSWORD@aws-0-eu-central-1.pooler.supabase.com:5432/postgres
   ```
   (La *Direct connection* funziona solo con IPv6.)

3. **Metti in pausa l'uso dell'app** (nessuno registri dati durante la copia).

4. **Lancia l'import**:
   ```bash
   SUPABASE_DB_URL='postgresql://postgres.abcdefgh:PASSWORD@aws-0-eu-central-1.pooler.supabase.com:5432/postgres' \
     ./scripts/importa-da-supabase.sh
   ```
   Lo script:
   - esporta utenti e dati in `backups/import_supabase_<data>/`;
   - fa un backup di sicurezza del DB locale;
   - sostituisce i dati locali **in un'unica transazione** (se qualcosa va
     storto non cambia nulla);
   - riapplica ruoli/permessi e riavvia i servizi.

5. **Verifica**: accedi con le tue solite credenziali e controlla corse, turni,
   stipendio.

6. **Aggiorna i servizi esterni** al nuovo dominio:
   - Google Cloud: redirect URI `PUBLIC_URL/auth/v1/callback` (login) e
     `PUBLIC_URL/api/google-calendar/callback` (Calendar);
   - Meta: Callback URL webhook `PUBLIC_URL/api/whatsapp/webhook`;
   - app mobile: `server.url` in `capacitor.config.ts`.

7. Dopo qualche giorno di verifica puoi mettere in pausa il progetto Supabase e
   rimuovere il deploy Vercel.

## Problemi tipici

| Messaggio | Causa / soluzione |
|---|---|
| `connection refused` / timeout al passo 1 | Usa la stringa *Session pooler*; controlla la password; su Supabase → Database → Network restrictions consenti l'IP del server. |
| `column "xyz" of relation "..." does not exist` | Sul cloud c'è una colonna aggiunta a mano che lo schema non conosce: aggiungila con un file in `database/ddl/` (vedi [DATABASE.md](DATABASE.md#modificare-lo-schema-sviluppatori)) e rilancia. Il DB locale non è stato toccato. |
| Login rifiutato dopo l'import | L'utente su Supabase non aveva confermato l'email: `docker compose exec db psql -U supabase_admin -d postgres -c "update auth.users set email_confirmed_at = now() where email = '...'"` |

## Alternativa manuale

Se preferisci non usare lo script: `pg_dump --data-only --schema=public` dal
cloud e `\copy` delle colonne essenziali di `auth.users`/`auth.identities`. Lo
script è commentato riga per riga e fa esattamente questo.
