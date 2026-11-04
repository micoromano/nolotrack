# Installazione su Kubernetes

Stessa architettura dell'installazione Docker ([ARCHITETTURA.md](ARCHITETTURA.md)),
con manifest Kustomize in [`deploy/k8s/`](../../deploy/k8s).

> ⚠ **Stato**: i manifest sono stati renderizzati con `kubectl kustomize` e
> controllati con uno script di coerenza (variabili, chiavi di ConfigMap/Secret,
> selettori, porte, probe), ma **non ancora provati su un cluster reale**. Le
> immagini e gli script SQL sono gli stessi dell'installazione Docker, che invece
> è testata end-to-end. Alla prima installazione segui i log con attenzione.

Per un solo server, Docker Compose ([INSTALLAZIONE.md](INSTALLAZIONE.md)) è più
semplice. Kubernetes conviene se hai già un cluster (k3s, EKS, GKE, AKS…) o vuoi
rollout, probe e backup gestiti dal cluster.

---

## Cosa viene creato

| Risorsa | Contenuto |
|---|---|
| `Namespace` | `nolotrack` |
| `ConfigMap nolotrack-config` | configurazione **non segreta**: `PUBLIC_URL`, SMTP, login Google, integrazioni, `TZ` |
| `Secret nolotrack-secrets` | password DB, `JWT_SECRET`, `ANON_KEY`, `SERVICE_ROLE_KEY`, password SMTP/Gmail, token WhatsApp… |
| `ConfigMap gateway-nginx` | instradamento del gateway (`/auth/v1`, `/rest/v1`, app) |
| `ConfigMap db-init` | password dei ruoli e JWT nel DB, eseguiti solo alla prima inizializzazione |
| `StatefulSet db` + PVC | PostgreSQL 15 (immagine Supabase), 1 replica |
| `Deployment auth` | GoTrue |
| `Deployment rest` | PostgREST |
| `Deployment app` | Next.js + **initContainer `migrate`** che applica lo schema prima dell'avvio |
| `Deployment gateway` | nginx, unico ingresso |
| `Ingress nolotrack` | dominio pubblico → gateway (TLS con cert-manager) |
| `CronJob backup` + PVC | `pg_dump` ogni notte alle 3, ultimi 30 backup |
| `NetworkPolicy` | DB raggiungibile solo dai servizi interni; app/auth/rest solo dal gateway |

ConfigMap e Secret sono **generati** da Kustomize con un suffisso hash sul
contenuto (`nolotrack-config-d2k584fkbk`): quando cambi un valore e riapplichi,
i pod che lo usano ripartono da soli.

### Perché lo schema SQL è in un'immagine e non in una ConfigMap

Gli script di `database/` vengono copiati nell'immagine `nolotrack-migrate`
(`docker/migrate/Dockerfile`), eseguita come initContainer dell'app. In questo modo:

- lo schema ha **la stessa versione del codice**: aggiornando il tag
  dell'immagine si aggiornano insieme app e database;
- il migrate parte a ogni rollout ed è sicuro con più repliche (le istanze si
  mettono in coda grazie a un advisory lock di PostgreSQL);
- Kustomize non può leggere file fuori dalla cartella `deploy/k8s`, quindi una
  ConfigMap con l'SQL vorrebbe dire una copia da tenere allineata a mano.

## Requisiti

- Kubernetes ≥ 1.27 (per `timeZone` nel CronJob), `kubectl` con Kustomize integrato
- un **Ingress controller** (i manifest assumono ingress-nginx; per Traefik e
  altri adatta `ingressClassName` e l'annotazione `proxy-body-size`)
- **cert-manager** con un `ClusterIssuer` (per HTTPS automatico), oppure un
  certificato già presente nel Secret `nolotrack-tls`
- una **StorageClass** di default (PVC per database e backup)
- un **registry** di immagini (GHCR, Docker Hub, registry privato) e Docker per la build

## 1. Prepara l'overlay

```bash
cp -r deploy/k8s/overlays/produzione deploy/k8s/overlays/mio-sito   # facoltativo
cd deploy/k8s/overlays/produzione
```

| File | Cosa contiene | Si committa? |
|---|---|---|
| `config.env` | ConfigMap: `PUBLIC_URL`, SMTP, integrazioni | sì |
| `secrets.env` | Secret (da `secrets.env.example`) | **no** (in `.gitignore`) |
| `build.env` | `NEXT_PUBLIC_*` incorporate nell'immagine (Maps, VAPID, contatti vetrina) | sì |
| `kustomization.yaml` | immagini, dominio dell'Ingress, dimensione disco DB | sì |

1. In `config.env` imposta `PUBLIC_URL=https://nolotrack.miodominio.it`.
2. Genera i segreti (dalla radice del repository):
   ```bash
   node scripts/genera-env.mjs \
     --file deploy/k8s/overlays/produzione/secrets.env \
     --template deploy/k8s/overlays/produzione/secrets.env.example
   ```
   Poi aggiungi a mano in `secrets.env` le password facoltative (SMTP, Gmail, WhatsApp…).
3. In `kustomization.yaml` sostituisci `nolotrack.miodominio.it` (host e TLS) e,
   se serve, il nome del `ClusterIssuer` (`letsencrypt`).

Il significato di ogni variabile è in [CONFIGURAZIONE.md](CONFIGURAZIONE.md):
i nomi sono gli stessi. La divisione tra ConfigMap e Secret è questa:

| ConfigMap (`config.env`) | Secret (`secrets.env`) |
|---|---|
| `PUBLIC_URL`, `JWT_EXP`, `DISABLE_SIGNUP`, `MAILER_AUTOCONFIRM` | `POSTGRES_PASSWORD`, `JWT_SECRET`, `ANON_KEY`, `SERVICE_ROLE_KEY` |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_SENDER`, `SMTP_SENDER_NAME` | `SMTP_PASS` |
| `GOOGLE_LOGIN_ENABLED`, `GOOGLE_LOGIN_CLIENT_ID` | `GOOGLE_LOGIN_CLIENT_SECRET` |
| `GMAIL_USER` | `GMAIL_APP_PASSWORD` |
| `GOOGLE_CLIENT_ID` | `GOOGLE_CLIENT_SECRET` |
| `META_WHATSAPP_PHONE_NUMBER_ID` | `META_WHATSAPP_TOKEN`, `META_WHATSAPP_VERIFY_TOKEN`, `META_WHATSAPP_APP_SECRET`, `VAPID_PRIVATE_KEY` |
| `TZ` | |

## 2. Costruisci e pubblica le immagini

L'immagine dell'app incorpora `PUBLIC_URL` e `ANON_KEY` (vengono eseguite nel
browser): è quindi **specifica per l'installazione**.

```bash
docker login ghcr.io          # o il tuo registry
./scripts/k8s-build.sh deploy/k8s/overlays/produzione ghcr.io/<utente> 1.0.0 --push
```

Lo script costruisce `nolotrack-app` e `nolotrack-migrate`, le pubblica e
aggiorna `newName`/`newTag` nel `kustomization.yaml` dell'overlay. Se il
registry è privato, crea un `imagePullSecret` e aggiungilo ai Deployment con una
patch nell'overlay.

## 3. Applica

```bash
kubectl kustomize deploy/k8s/overlays/produzione | python3 scripts/k8s-verifica.py -   # controllo (facoltativo)
kubectl apply -k deploy/k8s/overlays/produzione
kubectl -n nolotrack get pods -w
```

Al primo avvio l'ordine si sistema da solo: `db` si inizializza, `auth` crea lo
schema utenti, l'initContainer `migrate` dell'app attende entrambi e applica lo
schema, poi parte l'app. Stato atteso:

```
NAME                       READY   STATUS
app-xxxxx                  1/1     Running
auth-xxxxx                 1/1     Running
db-0                       1/1     Running
gateway-xxxxx              1/1     Running
rest-xxxxx                 1/1     Running
```

Log del migrate: `kubectl -n nolotrack logs deploy/app -c migrate`.

## 4. Primo amministratore

```bash
kubectl -n nolotrack exec deploy/app -- node scripts/crea-admin.mjs \
  --email tua@email.it --password 'UnaPasswordLunga!' --nome "Mario Rossi"
```

Dati demo (facoltativi):

```bash
kubectl -n nolotrack exec -i statefulset/db -c postgres -- \
  psql -U supabase_admin -d postgres -v email=tua@email.it < database/dml/900_dati_demo.sql
```

## Operazioni

| Azione | Comando |
|---|---|
| Stato | `kubectl -n nolotrack get pods,ingress,pvc` |
| Log | `kubectl -n nolotrack logs deploy/app` (o `auth`, `rest`, `gateway`, `statefulset/db`) |
| Cambiare configurazione | modifica `config.env`/`secrets.env` → `kubectl apply -k <overlay>` |
| Aggiornare l'app | `./scripts/k8s-build.sh <overlay> <registry> <nuovo-tag> --push` → `kubectl apply -k <overlay>` |
| Console SQL | `kubectl -n nolotrack exec -it statefulset/db -c postgres -- psql -U supabase_admin -d postgres` |
| Backup subito | `kubectl -n nolotrack create job --from=cronjob/backup backup-manuale` |
| Backup sul tuo PC | `K8S_NAMESPACE=nolotrack ./scripts/backup.sh` |
| Ripristino | `K8S_NAMESPACE=nolotrack ./scripts/ripristina.sh backups/<file>.dump` |

⚠ Se cambi `PUBLIC_URL` o `ANON_KEY` devi **ricostruire l'immagine dell'app**:
non basta riapplicare la ConfigMap.

### Backup

Il CronJob salva ogni notte i dati nel PVC `backups` (ultimi 30). Un backup
dentro al cluster non protegge dalla perdita del cluster: scarica regolarmente
una copia sul tuo PC (o pianificalo con cron su un'altra macchina):

```bash
K8S_NAMESPACE=nolotrack ./scripts/backup.sh     # → backups/nolotrack_<data>.dump in locale
```

`ripristina.sh` e `backup.sh` con `K8S_NAMESPACE` usano `kubectl exec` e `kubectl
scale` invece di `docker compose`: il ripristino resta transazionale (se il file
è danneggiato non cambia nulla).

### Migrare da Supabase cloud o da Docker Compose

1. Importa i dati in un'installazione Docker locale
   ([MIGRAZIONE-DA-SUPABASE.md](MIGRAZIONE-DA-SUPABASE.md)), oppure parti dalla tua
   installazione Docker esistente.
2. `./scripts/backup.sh` (lato Docker)
3. `K8S_NAMESPACE=nolotrack ./scripts/ripristina.sh backups/<file>.dump`

## Scalabilità

- `app` e `gateway` sono senza stato: puoi aumentare `replicas` (o aggiungere un
  HorizontalPodAutoscaler). Il migrate resta sicuro grazie all'advisory lock.
- `auth` e `rest` reggono senza problemi più repliche, ma per un'attività NCC una
  basta e avanza.
- `db` deve restare a **1 replica**. Per alta disponibilità usa un operatore
  PostgreSQL (CloudNativePG) o un database gestito, e punta `db` lì.

## Problemi comuni

| Sintomo | Verifica |
|---|---|
| `app` resta in `Init:0/1` | `kubectl -n nolotrack logs deploy/app -c migrate`: attende il DB o lo schema auth, oppure c'è un errore SQL |
| `ImagePullBackOff` | nome/tag dell'immagine nell'overlay, `imagePullSecret` per i registry privati |
| `db-0` in `Pending` | nessuna StorageClass di default: `kubectl get storageclass` |
| Il login torna sempre alla pagina di login | `PUBLIC_URL` diverso dal dominio dell'Ingress, oppure immagine costruita con un altro `PUBLIC_URL`/`ANON_KEY` |
| Pod in `CrashLoopBackOff` dopo aver cambiato `POSTGRES_PASSWORD` | la password nel DB si imposta solo al primo avvio: vedi [TROUBLESHOOTING.md](TROUBLESHOOTING.md) (usa `kubectl exec` al posto di `docker compose exec`) |
| Certificato non emesso | `kubectl -n nolotrack describe certificate nolotrack-tls`, DNS del dominio verso l'Ingress |

Per tutto il resto, [TROUBLESHOOTING.md](TROUBLESHOOTING.md) vale anche qui:
sostituisci `docker compose exec <servizio>` con
`kubectl -n nolotrack exec deploy/<servizio>` (`statefulset/db -c postgres` per il DB).
