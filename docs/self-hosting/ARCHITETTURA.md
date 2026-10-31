# Architettura self-hosted

NoloTrack nasce su **Vercel** (hosting Next.js) + **Supabase cloud** (database,
login, API). Il codice usa di Supabase solo due componenti, entrambi open source:

| Componente Supabase | A cosa serve in NoloTrack | Self-hosted con |
|---|---|---|
| **Auth** (GoTrue) | login email/password, Google, inviti, reset password | `supabase/gotrue` |
| **REST** (PostgREST) | ogni lettura/scrittura dati da `supabase-js` (`.from("corse")…`) | `postgrest/postgrest` |
| PostgreSQL | database | `supabase/postgres` |

Storage, Realtime, Edge Functions e Studio **non** sono usati e non vengono
installati. L'app gira quindi senza modifiche funzionali: parla con lo stack
locale esattamente come parlava con Supabase cloud.

## Schema

```
                 Internet / rete locale
                          │
            ┌─────────────▼─────────────┐   solo con --profile https
            │ caddy :80/:443 (TLS auto) │
            └─────────────┬─────────────┘
                          │
            ┌─────────────▼─────────────┐
            │ gateway (nginx) :HTTP_PORT│   unico punto di ingresso
            └──┬──────────┬──────────┬──┘
     /auth/v1/*│ /rest/v1/*│          │ tutto il resto
        ┌──────▼───┐ ┌─────▼─────┐ ┌──▼──────────────┐
        │ auth     │ │ rest      │ │ app (Next.js)   │──┐ lato server:
        │ GoTrue   │ │ PostgREST │ │ pagine + /api/* │  │ SUPABASE_INTERNAL_URL
        └──────┬───┘ └─────┬─────┘ └─────────────────┘  │ = http://gateway
               │           │                 ▲          │
               │           │                 └──────────┘
        ┌──────▼───────────▼─────┐
        │ db (PostgreSQL 15)     │◀── migrate (one-shot): database/ddl + dml
        │ volume: db-data        │
        └────────────────────────┘
```

### Perché una sola origine

Browser, app e API stanno tutti sotto lo **stesso dominio** (`PUBLIC_URL`):
`PUBLIC_URL/rest/v1`, `PUBLIC_URL/auth/v1`. Vantaggi: niente CORS, un solo
certificato, un solo indirizzo da configurare (`NEXT_PUBLIC_SUPABASE_URL =
PUBLIC_URL`).

### URL interno per il server Next.js

Dentro Docker, il server Next.js non può usare l'URL pubblico (es.
`http://localhost:8080` dentro il container punterebbe a se stesso). Per questo
`lib/supabase/config.ts` usa `SUPABASE_INTERNAL_URL` (`http://gateway`) lato
server e l'URL pubblico nel browser. Il **nome del cookie di sessione** è
sempre calcolato dall'URL pubblico, così browser e server condividono la stessa
sessione. Su Vercel `SUPABASE_INTERNAL_URL` non è impostata e il comportamento
è identico a prima.

## Sicurezza

- **Row Level Security** su tutte le tabelle: ogni autista vede e modifica solo
  le proprie righe (`autista_id = auth.uid()`); l'admin vede anche la lista
  autisti. Il ruolo `anon` (utente non loggato) non ha accesso a nessuna tabella.
- **JWT**: `JWT_SECRET` firma i token di sessione e le chiavi API.
  `ANON_KEY` è pubblica (sta nel browser); `SERVICE_ROLE_KEY` bypassa la RLS e
  resta **solo** nel container `app` (webhook WhatsApp, inviti, script admin).
- **Registrazione disattivata** (`DISABLE_SIGNUP=true`): nessuno può crearsi un
  account da solo.
- Il **database non è esposto** fuori dalla rete Docker (porta 5432 chiusa).
- Header di sicurezza HTTP impostati da `next.config.ts`.

## File coinvolti

| Percorso | Ruolo |
|---|---|
| `docker-compose.yml` | definizione dei servizi |
| `Dockerfile` | immagine dell'app (Next.js `standalone`, Node 22 Alpine) |
| `.env.example` → `.env` | configurazione e segreti |
| `docker/db/*.sql` | password ruoli e JWT, eseguiti solo alla creazione del volume |
| `docker/migrate/migrate.sh` | applica `database/` a ogni avvio (idempotente) |
| `docker/nginx/default.conf` | instradamento del gateway |
| `docker/caddy/Caddyfile` | HTTPS automatico |
| `database/ddl`, `database/dml` | schema e dati di base, vedi [DATABASE.md](DATABASE.md) |
| `scripts/` | segreti, admin, backup, ripristino |
| `lib/supabase/config.ts` | URL interno/pubblico e nome cookie |
