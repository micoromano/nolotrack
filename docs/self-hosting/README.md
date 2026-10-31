# NoloTrack self-hosted

Documentazione per installare NoloTrack sul proprio server con Docker, senza
Vercel e senza Supabase cloud.

| Documento | Per cosa |
|---|---|
| [INSTALLAZIONE.md](INSTALLAZIONE.md) | **Inizia da qui**: requisiti, installazione passo-passo, HTTPS, primo admin |
| [CONFIGURAZIONE.md](CONFIGURAZIONE.md) | Tutte le variabili di `.env`: email, Google, WhatsApp, notifiche |
| [ARCHITETTURA.md](ARCHITETTURA.md) | Cosa viene installato e come comunicano i servizi |
| [DATABASE.md](DATABASE.md) | Script SQL DDL/DML, modello dati, sicurezza RLS, uso su altri PostgreSQL |
| [MIGRAZIONE-DA-SUPABASE.md](MIGRAZIONE-DA-SUPABASE.md) | Portare utenti e dati dal cloud |
| [BACKUP-E-AGGIORNAMENTI.md](BACKUP-E-AGGIORNAMENTI.md) | Backup automatici, ripristino, aggiornamenti |
| [TROUBLESHOOTING.md](TROUBLESHOOTING.md) | Problemi comuni e soluzioni |
| [../MANUALE-UTENTE.md](../MANUALE-UTENTE.md) | Come si usa l'app |

## In breve

```bash
git clone https://github.com/micoromano/nolotrack.git && cd nolotrack
cp .env.example .env && node scripts/genera-env.mjs     # poi imposta PUBLIC_URL
docker compose up -d --build
docker compose exec app node scripts/crea-admin.mjs --email tu@email.it --password 'Password123!'
# → apri PUBLIC_URL e accedi
```
