# NoloTrack v2 — Design Spec

**Data:** 2026-05-14  
**Autore:** Marco Camelin + Claude  
**Stato:** Approvato — pronto per implementazione

---

## Panoramica

Sei sotto-progetti indipendenti da implementare in ordine:

| # | Sotto-progetto | Dipendenze |
|---|---|---|
| 1 | Form corse potenziata (dal PDF ordine servizio) | — |
| 2 | Edit universale (liste modificabili) | dipende da #1 |
| 3 | Tema chiaro/scuro con look desktop | — |
| 4 | Agenda mensile (Google Calendar + iCal) | dipende da #1 |
| 5 | Admin utenti multi-autista con ruoli granulari | — |
| 6 | Security review + Test suite | dopo che il codice è stabile |

---

## SP1 — Form corse potenziata

### Nuovi campi DB (migrazione `corse`)

| Campo | Tipo SQL | Note |
|---|---|---|
| `n_ordine` | `serial` | Auto-incrementale per anno |
| `anno_ordine` | `int` | Anno corrente (es. 2026) |
| `rif_agenzia` | `text nullable` | N° ordine esterno (es. "329/2026") |
| `agenzia` | `text nullable` | Nome agenzia (es. "Tika") |
| `cliente_nome` | `text nullable` | Nome passeggero |
| `cliente_tel` | `text nullable` | Telefono cliente |
| `n_pax` | `int default 1` | Numero passeggeri |
| `ora_fine` | `time nullable` | Ora fine servizio |
| `tipo_servizio` | `text nullable` | Es. "Transfer aeroporto", "Escursione" |

### Form UI (`/dashboard/corse/nuova`)

- Due sezioni visive nella form:
  - **Servizio** — campi esistenti (data, ora partenza, origine, destinazione, pagamento, importo)
  - **Dettaglio ordine** — campi nuovi (agenzia, rif. agenzia, cliente, telefono, pax, ora fine, tipo servizio)
- N° ordine generato automaticamente dall'app (non mostrato in form, visibile in lista/dettaglio)
- Tutti i campi nuovi sono opzionali tranne `cliente_nome`

### Lista corse (`/dashboard/corse`)

- Aggiungere colonne: Cliente, Pax, Tipo servizio
- Ogni riga è un `<Link href="/dashboard/corse/[id]">` cliccabile

---

## SP2 — Edit universale

### Pattern

Stessa form di inserimento riutilizzata in modalità edit, accessibile via URL con ID.

| Sezione | URL edit |
|---|---|
| Corse | `/dashboard/corse/[id]` |
| Turni | `/dashboard/turni/[id]` |
| Spese | `/dashboard/spese/[id]` |
| Carburante | `/dashboard/carburante/[id]` |

### Comportamento form edit

- Carica dati esistenti: `supabase.from(...).select().eq("id", id).eq("autista_id", user.id).single()`
- Se record non trovato o non appartiene all'utente → `notFound()` (404)
- Bottone **"Salva modifiche"** → `update()`
- Bottone **"Elimina"** → dialog di conferma → `delete()` → redirect alla lista
- Command bar: `← Corse / Corsa #330`

### Sicurezza

- **RLS Supabase** esteso a `corse` e `turni` (già attivo su `spese`, `carburante`, `targhe`):
  ```sql
  CREATE POLICY "own_rows" ON corse USING (autista_id = auth.uid());
  CREATE POLICY "own_rows" ON turni USING (autista_id = auth.uid());
  ```
- **Server component**: doppio filtro `id + autista_id` — mai solo per ID
- **Admin exception**: admin può editare record altrui, filtro `autista_id` rimosso per ruolo `admin`

---

## SP3 — Tema chiaro/scuro

### Implementazione

- Libreria: `next-themes`
- Persistenza: `localStorage` (automatica con next-themes)
- Nessuna colonna DB necessaria

### Toggle UI

- `<select>` in fondo alla sidebar desktop con tre opzioni: `🌙 Scuro`, `☀️ Chiaro`, `💻 Sistema`
- Stessa select adattata nel menu mobile

### Palette light mode

| Token | Dark (attuale) | Light (nuovo) |
|---|---|---|
| `--background` | `oklch(0.16 0 0)` | `oklch(0.97 0 0)` |
| `--sidebar` | `oklch(0.11 0 0)` | `oklch(0.93 0 0)` |
| `--card` | `oklch(0.13 0 0)` | `oklch(1 0 0)` |
| `--foreground` | `oklch(0.93 0 0)` | `oklch(0.15 0 0)` |
| `--primary` | `#0078d4` | `#0078d4` (invariato) |

### Look desktop application

Aggiunte UI trasversali a entrambi i temi:
- **Toolbar** strutturata con breadcrumb + pulsanti azione (sostituisce command bar semplice)
- **Righe lista** con hover state e row selezionata
- **Status bar** in fondo alla pagina: stato connessione, contatori, nome utente

---

## SP4 — Agenda mensile

### Pagina `/dashboard/agenda`

- **Vista:** lista per giorno, mese corrente
- **Navigazione:** frecce ← → tra mesi + bottone "Oggi"
- **Giorni senza servizi:** riga grigia collassata (1 riga)
- **Giorni con servizi:** espanso di default con card per ogni servizio (ora, cliente, tratta, tipo pagamento)
- **Giorno odierno:** evidenziato con bordo blu primario

### Vista Admin/Dispatcher

- Toggle in toolbar: "I miei servizi" / "Tutti gli autisti"
- In modalità "Tutti": badge colorato con nome autista su ogni servizio
- Colori autista assegnati automaticamente (palette fissa ciclica)

### Integrazione Google Calendar

- OAuth2 nella sezione Admin: "Connetti Google Calendar"
- Token OAuth salvato in nuova tabella `integrazioni` (user_id, provider, access_token, refresh_token, expires_at)
- Sync automatica su create/update/delete di una corsa: upsert su Google Calendar via API
- Errori di sync: fail silently (log in console, notifica toast non bloccante) — la corsa viene salvata comunque
- Libreria: `googleapis` (Node.js SDK)

### Export iCal

- Bottone "Esporta mese (.ics)" in toolbar agenda
- Genera file `.ics` con tutti i servizi del mese dell'utente corrente
- Download diretto client-side (Blob + `URL.createObjectURL`)
- Libreria: `ical-generator`

---

## SP5 — Admin utenti multi-autista

### Ruoli di sistema

| Ruolo | Descrizione |
|---|---|
| `admin` | Accesso completo, gestione utenti, assegnazione corse |
| `dispatcher` | Assegna corse, vede agenda tutti, NO stipendi |
| `autista` | Solo propri dati |

### Schema DB (nuove tabelle)

```sql
-- Ruoli personalizzabili
CREATE TABLE ruoli (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descrizione text
);

-- Permessi per sezione
CREATE TABLE ruolo_permessi (
  ruolo_id uuid REFERENCES ruoli,
  sezione text NOT NULL, -- 'corse','turni','cassa','spese','carburante','stipendio','agenda','admin'
  can_view boolean DEFAULT false,
  can_edit boolean DEFAULT false,
  PRIMARY KEY (ruolo_id, sezione)
);

-- Assegnazione ruolo all'utente
-- Nota: autisti ha già colonna `ruolo text` — mantenuta per compatibilità,
-- si aggiunge ruolo_id come FK preferita going forward
ALTER TABLE autisti ADD COLUMN ruolo_id uuid REFERENCES ruoli;
```

### Workflow invito autista

1. Admin → `/dashboard/admin/utenti` → "Invita autista"
2. Inserisce email → `supabase.auth.admin.inviteUserByEmail(email)` (richiede `SUPABASE_SERVICE_ROLE_KEY` server-side, mai esposta al client)
3. Autista riceve email → si registra → inserito in `autisti` con ruolo `autista` (default)
4. Admin può cambiare ruolo e permessi dalla pagina utenti

### Assegnazione corse (dispatcher)

- Form nuova corsa: campo "Autista assegnato" (select con tutti gli autisti attivi)
- Colonna "Autista" visibile in lista corse per admin/dispatcher
- Agenda admin: servizi di tutti gli autisti con badge colorato

### Navbar adattiva

- Voci sidebar filtrate dai permessi del ruolo corrente
- Server component legge `ruolo_permessi` e nasconde sezioni non autorizzate
- Redirect automatico se si accede direttamente a una URL non autorizzata

---

## SP6 — Security review + Test suite

### Security review (skill `security-review`)

Checklist da verificare su tutto il codebase:

- [ ] **RLS**: ogni tabella ha policy `autista_id = auth.uid()`
- [ ] **IDOR**: ogni server component filtra per `id + autista_id`
- [ ] **API routes**: verifica sessione Supabase su tutte le route `/api/*`
- [ ] **XSS**: sanitizzazione input su tutti i campi testo libero
- [ ] **Env vars**: nessuna secret in variabili `NEXT_PUBLIC_*`
- [ ] **Rate limiting**: aggiungere su `/api/invia-email`
- [ ] **OAuth tokens**: access_token Google salvato cifrato o in colonna con RLS stretta

### Test suite

**Unit tests** (Vitest):
- `lib/utils.ts`: `cn()`
- Logica calcolo stipendio (tariffa oraria × ore + commissioni)
- Logica saldo cassa (cash - spese con date)
- Generatori testo email (`lib/email-content.ts`)

**Integration tests** (Vitest + Supabase local via `supabase start`):
- Insert corsa → verifica in DB
- Insert corsa di altro utente → RLS blocca la lettura
- Calcolo saldo con date miste

**E2E** (Playwright):
- Flusso: login → nuova corsa con tutti i campi → verifica in lista → click riga → modifica → salva → elimina
- Flusso: toggle tema → verifica classe `.dark`/`.light` su `<html>`
- Flusso: agenda → navigazione mese → verifica servizi del giorno

---

## Decisioni tecniche

| Decisione | Scelta |
|---|---|
| Theme management | `next-themes` |
| Google Calendar | `googleapis` SDK |
| iCal export | `ical-generator` |
| Unit/integration test | Vitest |
| E2E test | Playwright |
| Invito utenti | `supabase.auth.admin.inviteUserByEmail` |
| N° ordine | serial auto-increment per anno in DB |
| Edit pattern | Pagina separata `/[section]/[id]` |
| Agenda view | Lista per giorno |
| Agenda integrazione | Google Calendar (primary) + iCal export (secondary) |
