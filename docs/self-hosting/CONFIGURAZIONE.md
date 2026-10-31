# Configurazione (`.env`)

Tutte le opzioni stanno in `.env` (copiato da `.env.example`). Dopo una
modifica:

| Tipo di variabile | Cosa fare |
|---|---|
| `PUBLIC_URL`, `ANON_KEY`, `JWT_SECRET`, tutte le `NEXT_PUBLIC_*` | **ricostruire**: `docker compose up -d --build` (sono incorporate nel codice del browser) |
| tutte le altre | `docker compose up -d` (ricrea solo i container interessati) |

---

## Base (obbligatorie)

| Variabile | Descrizione |
|---|---|
| `PUBLIC_URL` | URL pubblico, senza `/` finale. Diventa `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_APP_URL` dell'app e il `SITE_URL` di GoTrue. |
| `HTTP_PORT` | Porta del gateway sul server (default `8080`). |
| `HTTP_BIND` | Interfaccia del gateway: `0.0.0.0` (tutte) o `127.0.0.1` (solo dietro un reverse proxy / Caddy). |
| `DOMAIN` | Solo per `--profile https`: dominio per cui Caddy richiede il certificato. |
| `POSTGRES_PASSWORD` | Password del DB (generata). Vale per i ruoli `postgres`, `supabase_admin`, `authenticator`, `supabase_auth_admin`. |
| `JWT_SECRET` | Chiave che firma sessioni e chiavi API (generata, ≥ 32 caratteri). |
| `JWT_EXP` | Durata in secondi del token di sessione (default 3600; viene rinnovato in automatico). |
| `ANON_KEY` | JWT pubblico con `role=anon` (generato). |
| `SERVICE_ROLE_KEY` | JWT segreto con `role=service_role` (generato). **Non condividerlo.** |

Per rigenerare tutti i segreti (solo su installazione nuova!):
`node scripts/genera-env.mjs --forza`.

## Autenticazione

| Variabile | Default | Descrizione |
|---|---|---|
| `DISABLE_SIGNUP` | `true` | Se `false` chiunque può registrarsi dalla pagina di login. Sconsigliato. |
| `MAILER_AUTOCONFIRM` | `false` | Se `true` gli utenti non devono confermare l'email. Utile in prova senza SMTP. |

### SMTP per inviti e reset password

Usato da GoTrue (non dall'app) per le email di **invito** (Admin → Utenti →
Invita) e **recupero password**. Si può usare lo stesso Gmail della pagina Invia.

| Variabile | Esempio Gmail |
|---|---|
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | `tuo@gmail.com` |
| `SMTP_PASS` | password per le app di 16 caratteri (senza spazi) |
| `SMTP_SENDER` | `tuo@gmail.com` |
| `SMTP_SENDER_NAME` | `NoloTrack` |

Senza SMTP l'invito da interfaccia fallisce: crea gli utenti con
`scripts/crea-admin.mjs --ruolo autista` (vedi [INSTALLAZIONE.md](INSTALLAZIONE.md#5-crea-il-primo-amministratore)).

### Login con Google (facoltativo)

1. [Google Cloud Console](https://console.cloud.google.com/) → API e servizi →
   Credenziali → *Crea ID client OAuth* → Applicazione web.
2. **URI di reindirizzamento autorizzati**: `PUBLIC_URL/auth/v1/callback`
   (es. `https://nolotrack.miodominio.it/auth/v1/callback`).
3. In `.env`:
   ```ini
   GOOGLE_LOGIN_ENABLED=true
   GOOGLE_LOGIN_CLIENT_ID=xxxx.apps.googleusercontent.com
   GOOGLE_LOGIN_CLIENT_SECRET=GOCSPX-...
   ```
4. `docker compose up -d auth`

Con `DISABLE_SIGNUP=true` possono entrare con Google solo gli utenti già creati
dall'admin con la stessa email.

## Integrazioni dell'app

| Variabile | Funzione | Note |
|---|---|---|
| `GMAIL_USER`, `GMAIL_APP_PASSWORD` | Pagina **Invia**: email con PDF allegati | [Password per le app](https://myaccount.google.com/apppasswords) (richiede verifica in 2 passaggi) |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Autocompletamento indirizzi in **Nuova corsa** | Abilitare *Places API*; limitare la chiave al dominio. Rebuild. |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Collegamento **Google Calendar** (Agenda) | Client OAuth con redirect `PUBLIC_URL/api/google-calendar/callback` e API Calendar abilitata. Può essere lo stesso client del login. |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` | Notifiche push | Generare con `npx web-push generate-vapid-keys`. Rebuild. Richiede HTTPS. |
| `META_WHATSAPP_TOKEN` | WhatsApp Business: token permanente | Meta for Developers → WhatsApp → API Setup |
| `META_WHATSAPP_PHONE_NUMBER_ID` | ID del numero mittente | idem |
| `META_WHATSAPP_VERIFY_TOKEN` | Token di verifica webhook | Generato da `genera-env.mjs`; va copiato su Meta |
| `META_WHATSAPP_APP_SECRET` | Verifica firma dei webhook | Fortemente consigliato |

**Webhook WhatsApp**: su Meta for Developers → WhatsApp → Configuration →
Callback URL = `PUBLIC_URL/api/whatsapp/webhook`, Verify token =
`META_WHATSAPP_VERIFY_TOKEN`, iscriversi al campo `messages`. Meta richiede
**HTTPS pubblico**.

## Sito vetrina pubblico (facoltativi, rebuild)

| Variabile | Mostrato su `/` |
|---|---|
| `NEXT_PUBLIC_CONTACT_PHONE` | telefono (link `tel:`) |
| `NEXT_PUBLIC_CONTACT_EMAIL` | email (link `mailto:`) |
| `NEXT_PUBLIC_CONTACT_CITY` | zona di servizio (default "Roma e provincia") |
| `NEXT_PUBLIC_NCC_LICENSE` | numero licenza NCC |
| `NEXT_PUBLIC_WHATSAPP_DISPLAY_NUMBER` | link `wa.me` |

I campi vuoti spariscono dalla pagina.

## Variabili impostate da `docker-compose.yml` (non toccare)

| Variabile | Valore | Perché |
|---|---|---|
| `SUPABASE_INTERNAL_URL` | `http://gateway` | il server Next.js raggiunge auth/rest dalla rete interna |
| `TZ` (app, db) | `Europe/Rome` | date "oggi" e report coerenti con l'Italia |
