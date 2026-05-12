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
│   └── invia/page.tsx          — composizione email + allegati PDF
└── api/
    └── invia-email/route.ts    — POST Nodemailer Gmail SMTP

components/
├── navbar.tsx                  — sidebar desktop (9 voci) + bottom tabs mobile (5 voci)
├── place-autocomplete.tsx      — Google Places wrapper (lazy load)
└── ui/                         — shadcn components

lib/
├── supabase/
│   ├── client.ts               — createClient() per client components
│   └── server.ts               — createClient() per server components
├── pdf-allegati.tsx            — generatori PDF base64 (rapportino/stipendio/carburante)
├── email-content.ts            — generatori testo email per anteprima
└── utils.ts                    — cn()

types/index.ts                  — TipoPagamento, Corsa, Turno, Spesa, ConfigurazioneSalario
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
