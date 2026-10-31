# Risoluzione problemi

Primo passo, sempre:

```bash
docker compose ps
docker compose logs --tail=50 <servizio>     # app, auth, rest, db, migrate, gateway
```

## Avvio

### `migrate` è `Exited (1)`
`docker compose logs migrate` mostra il file SQL e l'errore. Cause tipiche:
- uno script modificato a mano con un errore di sintassi;
- password errata: vedi sotto *password authentication failed*.

Corretto il problema: `docker compose up -d`.

### `password authentication failed for user "supabase_admin"` / `"authenticator"`
`POSTGRES_PASSWORD` in `.env` è cambiata **dopo** la creazione del database (la
password nel DB viene impostata solo la prima volta). Soluzioni:
- rimetti in `.env` la password originale, oppure
- aggiorna le password nel DB:
  ```bash
  docker compose exec db psql -U supabase_admin -d postgres -c "
    ALTER USER supabase_admin      WITH PASSWORD 'NUOVA';
    ALTER USER authenticator       WITH PASSWORD 'NUOVA';
    ALTER USER supabase_auth_admin WITH PASSWORD 'NUOVA';
    ALTER USER postgres            WITH PASSWORD 'NUOVA';"
  docker compose up -d
  ```
  (dentro il container la connessione locale non richiede password).
- installazione nuova senza dati: `docker compose down -v` e riparti.

### `app` non diventa `healthy` / la build fallisce
- `JavaScript heap out of memory` durante la build → servono ~4 GB di RAM: aggiungi
  swap o costruisci l'immagine altrove (vedi INSTALLAZIONE, requisiti).
- `Failed to fetch font` → la build deve raggiungere `fonts.googleapis.com`.
- `NEXT_PUBLIC_SUPABASE_URL / ANON_KEY mancanti` → `.env` incompleto: `node scripts/genera-env.mjs`.

### Porta già in uso (`bind: address already in use`)
Cambia `HTTP_PORT` in `.env` (es. `8081`), aggiorna `PUBLIC_URL` e
`docker compose up -d --build`.

## Login

### "Invalid login credentials"
Email o password errati, oppure l'utente non esiste. Ricrea/promuovi con
`docker compose exec app node scripts/crea-admin.mjs --email ... --password ...`
(se l'utente esiste la password non viene cambiata: vedi sotto).

### Ho dimenticato la password dell'admin
```bash
docker compose exec db psql -U supabase_admin -d postgres -c "
  UPDATE auth.users SET encrypted_password = crypt('NuovaPassword123', gen_salt('bf'))
  WHERE email = 'tua@email.it';"
```

### Dopo il login torno sempre alla pagina di login
- `PUBLIC_URL` non corrisponde all'indirizzo nella barra del browser (es.
  `localhost` vs IP, `http` vs `https`). Correggi e `docker compose up -d --build`.
- Hai cambiato `JWT_SECRET` senza ricostruire: `docker compose up -d --build`.

### "Signups not allowed for this instance"
Normale: la registrazione libera è disattivata. Crea l'utente dall'admin.

### L'invito via email non arriva
- SMTP non configurato: `SMTP_*` in `.env`, poi `docker compose up -d auth`.
- `docker compose logs auth | grep -i smtp` per l'errore preciso.
- Gmail: serve la *password per le app*, non quella dell'account.

### Login con Google: `redirect_uri_mismatch`
Su Google Cloud l'URI deve essere esattamente `PUBLIC_URL/auth/v1/callback`.

## Dati

### "permission denied for table …" nell'app
Lo schema è incompleto: `docker compose run --rm migrate` e controlla l'esito.

### Un utente non vede i dati / la pagina Admin è vuota
Controlla il ruolo:
```bash
docker compose exec db psql -U supabase_admin -d postgres -c "
  SELECT a.email, r.nome FROM autisti a LEFT JOIN ruoli r ON r.id = a.ruolo_id;"
```
Per promuovere: `crea-admin.mjs --email ... --ruolo admin`.

### Orari/date sfasati
Il fuso dei container è `Europe/Rome`. Se il problema è nel browser, controlla
il fuso del dispositivo.

## Integrazioni

| Sintomo | Verifica |
|---|---|
| Invia: "Gmail non configurato" | `GMAIL_USER`, `GMAIL_APP_PASSWORD` in `.env` → `docker compose up -d app` |
| Indirizzi senza suggerimenti | `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` + Places API abilitata → **rebuild** |
| WhatsApp: Meta non verifica il webhook | serve HTTPS pubblico; Verify token = `META_WHATSAPP_VERIFY_TOKEN`; `docker compose logs app` |
| Notifiche push non attivabili | servono HTTPS e chiavi VAPID (pubblica → rebuild) |

## Ripartire da zero

```bash
docker compose down -v      # ⚠ cancella database e certificati
docker compose up -d --build
```
