# Database: script DDL e DML

Tutto lo schema di NoloTrack è in [`database/`](../../database), diviso in
**DDL** (struttura) e **DML** (dati). È la fonte di verità unica: consolida le
tabelle base (che prima esistevano solo su Supabase cloud) e tutti i vecchi file
sparsi (`*_sql.sql` in radice, `supabase/migrations/`, `supabase/rls-*.sql`).

## Contenuto

| File | Tipo | Contenuto |
|---|---|---|
| `ddl/000_compat_supabase.sql` | DDL | ruoli `anon`/`authenticated`/`service_role`, schema `auth`, `auth.uid()` — **solo se mancano** (PostgreSQL "nudo") |
| `ddl/010_ruoli.sql` | DDL | `ruoli`, `ruolo_permessi` |
| `ddl/020_autisti.sql` | DDL | `autisti` (1:1 con `auth.users`), `is_admin()`, trigger che crea l'autista quando nasce un utente |
| `ddl/030_turni.sql` | DDL | `turni` (con `ore_lavorate` calcolata) |
| `ddl/040_corse.sql` | DDL | `corse` + campi ordine, mance, multivaluta, stato servizio WhatsApp |
| `ddl/050_spese.sql` | DDL | `spese` |
| `ddl/060_configurazione_salario.sql` | DDL | `configurazione_salario` (riga unica globale) |
| `ddl/070_carburante_targhe.sql` | DDL | `carburante`, `targhe` |
| `ddl/080_integrazioni_push.sql` | DDL | `integrazioni` (Google Calendar), `push_subscriptions` |
| `ddl/090_whatsapp.sql` | DDL | `whatsapp_templates`, `whatsapp_log` |
| `ddl/990_grants.sql` | DDL | privilegi per i ruoli API, ricarica cache PostgREST |
| `dml/100_ruoli_permessi.sql` | DML | ruoli admin/dispatcher/autista e matrice permessi |
| `dml/900_dati_demo.sql` | DML | **facoltativo**: dati di prova per un utente |

Tutti gli script sono **idempotenti** (`IF NOT EXISTS`, `DROP POLICY IF
EXISTS`, `ON CONFLICT DO NOTHING`): si possono rieseguire senza danni. Per questo
in Docker il servizio `migrate` li applica a **ogni avvio** — è anche il
meccanismo di aggiornamento dello schema.

## Modello dati

```
auth.users 1──1 autisti ──┬──< turni          (UNIQUE autista_id+data)
                  │       ├──< corse ──< whatsapp_log
                  │       ├──< spese
   ruoli 1──< autisti     ├──< carburante
     │                    ├──< targhe         (UNIQUE autista_id+targa)
     └──< ruolo_permessi  ├──< integrazioni   (UNIQUE autista_id+provider)
                          ├──< push_subscriptions
                          └──< whatsapp_templates

configurazione_salario    (riga unica, nessun legame)
```

Regole di business nel DB:

- `turni.ore_lavorate` = `(ora_fine − ora_inizio)` in ore decimali (colonna generata).
- `corse.importo` è nella **valuta originale**; l'equivalente in euro è
  `importo × tasso_cambio`.
- `corse.mancia` è separata dal pagamento e non entra nelle commissioni.
- Percentuali salario come decimali: `0.35` = 35 %.

## Sicurezza (RLS)

Ogni tabella con `autista_id` ha una policy `autista_id = auth.uid()`: l'utente
loggato legge e scrive **solo le proprie righe**, anche chiamando le API a mano.
Eccezioni:

| Tabella | Regola |
|---|---|
| `autisti` | lettura del proprio profilo; l'admin legge tutti; aggiornamento solo del proprio |
| `ruoli`, `ruolo_permessi` | sola lettura per tutti gli utenti loggati |
| `configurazione_salario` | lettura/scrittura per tutti gli utenti loggati (come nell'originale) |
| `whatsapp_log` | lettura/inserimento propri; gli aggiornamenti li fa il webhook con la service role |

Il ruolo `anon` (non loggato) non ha privilegi su nessuna tabella.

## Applicare gli script a mano

### Con Docker
Non serve: lo fa `migrate`. Per forzarlo: `docker compose run --rm migrate`.

### Su Supabase cloud (nuovo progetto)
SQL Editor → incolla ed esegui, in ordine, i file di `ddl/` e poi
`dml/100_ruoli_permessi.sql`. `000_compat_supabase.sql` non fa nulla ma si può
eseguire comunque.

### Su un PostgreSQL qualsiasi (≥ 14)

```bash
export DATABASE_URL=postgresql://utente:password@host:5432/nolotrack
for f in database/ddl/*.sql database/dml/1*.sql; do
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$f" || break
done
```

Su un Postgres senza GoTrue/PostgREST lo schema e i dati sono completi e
interrogabili (report, BI, restore), ma per far girare l'app servono
comunque GoTrue e PostgREST: usa lo stack Docker.

## Dati demo

```bash
# inserisci (l'utente deve esistere)
docker compose exec -T db psql -U supabase_admin -d postgres \
  -v email=tua@email.it < database/dml/900_dati_demo.sql

# rimuovi
docker compose exec db psql -U supabase_admin -d postgres -c "
  DELETE FROM corse      WHERE note = '[demo]';
  DELETE FROM turni      WHERE note = '[demo]';
  DELETE FROM carburante WHERE note = '[demo]';
  DELETE FROM spese      WHERE descrizione LIKE '[demo]%';"
```

## Modificare lo schema (sviluppatori)

1. Aggiungi un file in `database/ddl/` con numero intermedio (es.
   `045_nuova_tabella.sql`), sempre idempotente.
2. Abilita la RLS e crea le policy nello stesso file.
3. Le nuove tabelle ricevono i privilegi da `990_grants.sql` (che gira per ultimo).
4. `docker compose run --rm migrate` per applicarlo; su Supabase cloud
   eseguilo nel SQL Editor.
5. Aggiorna `types/index.ts` e la sezione database di `CLAUDE.md`.

## Console SQL

```bash
docker compose exec db psql -U supabase_admin -d postgres
```

Da un client grafico (DBeaver, pgAdmin): togli il commento a `ports` del
servizio `db` in `docker-compose.yml` (solo `127.0.0.1`!) e usa un tunnel SSH.
Utente `supabase_admin`, password `POSTGRES_PASSWORD`.
