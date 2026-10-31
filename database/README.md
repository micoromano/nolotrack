# database/

Script SQL di NoloTrack, fonte di verità unica dello schema.

- `ddl/` — struttura: tabelle, indici, vincoli, funzioni, trigger, policy RLS, privilegi
- `dml/` — dati: `1xx` sempre applicati (ruoli/permessi), `9xx` facoltativi (demo)

Ordine di esecuzione: alfabetico (`ddl/*` poi `dml/[0-8]*`). Tutti idempotenti.

Documentazione completa: [docs/self-hosting/DATABASE.md](../docs/self-hosting/DATABASE.md).

> I vecchi file `*_sql.sql` in radice e `supabase/migrations/*` restano come
> storico delle modifiche fatte sul progetto Supabase cloud: il loro contenuto
> è tutto incluso qui.
