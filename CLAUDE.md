@AGENTS.md

# NoloTrack — Guida completa per Claude

App di gestione NCC (Noleggio Con Conducente) per Marco Camelin, autista romano.
Rimpiazza il workflow Excel (BASE_CALCOLI.xlsx + template rapportino).

---

## Stack tecnico

| Tecnologia | Versione | Note |
|---|---|---|
| Next.js | 16 (App Router) | `proxy.ts` esporta `proxy`, NON `middleware` |
| TypeScript | 5.x | strict mode |
| Tailwind CSS | v4 | sintassi `@theme inline`, oklch colors |
| shadcn/ui | @base-ui/react | Button NON ha `asChild` → usare `buttonVariants()` + `Link` |
| Supabase | — | PostgreSQL + Auth, credenziali in `.env.local` |
| @react-pdf/renderer | v4 | client-side only, dynamic import con `ssr: false` |
| @phosphor-icons/react | v2 | `weight="fill"` on active state |
| nodemailer | — | Gmail SMTP per invio email |
| @googlemaps/js-api-loader | — | Places Autocomplete indirizzi |

### Font
- IBM Plex Sans (body)
- IBM Plex Mono (numeri/codice)
- DM Serif Display (`font-heading`, titolo brand)

### UI Design System
- **Tema**: Azure portal dark mode
- **Palette chiave**: `oklch(0.11 0 0)` sidebar, `oklch(0.16 0 0)` background, `oklch(0.63 0.19 248)` primary blue (#0078d4)
- **Card**: `bg-card border border-border rounded-lg`
- **Input**: `bg-background border border-border rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-primary/30 focus:border-primary`
- **Icon tiles**: `w-9 h-9 rounded-xl flex items-center justify-center bg-{color}/15 text-{color}`
- Phosphor icons: `weight="fill"` quando attivo, `"regular"` altrimenti
- Client components: `import from "@phosphor-icons/react"`
- Server components: `import from "@phosphor-icons/react/dist/ssr"`

---

## Variabili d'ambiente (.env.local)

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=...   # Places Autocomplete
GMAIL_USER=...                         # Gmail SMTP mittente
GMAIL_APP_PASSWORD=...                 # App Password Gmail (no 2FA password)
NEXT_PUBLIC_APP_URL=...                 # Origine pubblica, usata per link email/invito e callback URL WhatsApp
SUPABASE_SERVICE_ROLE_KEY=...           # Usata dal webhook WhatsApp (route pubblica, nessuna sessione utente)
META_WHATSAPP_TOKEN=...                 # Meta Cloud API — access token permanente
META_WHATSAPP_PHONE_NUMBER_ID=...       # Meta Cloud API — Phone Number ID
META_WHATSAPP_VERIFY_TOKEN=...          # Stringa a scelta, usata per la verifica webhook (hub.verify_token)
META_WHATSAPP_APP_SECRET=...            # Opzionale ma consigliato — verifica firma X-Hub-Signature-256
```

---

## Middleware

`proxy.ts` nella root — esporta `export async function proxy`:
- Matcher esclude obbligatoriamente `auth` (per Google OAuth callback `/auth/callback`)
- Pattern: `/((?!_next/static|_next/image|favicon.ico|api/auth|auth).*)`

---

## Database Supabase

### Tabelle esistenti

**`autisti`**
```sql
id uuid PK, nome text, email text, ruolo text, created_at timestamptz
```

**`turni`**
```sql
id uuid PK, autista_id uuid FK autisti, data date, ora_inizio time, ora_fine time,
ore_lavorate numeric GENERATED, note text
-- UNIQUE(autista_id, data)
```

**`corse`**
```sql
id uuid PK, autista_id uuid FK autisti, data date, ora_partenza time,
origine text, destinazione text,
tipo_pagamento text CHECK IN ('cash','carta','uber','noninc'),
importo numeric, note text
```

**`spese`** (RLS)
```sql
id uuid PK, autista_id uuid FK autisti, data date, descrizione text,
importo numeric, created_at timestamptz
-- Policy: autista_id = auth.uid()
```

**`configurazione_salario`**
```sql
id uuid PK, tariffa_oraria numeric, percentuale_cash numeric,
percentuale_carta numeric, percentuale_uber numeric, aggiornato_il timestamptz
-- Percentuali come decimali: 0.35 = 35%
-- Riga unica globale (no autista_id)
```

**`carburante`** (RLS) — SQL in `carburante_sql.sql`
```sql
id uuid PK, autista_id uuid FK autisti, data date, targa text,
km numeric nullable, litri numeric, prezzo_litro numeric, importo numeric,
note text, created_at timestamptz
-- Policy: autista_id = auth.uid()
```

**`targhe`** (RLS) — SQL in `targhe_sql.sql`
```sql
id uuid PK, autista_id uuid FK autisti, targa text, created_at timestamptz
-- UNIQUE(autista_id, targa)
-- Policy: autista_id = auth.uid()
```

**`whatsapp_templates`** (RLS) — SP7, SQL in `supabase/migrations/20260707_sp7_whatsapp.sql`
```sql
id uuid PK, autista_id uuid FK autisti, nome text, categoria text CHECK IN ('autista','cliente','libero'),
corpo text, created_at timestamptz
-- UNIQUE(autista_id, nome) — corpo con placeholder {{chiave}}
-- Policy: autista_id = auth.uid()
```

**`whatsapp_log`** (RLS) — SP7
```sql
id uuid PK, autista_id uuid FK autisti nullable, corsa_id uuid FK corse nullable,
destinatario_tipo text CHECK IN ('autista','cliente'), telefono text,
direzione text CHECK IN ('in','out'), tipo text CHECK IN ('testo','template','interactive_bottoni','interactive_lista','bottone_click'),
contenuto text, wa_message_id text, stato text CHECK IN ('inviato','consegnato','letto','errore','ricevuto'),
errore_msg text, created_at timestamptz
-- SELECT/INSERT: autista_id = auth.uid(); il webhook pubblico scrive con SUPABASE_SERVICE_ROLE_KEY (bypassa RLS)
```

**`autisti.telefono`** (SP7) — numero WhatsApp dell'autista, usato per avviare il flusso servizio
**`corse.stato_servizio`** (SP7) — `'da_iniziare' | 'in_corso' | 'attesa_pagamento' | 'pagato' | 'completato'`, avanzato dai bottoni WhatsApp

---

## Logica di business

### Saldo cassa (foglio BASE_CALCOLI.xlsx)
```
saldoPrev = SUM(cash corse con data < oggi) - SUM(spese con data < oggi)
saldoOggi = saldoPrev + cashOggi - speseOggi
```
- **Carte e Uber**: mostrati separatamente, NON entrano nel saldo cassa
- **NoInc**: "Non incassato" — registrato ma escluso dal saldo

### Calcolo stipendio
```
stipendio_base = ore_lavorate × tariffa_oraria
comm_cash  = totale_cash  × percentuale_cash
comm_carta = totale_carta × percentuale_carta
comm_uber  = totale_uber  × percentuale_uber
stipendio_totale = stipendio_base + comm_cash + comm_carta + comm_uber
```

---

## Struttura pagine

```
app/
├── login/page.tsx              — email/password + Google OAuth
├── auth/callback/route.ts      — callback OAuth Supabase
├── dashboard/
│   ├── layout.tsx              — sm:pl-56 pt-12 sm:pt-0 pb-20 sm:pb-0
│   ├── page.tsx                — riepilogo giornaliero (SERVER component)
│   ├── turni/
│   │   ├── page.tsx            — lista turni (tabella Azure)
│   │   └── nuovo/page.tsx      — form nuovo/modifica turno
│   ├── corse/
│   │   ├── page.tsx            — lista corse con badge pagamento
│   │   └── nuova/page.tsx      — form + Places Autocomplete
│   ├── cassa/page.tsx          — ledger saldo progressivo, filtro mese
│   ├── spese/page.tsx          — CRUD spese standalone
│   ├── carburante/page.tsx     — registro rifornimenti + targhe dinamiche
│   ├── stipendio/page.tsx      — calcolo busta paga + config salario
│   ├── report/
│   │   ├── page.tsx            — rapportino giornaliero + PDF download
│   │   └── pdf.tsx             — PDF component (esporta RapportinoDoc + Props)
│   ├── invia/page.tsx          — composizione email + allegati PDF
│   └── whatsapp/
│       ├── page.tsx            — hub: webhook/callback URL, avvio flusso servizio, invio cliente/libero, storico
│       └── template/page.tsx   — CRUD template con placeholder {{chiave}}
└── api/
    ├── invia-email/route.ts    — POST Nodemailer Gmail SMTP
    └── whatsapp/
        ├── webhook/route.ts    — GET verifica Meta, POST eventi (bottoni/testo/ricevute stato)
        ├── invia/route.ts      — POST azioni: avvia_flusso_autista | messaggio_libero | usa_template
        ├── templates/route.ts  — GET/POST template (+ [id]/route.ts per PUT/DELETE)
        └── status/route.ts     — GET stato configurazione + callback URL

components/
├── navbar.tsx                  — sidebar desktop (11 voci) + bottom tabs mobile (scroll orizzontale)
├── place-autocomplete.tsx      — Google Places wrapper (lazy load)
└── ui/                         — shadcn components

lib/
├── supabase/
│   ├── client.ts               — createClient() per client components
│   └── server.ts               — createClient() per server components
├── pdf-allegati.tsx            — generatori PDF base64 (rapportino/stipendio/carburante)
├── email-content.ts            — generatori testo email per anteprima
├── whatsapp.ts                 — client Meta Cloud API (invio testo/bottoni/lista, firma webhook, placeholder)
└── utils.ts                    — cn()

types/index.ts                  — TipoPagamento, Corsa, Turno, Spesa, ConfigurazioneSalario, WhatsappTemplate, WhatsappLog
```

---

## Navbar

**Desktop sidebar** (9 voci, w-56, fissa a sinistra):
Home (primary), Turni (sky), Corse (emerald), Cassa (amber), Spese (rose), Carburante (orange), Stipendio (green), Report (violet), Invia (cyan)

**Mobile** (top bar logo + bottom tabs 5 voci):
Home, Corse, Cassa, Stipendio, Invia

**Active state**: `weight="fill"` sull'icona, sfondo `bg-sidebar-accent`, stripe `w-0.5 bg-primary` a sinistra (desktop) o top (mobile)

---

## PDF Generation

- `app/dashboard/report/pdf.tsx` — `RapportinoDoc` (esportato) per singolo giorno
- `lib/pdf-allegati.tsx` — funzioni async che fetchano dati da Supabase e restituiscono `{ filename, content: base64 }`:
  - `generaPDFRapportino(userId, dataInizio, dataFine)` — multi-pagina, un giorno per pagina
  - `generaPDFStipendio(userId, dataInizio, dataFine)` — riepilogo mensile
  - `generaPDFCarburante(userId, dataInizio, dataFine)` — tabella rifornimenti
- Stile PDF: sfondo bianco, accento `#0078d4`, font Helvetica

---

## Invio Email (Gmail SMTP)

- Route: `POST /api/invia-email`
- Body: `{ to, subject, body, attachments?: [{filename, content: base64}] }`
- Auth: verifica sessione Supabase + controlla env GMAIL_USER/GMAIL_APP_PASSWORD
- Ritorna 503 se Gmail non configurato (usato come health-check dal frontend)

**Setup App Password Gmail:**
1. myaccount.google.com → Sicurezza → Verifica in 2 passaggi (attivare)
2. Cerca "Password per le app" → Crea per "NoloTrack"
3. Copiare in `.env.local` senza spazi

---

## Google Places Autocomplete

- Componente: `components/place-autocomplete.tsx`
- Carica Google Maps JS API lazy (una sola volta per pagina)
- Restrizione: `componentRestrictions: { country: "it" }`
- Usato nei campi Origine e Destinazione di `/dashboard/corse/nuova`
- Fallback a input normale se API key non presente

---

## WhatsApp (Meta Cloud API) — SP7

**Flusso servizio → autista** (macchina a stati guidata da bottoni interattivi, id formato `step:<fase>:<corsaId>` / `pagamento:<tipo>:<corsaId>`):

```
da_iniziare --[▶️ Inizio corsa]--> in_corso --[🏁 Fine corsa]--> attesa_pagamento
  --[lista: Cash/Carta/Uber/Non incassato]--> pagato --[✅ Fine servizio]--> completato
```

- Ogni step aggiorna `corse.stato_servizio` (e `tipo_pagamento` alla scelta del pagamento) e logga in `whatsapp_log`.
- Al passaggio a `in_corso` e a `completato`, se `corse.cliente_tel` è valorizzato, viene inviato automaticamente un messaggio di cortesia al cliente.

**Setup webhook Meta:**
1. Meta for Developers → app → WhatsApp → Configuration → Callback URL = `{NEXT_PUBLIC_APP_URL}/api/whatsapp/webhook`, Verify token = `META_WHATSAPP_VERIFY_TOKEN`
2. Iscriversi al campo webhook `messages`
3. Copiare Token e Phone Number ID da "API Setup" in `META_WHATSAPP_TOKEN` / `META_WHATSAPP_PHONE_NUMBER_ID`
4. `META_WHATSAPP_APP_SECRET` abilita la verifica della firma `X-Hub-Signature-256` (fortemente consigliato in produzione)

**Template locali** (non i template Meta ufficiali, che richiedono approvazione): CRUD in `/dashboard/whatsapp/template`, corpo con placeholder `{{chiave}}` sostituiti lato server prima dell'invio (`lib/whatsapp.ts` → `estraiPlaceholder` / `riempiPlaceholder`).

**Route API:**
- `GET/POST /api/whatsapp/webhook` — pubblica, usa `SUPABASE_SERVICE_ROLE_KEY` per scrivere (nessuna sessione utente)
- `POST /api/whatsapp/invia` — autenticata, azioni `avvia_flusso_autista` / `messaggio_libero` / `usa_template`
- `GET/POST /api/whatsapp/templates`, `PUT/DELETE /api/whatsapp/templates/[id]` — CRUD template, RLS per autista
- `GET /api/whatsapp/status` — configurazione + callback URL per la UI

---

## Pattern da rispettare

```tsx
// Link-button corretto (Button non ha asChild)
import { buttonVariants } from "@/components/ui/button";
<Link href="..." className={cn(buttonVariants({ size: "sm" }), "text-xs")}>...</Link>

// Supabase query che può fallire (tabella non ancora creata)
const [res] = await Promise.allSettled([supabase.from("tabella").select(...)]);
const data = res.status === "fulfilled" ? res.value.data ?? [] : [];

// Icona con sfondo colorato
<div className="w-9 h-9 rounded-xl flex items-center justify-center bg-amber-400/15 text-amber-400">
  <CurrencyEur size={18} weight="fill" />
</div>

// Server component con Phosphor
import { House } from "@phosphor-icons/react/dist/ssr";
```

---

## Regole commit

- **NO Co-Authored-By** nei messaggi di commit
- Commit in italiano o inglese, concisi
- Non committare `.env.local`
