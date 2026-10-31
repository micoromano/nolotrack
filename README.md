# NoloTrack

Gestionale per **NCC (Noleggio Con Conducente)**: turni, corse, cassa, spese,
carburante, stipendio, rapportini PDF, invio email e comunicazione WhatsApp.
Sostituisce il workflow Excel (BASE_CALCOLI.xlsx + template rapportino).

Stack: Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Supabase
(PostgreSQL + Auth) · @react-pdf/renderer · Capacitor (app mobile).

## Documentazione

| | |
|---|---|
| 📘 **Uso dell'app** | [docs/MANUALE-UTENTE.md](docs/MANUALE-UTENTE.md) |
| 🐳 **Installazione self-hosted (Docker)** | [docs/self-hosting/](docs/self-hosting/README.md) |
| 🗄️ **Database (DDL/DML)** | [docs/self-hosting/DATABASE.md](docs/self-hosting/DATABASE.md) · [`database/`](database) |
| 📱 **App mobile** | [docs/app-mobile.md](docs/app-mobile.md) |
| 🤖 **Guida per sviluppatori / AI** | [CLAUDE.md](CLAUDE.md) |

## Due modi di installarla

### 1. Self-hosted con Docker (tutto sul proprio server)

Database, autenticazione, API e app girano in container sul tuo server, senza
servizi cloud esterni.

```bash
git clone https://github.com/micoromano/nolotrack.git && cd nolotrack
cp .env.example .env
node scripts/genera-env.mjs          # genera i segreti; poi imposta PUBLIC_URL in .env
docker compose up -d --build
docker compose exec app node scripts/crea-admin.mjs --email tu@email.it --password 'Password123!'
```

Apri `PUBLIC_URL` (default <http://localhost:8080>). Guida completa con HTTPS,
backup e migrazione dei dati: [docs/self-hosting/INSTALLAZIONE.md](docs/self-hosting/INSTALLAZIONE.md).

### 2. Vercel + Supabase cloud

1. Crea un progetto Supabase ed esegui nel SQL Editor i file di
   `database/ddl/` e poi `database/dml/100_ruoli_permessi.sql`
   ([dettagli](docs/self-hosting/DATABASE.md#su-supabase-cloud-nuovo-progetto)).
2. Importa il repository su Vercel e imposta le variabili d'ambiente elencate
   in [CLAUDE.md](CLAUDE.md#variabili-dambiente-envlocal)
   (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_APP_URL`, …).

## Sviluppo locale

```bash
npm install
# .env.local con le credenziali di un progetto Supabase di sviluppo:
#   NEXT_PUBLIC_SUPABASE_URL=...  NEXT_PUBLIC_SUPABASE_ANON_KEY=...
#   (elenco completo in CLAUDE.md → "Variabili d'ambiente")
npm run dev                  # http://localhost:3000
```

Per provare le modifiche sullo stack self-hosted: `docker compose up -d --build app`
(l'app viene ricostruita con il codice locale).

| Comando | |
|---|---|
| `npm run dev` | server di sviluppo |
| `npm run build` / `npm start` | build e avvio di produzione |
| `npm run lint` | ESLint |
| `npm test` | test unitari (Vitest) |
| `npm run test:e2e` | test end-to-end (Playwright) |
