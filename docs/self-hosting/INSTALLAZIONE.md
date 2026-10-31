# Installazione self-hosted (Docker)

Guida passo-passo per installare NoloTrack su un proprio server, **senza Vercel
e senza Supabase cloud**. Tempo stimato: 20–30 minuti.

> Prima volta? Leggi anche [ARCHITETTURA.md](ARCHITETTURA.md) per capire cosa
> viene installato, e [CONFIGURAZIONE.md](CONFIGURAZIONE.md) per tutte le opzioni.

---

## 1. Requisiti

| Cosa | Minimo | Consigliato |
|---|---|---|
| Sistema | Linux x86_64 o ARM64 (Ubuntu 22.04+/Debian 12+) — vanno bene anche macOS/Windows con Docker Desktop | VPS dedicata |
| CPU / RAM | 2 vCPU / **4 GB** (la build di Next.js è pesante) | 2 vCPU / 4 GB |
| Disco | 10 GB liberi | 20 GB + spazio per i backup |
| Software | Docker Engine 24+ con plugin `docker compose` v2, `git` | — |
| Rete | accesso a internet durante la build (pacchetti npm e Google Fonts) | dominio + porte 80/443 aperte per HTTPS |

Node.js sul server **non serve**: tutti i comandi `node` qui sotto si possono
lanciare anche dentro un container (vedi il riquadro nel passo 3).

Installazione di Docker su Ubuntu/Debian:

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER   # poi esci e rientra
docker compose version          # deve rispondere v2.x
```

> **Poca RAM (VPS da 1–2 GB)?** Costruisci l'immagine su un altro PC e
> trasferiscila: `docker save nolotrack-app | ssh server docker load`, poi sul
> server usa `docker compose up -d --no-build`. Oppure aggiungi 4 GB di swap.

---

## 2. Scarica il codice

```bash
sudo mkdir -p /opt/nolotrack && sudo chown $USER /opt/nolotrack
git clone https://github.com/micoromano/nolotrack.git /opt/nolotrack
cd /opt/nolotrack
git checkout claude/docker-self-hosting   # oppure master, quando sarà unito
```

---

## 3. Configura `.env` e genera i segreti

```bash
cp .env.example .env
node scripts/genera-env.mjs
```

Lo script compila `POSTGRES_PASSWORD`, `JWT_SECRET`, `ANON_KEY`,
`SERVICE_ROLE_KEY` e `META_WHATSAPP_VERIFY_TOKEN`. Rilanciarlo non sovrascrive
i valori già presenti.

> **Senza Node sul server:**
> ```bash
> docker run --rm -v "$PWD":/w -w /w node:22-alpine node scripts/genera-env.mjs
> ```

Poi apri `.env` e imposta almeno:

```ini
# URL con cui raggiungerai l'app, senza "/" finale
PUBLIC_URL=http://localhost:8080          # prova in locale
# PUBLIC_URL=http://192.168.1.50:8080     # server in rete locale
# PUBLIC_URL=https://nolotrack.miodominio.it   # produzione (vedi passo 6)
```

Tutto il resto (email, Google, WhatsApp…) è facoltativo e si può aggiungere
dopo: vedi [CONFIGURAZIONE.md](CONFIGURAZIONE.md).

> 🔒 `.env` contiene segreti: non committarlo, non condividerlo.
> `chmod 600 .env` è una buona idea.

---

## 4. Avvia

```bash
docker compose up -d --build
```

La prima volta ci vogliono 3–8 minuti (download immagini + build dell'app).
Controlla lo stato:

```bash
docker compose ps
```

Risultato atteso:

```
SERVICE   STATUS
app       Up (healthy)
auth      Up (healthy)
db        Up (healthy)
gateway   Up
migrate   Exited (0)      ← normale: applica lo schema e termina
rest      Up
```

Se `migrate` è `Exited (1)` o qualcosa non parte: `docker compose logs migrate`
e [TROUBLESHOOTING.md](TROUBLESHOOTING.md).

---

## 5. Crea il primo amministratore

La registrazione libera è disattivata: gli utenti li crea l'admin.

```bash
docker compose exec app node scripts/crea-admin.mjs \
  --email tua@email.it --password 'UnaPasswordLunga!' --nome "Mario Rossi"
```

Apri `PUBLIC_URL` (es. <http://localhost:8080>) → **Accedi** → inserisci email
e password. Sei dentro.

Altri utenti:

- **dall'app**: Admin → Utenti → *Invita* (serve l'SMTP configurato, vedi
  [CONFIGURAZIONE.md](CONFIGURAZIONE.md#smtp-per-inviti-e-reset-password));
- **da riga di comando**, senza email:
  ```bash
  docker compose exec app node scripts/crea-admin.mjs \
    --email autista@email.it --password 'Password123!' --nome "Luigi" --ruolo autista
  ```

### (Facoltativo) Dati di prova

Per vedere subito l'app "piena" (turni, corse, spese, rifornimenti del mese):

```bash
docker compose exec -T db psql -U supabase_admin -d postgres \
  -v email=tua@email.it < database/dml/900_dati_demo.sql
```

Le righe demo sono marcate `[demo]`; per eliminarle vedi
[DATABASE.md](DATABASE.md#dati-demo).

---

## 6. Produzione: dominio e HTTPS

Servono un dominio (es. `nolotrack.miodominio.it`) con record DNS **A** verso
l'IP del server e le porte **80 e 443** aperte nel firewall.

### Opzione A — Caddy incluso (consigliata, certificato automatico)

In `.env`:

```ini
PUBLIC_URL=https://nolotrack.miodominio.it
DOMAIN=nolotrack.miodominio.it
HTTP_BIND=127.0.0.1      # il gateway non resta esposto direttamente
```

Poi:

```bash
docker compose --profile https up -d --build
```

Caddy ottiene e rinnova da solo il certificato Let's Encrypt. Ricorda di usare
sempre `--profile https` nei comandi `up` successivi.

### Opzione B — reverse proxy già presente (nginx, Traefik, Cloudflare Tunnel…)

Inoltra tutto il traffico del dominio a `http://127.0.0.1:8080` (porta
`HTTP_PORT`) passando l'header `X-Forwarded-Proto: https`. Esempio nginx:

```nginx
server {
  server_name nolotrack.miodominio.it;
  listen 443 ssl;   # certificati gestiti da certbot
  location / {
    proxy_pass http://127.0.0.1:8080;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto https;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  }
}
```

> ⚠ Ogni volta che cambi `PUBLIC_URL` serve `docker compose up -d --build`:
> l'URL è incorporato nel codice che gira nel browser.

---

## 7. Dopo l'installazione

- **Backup automatici** → [BACKUP-E-AGGIORNAMENTI.md](BACKUP-E-AGGIORNAMENTI.md)
  (5 minuti, fallo subito).
- **Dati da Supabase cloud** → [MIGRAZIONE-DA-SUPABASE.md](MIGRAZIONE-DA-SUPABASE.md).
- **Email, Google Maps, WhatsApp, notifiche** → [CONFIGURAZIONE.md](CONFIGURAZIONE.md).
- **App Android/iOS**: in `capacitor.config.ts` imposta `server.url` al tuo
  `PUBLIC_URL` (vedi [../app-mobile.md](../app-mobile.md)).
- **Come si usa l'app** → [../MANUALE-UTENTE.md](../MANUALE-UTENTE.md).

## Comandi utili

| Azione | Comando |
|---|---|
| Stato servizi | `docker compose ps` |
| Log in tempo reale | `docker compose logs -f app` (o `auth`, `rest`, `db`, `gateway`) |
| Fermare tutto | `docker compose down` (i dati restano nel volume) |
| Riavviare | `docker compose restart` |
| Console SQL | `docker compose exec db psql -U supabase_admin -d postgres` |
| Ricostruire l'app | `docker compose up -d --build app` |
| ⚠ Cancellare TUTTO, dati compresi | `docker compose down -v` |
