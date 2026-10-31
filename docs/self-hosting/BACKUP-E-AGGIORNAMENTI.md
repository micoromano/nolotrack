# Backup, ripristino e aggiornamenti

## Backup

```bash
./scripts/backup.sh
# → backups/nolotrack_20261031_030000.dump
```

Il backup contiene **tutti i dati**: utenti (con password cifrate) e dati
dell'app. La struttura delle tabelle non serve: è nel codice e la ricrea il
servizio `migrate`.

### Backup automatico ogni notte

```bash
crontab -e
```

```cron
# ogni notte alle 3, conserva gli ultimi 30
0 3 * * * cd /opt/nolotrack && CONSERVA=30 ./scripts/backup.sh >> backups/backup.log 2>&1
```

### Copia fuori dal server (fondamentale)

Un backup sullo stesso disco non protegge da guasti o furti del server. Copia
regolarmente `backups/` altrove, ad esempio:

```bash
# su un altro computer / NAS
rsync -av utente@server:/opt/nolotrack/backups/ ~/backup-nolotrack/

# oppure verso un cloud con rclone (Google Drive, S3, …)
rclone copy /opt/nolotrack/backups remoto:nolotrack-backups
```

Conserva anche una copia del file **`.env`** in un posto sicuro (password
manager): senza `JWT_SECRET`/`POSTGRES_PASSWORD` originali il ripristino resta
possibile, ma dovrai rigenerare le chiavi e ricostruire l'app.

## Ripristino

```bash
./scripts/ripristina.sh backups/nolotrack_20261031_030000.dump
```

Lo script chiede conferma, fa un **backup di sicurezza** dello stato attuale,
poi sostituisce i dati in un'unica transazione: se il file è danneggiato non
cambia nulla.

### Ripristino su un server nuovo

1. Installa lo stack ([INSTALLAZIONE.md](INSTALLAZIONE.md)) passi 1–4.
2. Copia il file `.dump` in `backups/`.
3. `./scripts/ripristina.sh backups/<file>.dump`

## Aggiornare NoloTrack

```bash
cd /opt/nolotrack
./scripts/backup.sh                 # sempre, prima di aggiornare
git pull
docker compose up -d --build        # aggiungi --profile https se usi Caddy
docker compose ps                   # migrate: Exited (0)
```

Il servizio `migrate` applica automaticamente le modifiche allo schema
(gli script sono idempotenti). In caso di problemi:

```bash
git log --oneline -5                # trova la versione precedente
git checkout <commit-precedente>
docker compose up -d --build
./scripts/ripristina.sh backups/<backup-pre-aggiornamento>.dump   # se necessario
```

## Aggiornare i componenti (PostgreSQL, GoTrue, PostgREST)

Le versioni sono fissate in `docker-compose.yml` per stabilità. Per
aggiornarle: backup → cambia il tag dell'immagine → `docker compose up -d`.

- **GoTrue e PostgREST**: aggiornamenti minori sicuri; GoTrue migra da solo il
  proprio schema `auth`.
- **PostgreSQL major** (es. 15 → 17): il volume non è compatibile. Procedura:
  backup → `docker compose down` → `docker volume rm nolotrack_db-data` →
  nuovo tag → `docker compose up -d` → ripristino del backup.

## Spazio su disco

```bash
docker system df                    # spazio usato da Docker
docker image prune -f               # rimuove le immagini vecchie dopo gli aggiornamenti
du -sh backups/                     # dimensione backup
```
