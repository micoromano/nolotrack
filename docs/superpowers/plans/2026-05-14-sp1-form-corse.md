# SP1 — Form Corse Potenziata

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aggiungere 9 nuovi campi alla tabella `corse` e alla form di inserimento, basandosi sul PDF "Ordine di Servizio".

**Architecture:** Migrazione SQL in Supabase dashboard → tipi TypeScript → form UI in due sezioni (Servizio + Dettaglio Ordine) → lista corse con colonne Cliente e Pax.

**Tech Stack:** Supabase SQL, TypeScript, Next.js App Router (client component), Tailwind v4, @phosphor-icons/react

---

## File Structure

| File | Azione |
|---|---|
| `supabase/corse-v2.sql` | CREATE — SQL da eseguire nel dashboard Supabase |
| `types/index.ts` | MODIFY — aggiungere campi a `interface Corsa` |
| `app/dashboard/corse/nuova/page.tsx` | MODIFY — aggiungere sezione "Dettaglio ordine" |
| `app/dashboard/corse/page.tsx` | MODIFY — aggiungere colonne Cliente, Pax |

---

## Task 1: Migrazione DB

**Files:**
- Create: `supabase/corse-v2.sql`

- [ ] **Step 1: Crea file SQL**

```sql
-- supabase/corse-v2.sql
-- Eseguire nel SQL Editor del dashboard Supabase

CREATE SEQUENCE IF NOT EXISTS corse_n_ordine_seq START WITH 1 INCREMENT BY 1;

ALTER TABLE corse
  ADD COLUMN IF NOT EXISTS n_ordine      INTEGER DEFAULT nextval('corse_n_ordine_seq'),
  ADD COLUMN IF NOT EXISTS anno_ordine   INTEGER DEFAULT EXTRACT(YEAR FROM NOW())::INTEGER,
  ADD COLUMN IF NOT EXISTS rif_agenzia   TEXT,
  ADD COLUMN IF NOT EXISTS agenzia       TEXT,
  ADD COLUMN IF NOT EXISTS cliente_nome  TEXT,
  ADD COLUMN IF NOT EXISTS cliente_tel   TEXT,
  ADD COLUMN IF NOT EXISTS n_pax         INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS ora_fine      TIME,
  ADD COLUMN IF NOT EXISTS tipo_servizio TEXT;

-- Popola n_ordine per righe esistenti che hanno NULL
UPDATE corse
SET
  n_ordine    = nextval('corse_n_ordine_seq'),
  anno_ordine = EXTRACT(YEAR FROM data)::INTEGER
WHERE n_ordine IS NULL;
```

- [ ] **Step 2: Esegui la migrazione**

Apri Supabase dashboard → SQL Editor → incolla il contenuto di `supabase/corse-v2.sql` → Run.

Verifica con:
```sql
SELECT id, n_ordine, anno_ordine, cliente_nome, n_pax FROM corse LIMIT 5;
```
Expected: le nuove colonne esistono, `n_ordine` ha valori interi, `n_pax` = 1.

- [ ] **Step 3: Commit**

```bash
git add supabase/corse-v2.sql
git commit -m "db: aggiungi campi ordine servizio alla tabella corse"
```

---

## Task 2: Aggiorna tipi TypeScript

**Files:**
- Modify: `types/index.ts`

- [ ] **Step 1: Sostituisci `interface Corsa`**

In `types/index.ts`, sostituisci l'intera `interface Corsa` con:

```typescript
export interface Corsa {
  id: string;
  autista_id: string;
  data: string;
  ora_partenza: string;
  origine: string;
  destinazione: string;
  tipo_pagamento: TipoPagamento;
  importo: number;
  note?: string | null;
  created_at: string;
  // Campi ordine servizio (SP1)
  n_ordine?: number | null;
  anno_ordine?: number | null;
  rif_agenzia?: string | null;
  agenzia?: string | null;
  cliente_nome?: string | null;
  cliente_tel?: string | null;
  n_pax?: number;
  ora_fine?: string | null;
  tipo_servizio?: string | null;
}
```

- [ ] **Step 2: Verifica compilazione TypeScript**

```bash
npx tsc --noEmit
```

Expected: nessun errore.

- [ ] **Step 3: Commit**

```bash
git add types/index.ts
git commit -m "types: aggiungi campi ordine servizio a interface Corsa"
```

---

## Task 3: Aggiorna form nuova corsa

**Files:**
- Modify: `app/dashboard/corse/nuova/page.tsx`

- [ ] **Step 1: Aggiungi stati per i nuovi campi**

In `NuovaCorsaPage`, dopo `const [note, setNote] = useState("")`, aggiungi:

```typescript
const [agenzia, setAgenzia] = useState("");
const [rifAgenzia, setRifAgenzia] = useState("");
const [clienteNome, setClienteNome] = useState("");
const [clienteTel, setClienteTel] = useState("");
const [nPax, setNPax] = useState(1);
const [oraFine, setOraFine] = useState("");
const [tipoServizio, setTipoServizio] = useState("");
```

- [ ] **Step 2: Aggiorna `salva()` con i nuovi campi**

Nell'oggetto `insert({...})`, dopo `note: note || null`, aggiungi:

```typescript
agenzia:       agenzia || null,
rif_agenzia:   rifAgenzia || null,
cliente_nome:  clienteNome || null,
cliente_tel:   clienteTel || null,
n_pax:         nPax,
ora_fine:      oraFine || null,
tipo_servizio: tipoServizio || null,
```

- [ ] **Step 3: Aggiungi sezione "Dettaglio ordine" nella form**

Subito prima del blocco `{/* Note */}`, aggiungi:

```tsx
{/* Sezione dettaglio ordine */}
<div className="border-t border-border pt-5 space-y-4">
  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
    Dettaglio ordine
  </p>

  <div className="grid grid-cols-2 gap-3">
    <Field label="Agenzia">
      <input
        type="text"
        value={agenzia}
        onChange={(e) => setAgenzia(e.target.value)}
        placeholder="es. Tika"
        className={inputClass}
      />
    </Field>
    <Field label="Rif. agenzia">
      <input
        type="text"
        value={rifAgenzia}
        onChange={(e) => setRifAgenzia(e.target.value)}
        placeholder="es. 329/2026"
        className={inputClass}
      />
    </Field>
  </div>

  <div className="grid grid-cols-2 gap-3">
    <Field label="Cliente">
      <input
        type="text"
        value={clienteNome}
        onChange={(e) => setClienteNome(e.target.value)}
        placeholder="Nome passeggero"
        className={inputClass}
      />
    </Field>
    <Field label="Tel. cliente">
      <input
        type="tel"
        value={clienteTel}
        onChange={(e) => setClienteTel(e.target.value)}
        placeholder="+39…"
        className={inputClass}
      />
    </Field>
  </div>

  <div className="grid grid-cols-3 gap-3">
    <Field label="Pax">
      <input
        type="number"
        min="1"
        max="99"
        value={nPax}
        onChange={(e) => setNPax(parseInt(e.target.value) || 1)}
        className={cn(inputClass, "font-mono")}
      />
    </Field>
    <Field label="Ora fine">
      <input
        type="time"
        value={oraFine}
        onChange={(e) => setOraFine(e.target.value)}
        className={cn(inputClass, "font-mono")}
      />
    </Field>
    <Field label="Tipo servizio">
      <input
        type="text"
        list="tipi-servizio"
        value={tipoServizio}
        onChange={(e) => setTipoServizio(e.target.value)}
        placeholder="Transfer…"
        className={inputClass}
      />
      <datalist id="tipi-servizio">
        <option value="Transfer FCO" />
        <option value="Transfer CIA" />
        <option value="Transfer stazione" />
        <option value="Transfer indirizzo" />
        <option value="Escursione" />
        <option value="Full day" />
      </datalist>
    </Field>
  </div>
</div>
```

- [ ] **Step 4: Verifica visiva**

```bash
npm run dev
```

Apri `http://localhost:3000/dashboard/corse/nuova`. Verifica la sezione "Dettaglio ordine" sotto i campi esistenti. Inserisci dati di test (agenzia: "Tika", cliente: "Karen Anderson", pax: 2) e salva. Nel Supabase dashboard verifica che i dati siano salvati.

- [ ] **Step 5: Commit**

```bash
git add app/dashboard/corse/nuova/page.tsx
git commit -m "feat: aggiungi sezione dettaglio ordine alla form nuova corsa"
```

---

## Task 4: Aggiorna lista corse

**Files:**
- Modify: `app/dashboard/corse/page.tsx`

- [ ] **Step 1: Aggiorna header desktop da 5 a 6 colonne**

Sostituisci il div `hidden sm:grid grid-cols-5` nell'header:

```tsx
<div className="hidden sm:grid grid-cols-[120px_160px_80px_1fr_1fr_90px] px-4 py-2 border-b border-border bg-muted/30">
  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Data / Ora</span>
  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Cliente</span>
  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tipo</span>
  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Partenza</span>
  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Destinazione</span>
  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider text-right">Importo</span>
</div>
```

- [ ] **Step 2: Aggiorna riga desktop con colonna Cliente**

Sostituisci il div `hidden sm:grid grid-cols-5` nelle righe:

```tsx
<div className="hidden sm:grid grid-cols-[120px_160px_80px_1fr_1fr_90px] px-4 py-3 items-center gap-2">
  <div>
    <p className="font-mono text-xs text-muted-foreground">
      {new Date(c.data).toLocaleDateString("it-IT", { day: "2-digit", month: "short" })}
    </p>
    <p className="font-mono text-xs">{c.ora_partenza.slice(0, 5)}</p>
  </div>
  <div className="min-w-0">
    <p className="text-sm truncate">{c.cliente_nome ?? <span className="text-muted-foreground/40 italic text-xs">—</span>}</p>
    {c.n_pax && c.n_pax > 1 && (
      <p className="text-xs text-muted-foreground">{c.n_pax} pax</p>
    )}
  </div>
  <span className={cn("text-xs px-1.5 py-0.5 rounded font-medium w-fit", pagamentoBadgeStyle[c.tipo_pagamento])}>
    {pagamentoLabel[c.tipo_pagamento] ?? c.tipo_pagamento}
  </span>
  <span className="text-sm truncate">{c.origine}</span>
  <span className="text-sm truncate">{c.destinazione}</span>
  <span className="font-mono text-sm font-medium text-right">{formatEuro(c.importo)}</span>
</div>
```

- [ ] **Step 3: Verifica visiva**

```bash
npm run dev
```

Apri `http://localhost:3000/dashboard/corse`. Verifica colonna Cliente visibile su desktop. Le righe senza cliente mostrano `—` in grigio.

- [ ] **Step 4: Commit**

```bash
git add app/dashboard/corse/page.tsx
git commit -m "feat: aggiungi colonne cliente e pax alla lista corse"
```
