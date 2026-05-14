# SP2 — Edit Universale

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rendere ogni voce di ogni lista (corse, turni, spese, carburante) cliccabile, aprendo la form di modifica/eliminazione alla URL `/dashboard/[sezione]/[id]`.

**Architecture:** RLS Supabase su `corse` e `turni` → pagine edit `[id]/page.tsx` per ogni sezione (client component, carica dati via `useEffect`, stessa UI della form di inserimento) → ogni riga lista diventa `<Link>`.

**Tech Stack:** Supabase RLS SQL, Next.js App Router (client components), TypeScript, Tailwind v4

**Dipende da:** SP1 (la form corse edit include i nuovi campi SP1)

---

## File Structure

| File | Azione |
|---|---|
| `supabase/rls-corse-turni.sql` | CREATE — RLS policies per corse e turni |
| `app/dashboard/corse/[id]/page.tsx` | CREATE — form edit corsa |
| `app/dashboard/turni/[id]/page.tsx` | CREATE — form edit turno |
| `app/dashboard/spese/[id]/page.tsx` | CREATE — form edit spesa |
| `app/dashboard/carburante/[id]/page.tsx` | CREATE — form edit rifornimento |
| `app/dashboard/corse/page.tsx` | MODIFY — righe come Link |
| `app/dashboard/turni/page.tsx` | MODIFY — righe come Link |
| `app/dashboard/spese/page.tsx` | MODIFY — righe come Link |
| `app/dashboard/carburante/page.tsx` | MODIFY — righe come Link |

---

## Task 1: RLS per corse e turni

**Files:**
- Create: `supabase/rls-corse-turni.sql`

- [ ] **Step 1: Crea file SQL**

```sql
-- supabase/rls-corse-turni.sql
-- Eseguire nel SQL Editor del dashboard Supabase

-- Abilita RLS sulle tabelle non ancora protette
ALTER TABLE corse ENABLE ROW LEVEL SECURITY;
ALTER TABLE turni ENABLE ROW LEVEL SECURITY;

-- Policy corse: ogni autista vede/modifica solo le proprie
CREATE POLICY "corse_own_rows" ON corse
  FOR ALL USING (autista_id = auth.uid())
  WITH CHECK (autista_id = auth.uid());

-- Policy turni: idem
CREATE POLICY "turni_own_rows" ON turni
  FOR ALL USING (autista_id = auth.uid())
  WITH CHECK (autista_id = auth.uid());
```

- [ ] **Step 2: Esegui nel dashboard Supabase**

SQL Editor → incolla → Run. Verifica con:
```sql
SELECT tablename, policyname FROM pg_policies
WHERE tablename IN ('corse', 'turni');
```
Expected: vedi `corse_own_rows` e `turni_own_rows`.

- [ ] **Step 3: Verifica che le query esistenti funzionino ancora**

```bash
npm run dev
```
Apri `/dashboard/corse` e `/dashboard/turni`. Le liste devono caricarsi normalmente (RLS usa `auth.uid()` che corrisponde all'utente loggato).

- [ ] **Step 4: Commit**

```bash
git add supabase/rls-corse-turni.sql
git commit -m "db: abilita RLS su corse e turni"
```

---

## Task 2: Form edit corsa

**Files:**
- Create: `app/dashboard/corse/[id]/page.tsx`

- [ ] **Step 1: Crea il file**

```tsx
"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import type { TipoPagamento } from "@/types";
import {
  CurrencyEur, CreditCard, Car, Tag, MapPin, Clock,
  CalendarBlank, ArrowLeft, CheckCircle, Trash,
} from "@phosphor-icons/react";
import PlaceAutocomplete from "@/components/place-autocomplete";

const pagamentoPills: {
  value: TipoPagamento; label: string; icon: React.ElementType;
  active: string; iconActive: string; iconInactive: string;
}[] = [
  { value: "cash",   label: "Cash",   icon: CurrencyEur, active: "border-amber-400/60 bg-amber-400/10 text-amber-400",   iconActive: "bg-amber-400/20 text-amber-400",   iconInactive: "bg-muted/40 text-muted-foreground" },
  { value: "carta",  label: "Carta",  icon: CreditCard,  active: "border-blue-400/60 bg-blue-400/10 text-blue-400",     iconActive: "bg-blue-400/20 text-blue-400",     iconInactive: "bg-muted/40 text-muted-foreground" },
  { value: "uber",   label: "Uber",   icon: Car,         active: "border-slate-400/40 bg-slate-400/10 text-slate-300",  iconActive: "bg-slate-400/20 text-slate-300",   iconInactive: "bg-muted/40 text-muted-foreground" },
  { value: "noninc", label: "No Inc", icon: Tag,         active: "border-purple-400/60 bg-purple-400/10 text-purple-400", iconActive: "bg-purple-400/20 text-purple-400", iconInactive: "bg-muted/40 text-muted-foreground" },
];

const inputClass = "w-full bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground/60 px-3 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all";

export default function EditaCorsaPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errore, setErrore] = useState("");

  const [data, setData] = useState("");
  const [oraPartenza, setOraPartenza] = useState("");
  const [origine, setOrigine] = useState("");
  const [destinazione, setDestinazione] = useState("");
  const [tipoPagamento, setTipoPagamento] = useState<TipoPagamento>("cash");
  const [importo, setImporto] = useState("");
  const [note, setNote] = useState("");
  const [agenzia, setAgenzia] = useState("");
  const [rifAgenzia, setRifAgenzia] = useState("");
  const [clienteNome, setClienteNome] = useState("");
  const [clienteTel, setClienteTel] = useState("");
  const [nPax, setNPax] = useState(1);
  const [oraFine, setOraFine] = useState("");
  const [tipoServizio, setTipoServizio] = useState("");

  useEffect(() => {
    async function carica() {
      const { data: corsa, error } = await supabase
        .from("corse")
        .select("*")
        .eq("id", id)
        .single();
      if (error || !corsa) { router.push("/dashboard/corse"); return; }
      setData(corsa.data);
      setOraPartenza(corsa.ora_partenza.slice(0, 5));
      setOrigine(corsa.origine);
      setDestinazione(corsa.destinazione);
      setTipoPagamento(corsa.tipo_pagamento);
      setImporto(String(corsa.importo));
      setNote(corsa.note ?? "");
      setAgenzia(corsa.agenzia ?? "");
      setRifAgenzia(corsa.rif_agenzia ?? "");
      setClienteNome(corsa.cliente_nome ?? "");
      setClienteTel(corsa.cliente_tel ?? "");
      setNPax(corsa.n_pax ?? 1);
      setOraFine(corsa.ora_fine?.slice(0, 5) ?? "");
      setTipoServizio(corsa.tipo_servizio ?? "");
      setLoading(false);
    }
    carica();
  }, [id]);

  async function salva(e: React.FormEvent) {
    e.preventDefault();
    setErrore("");
    setSaving(true);
    const { error } = await supabase.from("corse").update({
      data,
      ora_partenza: oraPartenza,
      origine,
      destinazione,
      tipo_pagamento: tipoPagamento,
      importo: parseFloat(importo) || 0,
      note: note || null,
      agenzia: agenzia || null,
      rif_agenzia: rifAgenzia || null,
      cliente_nome: clienteNome || null,
      cliente_tel: clienteTel || null,
      n_pax: nPax,
      ora_fine: oraFine || null,
      tipo_servizio: tipoServizio || null,
    }).eq("id", id);
    if (error) { setErrore("Errore: " + error.message); setSaving(false); return; }
    router.push("/dashboard/corse");
    router.refresh();
  }

  async function elimina() {
    if (!confirm("Eliminare questa corsa? L'azione è irreversibile.")) return;
    setDeleting(true);
    await supabase.from("corse").delete().eq("id", id);
    router.push("/dashboard/corse");
    router.refresh();
  }

  if (loading) {
    return (
      <div className="p-6 text-sm text-muted-foreground">Caricamento…</div>
    );
  }

  return (
    <div>
      <div className="border-b border-border px-6 py-3 flex items-center gap-3 bg-card">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={13} weight="bold" />
          Corse
        </button>
        <span className="text-muted-foreground text-xs">/</span>
        <h1 className="text-sm font-semibold text-foreground">Modifica corsa</h1>
      </div>

      <div className="p-6">
        <div className="max-w-md bg-card border border-border rounded-lg">
          <div className="border-b border-border px-5 py-3">
            <p className="text-xs text-muted-foreground">Modifica i dettagli della corsa</p>
          </div>
          <form onSubmit={salva} className="p-5 space-y-5">

            <div className="grid grid-cols-2 gap-3">
              <Field label="Data" icon={CalendarBlank}>
                <input type="date" value={data} onChange={(e) => setData(e.target.value)} required className={inputClass} />
              </Field>
              <Field label="Ora partenza" icon={Clock}>
                <input type="time" value={oraPartenza} onChange={(e) => setOraPartenza(e.target.value)} required className={cn(inputClass, "font-mono")} />
              </Field>
            </div>

            <Field label="Partenza" icon={MapPin} iconClass="text-emerald-400">
              <div className="relative">
                <MapPin size={14} weight="fill" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 pointer-events-none z-10" />
                <PlaceAutocomplete value={origine} onChange={setOrigine} required placeholder="es. Milano Centrale" className={cn(inputClass, "pl-8")} />
              </div>
            </Field>

            <Field label="Destinazione" icon={MapPin} iconClass="text-rose-400">
              <div className="relative">
                <MapPin size={14} weight="fill" className="absolute left-3 top-1/2 -translate-y-1/2 text-rose-400/50 pointer-events-none z-10" />
                <PlaceAutocomplete value={destinazione} onChange={setDestinazione} required placeholder="es. Aeroporto Fiumicino" className={cn(inputClass, "pl-8")} />
              </div>
            </Field>

            <Field label="Pagamento">
              <div className="grid grid-cols-4 gap-2">
                {pagamentoPills.map(({ value, label, icon: Icon, active, iconActive, iconInactive }) => {
                  const sel = tipoPagamento === value;
                  return (
                    <button key={value} type="button" onClick={() => setTipoPagamento(value)}
                      className={cn("flex flex-col items-center gap-2 py-3 px-1 border rounded-xl transition-all",
                        sel ? active : "border-border bg-background text-muted-foreground hover:border-muted-foreground/30")}>
                      <span className={cn("flex items-center justify-center w-9 h-9 rounded-xl transition-all", sel ? iconActive : iconInactive)}>
                        <Icon size={18} weight={sel ? "fill" : "regular"} />
                      </span>
                      <span className="text-xs font-semibold leading-none">{label}</span>
                    </button>
                  );
                })}
              </div>
            </Field>

            <Field label="Importo" icon={CurrencyEur}>
              <div className="relative">
                <CurrencyEur size={14} weight="bold" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 pointer-events-none" />
                <input type="number" min="0" step="0.01" placeholder="0.00" value={importo}
                  onChange={(e) => setImporto(e.target.value)} required className={cn(inputClass, "pl-8 font-mono")} />
              </div>
            </Field>

            <Field label="Note (opzionale)">
              <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="es. cliente abituale…" className={inputClass} />
            </Field>

            {/* Dettaglio ordine */}
            <div className="border-t border-border pt-5 space-y-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Dettaglio ordine</p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Agenzia">
                  <input type="text" value={agenzia} onChange={(e) => setAgenzia(e.target.value)} placeholder="es. Tika" className={inputClass} />
                </Field>
                <Field label="Rif. agenzia">
                  <input type="text" value={rifAgenzia} onChange={(e) => setRifAgenzia(e.target.value)} placeholder="es. 329/2026" className={inputClass} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Cliente">
                  <input type="text" value={clienteNome} onChange={(e) => setClienteNome(e.target.value)} placeholder="Nome passeggero" className={inputClass} />
                </Field>
                <Field label="Tel. cliente">
                  <input type="tel" value={clienteTel} onChange={(e) => setClienteTel(e.target.value)} placeholder="+39…" className={inputClass} />
                </Field>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Pax">
                  <input type="number" min="1" max="99" value={nPax} onChange={(e) => setNPax(parseInt(e.target.value) || 1)} className={cn(inputClass, "font-mono")} />
                </Field>
                <Field label="Ora fine">
                  <input type="time" value={oraFine} onChange={(e) => setOraFine(e.target.value)} className={cn(inputClass, "font-mono")} />
                </Field>
                <Field label="Tipo servizio">
                  <input type="text" list="tipi-servizio-edit" value={tipoServizio} onChange={(e) => setTipoServizio(e.target.value)} placeholder="Transfer…" className={inputClass} />
                  <datalist id="tipi-servizio-edit">
                    <option value="Transfer FCO" /><option value="Transfer CIA" />
                    <option value="Transfer stazione" /><option value="Transfer indirizzo" />
                    <option value="Escursione" /><option value="Full day" />
                  </datalist>
                </Field>
              </div>
            </div>

            {errore && (
              <p className="text-sm text-destructive flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-destructive/20 flex items-center justify-center text-xs">!</span>
                {errore}
              </p>
            )}

            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={saving}
                className="flex items-center gap-2 bg-primary text-primary-foreground text-sm font-semibold px-5 py-2.5 rounded-lg transition-all hover:opacity-90 disabled:opacity-50">
                <CheckCircle size={15} weight="fill" />
                {saving ? "Salvataggio…" : "Salva modifiche"}
              </button>
              <button type="button" onClick={() => router.back()}
                className="bg-muted text-foreground text-sm font-medium px-4 py-2.5 rounded-lg transition-colors hover:bg-muted/70">
                Annulla
              </button>
              <button type="button" onClick={elimina} disabled={deleting}
                className="ml-auto flex items-center gap-1.5 text-sm text-destructive hover:text-destructive/80 px-3 py-2.5 rounded-lg hover:bg-destructive/10 transition-colors disabled:opacity-50">
                <Trash size={14} weight="bold" />
                {deleting ? "Eliminando…" : "Elimina"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function Field({ label, icon: Icon, iconClass, children }: {
  label: string; icon?: React.ElementType; iconClass?: string; children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className={cn("flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider")}>
        {Icon && <Icon size={11} weight="bold" className={iconClass} />}
        {label}
      </label>
      {children}
    </div>
  );
}
```

- [ ] **Step 2: Verifica visiva**

```bash
npm run dev
```

Apri `http://localhost:3000/dashboard/corse/[id-di-una-corsa-esistente]`. La form deve caricarsi pre-popolata. Modifica il cliente e salva. Verifica aggiornamento in lista.

- [ ] **Step 3: Commit**

```bash
git add "app/dashboard/corse/[id]/page.tsx"
git commit -m "feat: aggiungi pagina edit corsa con eliminazione"
```

---

## Task 3: Form edit turno

**Files:**
- Create: `app/dashboard/turni/[id]/page.tsx`

- [ ] **Step 1: Crea il file**

```tsx
"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { ArrowLeft, CheckCircle, Trash } from "@phosphor-icons/react";

const inputClass = "w-full bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground px-3 py-2 rounded focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all";

export default function EditaTurnoPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errore, setErrore] = useState("");
  const [data, setData] = useState("");
  const [oraInizio, setOraInizio] = useState("");
  const [oraFine, setOraFine] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    async function carica() {
      const { data: turno, error } = await supabase.from("turni").select("*").eq("id", id).single();
      if (error || !turno) { router.push("/dashboard/turni"); return; }
      setData(turno.data);
      setOraInizio(turno.ora_inizio.slice(0, 5));
      setOraFine(turno.ora_fine.slice(0, 5));
      setNote(turno.note ?? "");
      setLoading(false);
    }
    carica();
  }, [id]);

  async function salva(e: React.FormEvent) {
    e.preventDefault();
    setErrore("");
    if (oraFine <= oraInizio) { setErrore("L'ora di fine deve essere dopo l'ora di inizio."); return; }
    setSaving(true);
    const { error } = await supabase.from("turni").update({ data, ora_inizio: oraInizio, ora_fine: oraFine, note: note || null }).eq("id", id);
    if (error) { setErrore("Errore: " + error.message); setSaving(false); return; }
    router.push("/dashboard/turni");
    router.refresh();
  }

  async function elimina() {
    if (!confirm("Eliminare questo turno?")) return;
    setDeleting(true);
    await supabase.from("turni").delete().eq("id", id);
    router.push("/dashboard/turni");
    router.refresh();
  }

  if (loading) return <div className="p-6 text-sm text-muted-foreground">Caricamento…</div>;

  return (
    <div>
      <div className="border-b border-border px-6 py-3 flex items-center gap-3 bg-card">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={13} weight="bold" /> Turni
        </button>
        <span className="text-muted-foreground text-xs">/</span>
        <h1 className="text-sm font-semibold">Modifica turno</h1>
      </div>
      <div className="p-6">
        <div className="max-w-md bg-card border border-border rounded">
          <div className="border-b border-border px-5 py-3">
            <p className="text-xs text-muted-foreground">Modifica l'orario di lavoro</p>
          </div>
          <form onSubmit={salva} className="p-5 space-y-4">
            <Field label="Data">
              <input type="date" value={data} onChange={(e) => setData(e.target.value)} required className={inputClass} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Ora inizio">
                <input type="time" value={oraInizio} onChange={(e) => setOraInizio(e.target.value)} required className={cn(inputClass, "font-mono")} />
              </Field>
              <Field label="Ora fine">
                <input type="time" value={oraFine} onChange={(e) => setOraFine(e.target.value)} required className={cn(inputClass, "font-mono")} />
              </Field>
            </div>
            <Field label="Note (opzionale)">
              <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="es. aeroporto, evento…" className={inputClass} />
            </Field>
            {errore && <p className="text-sm text-destructive">{errore}</p>}
            <div className="flex gap-2 pt-2">
              <button type="submit" disabled={saving}
                className="flex items-center gap-1.5 bg-primary text-primary-foreground text-xs font-medium px-4 py-2 rounded hover:opacity-90 disabled:opacity-50">
                <CheckCircle size={13} weight="fill" />
                {saving ? "Salvataggio…" : "Salva modifiche"}
              </button>
              <button type="button" onClick={() => router.back()} className="bg-muted text-foreground text-xs font-medium px-4 py-2 rounded hover:bg-muted/70">
                Annulla
              </button>
              <button type="button" onClick={elimina} disabled={deleting}
                className="ml-auto flex items-center gap-1.5 text-xs text-destructive hover:bg-destructive/10 px-3 py-2 rounded transition-colors disabled:opacity-50">
                <Trash size={13} weight="bold" />
                {deleting ? "…" : "Elimina"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</label>
      {children}
    </div>
  );
}
```

- [ ] **Step 2: Verifica**

```bash
npm run dev
```

Apri `/dashboard/turni/[id]`. Pre-popola dati, modifica ora fine, salva.

- [ ] **Step 3: Commit**

```bash
git add "app/dashboard/turni/[id]/page.tsx"
git commit -m "feat: aggiungi pagina edit turno"
```

---

## Task 4: Form edit spesa

**Files:**
- Create: `app/dashboard/spese/[id]/page.tsx`

- [ ] **Step 1: Crea il file**

```tsx
"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, CheckCircle, Trash } from "@phosphor-icons/react";

const inputClass = "w-full bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground/60 px-3 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all";

export default function EditaSpesaPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errore, setErrore] = useState("");
  const [data, setData] = useState("");
  const [descrizione, setDescrizione] = useState("");
  const [importo, setImporto] = useState("");

  useEffect(() => {
    async function carica() {
      const { data: spesa, error } = await supabase.from("spese").select("*").eq("id", id).single();
      if (error || !spesa) { router.push("/dashboard/spese"); return; }
      setData(spesa.data);
      setDescrizione(spesa.descrizione);
      setImporto(String(spesa.importo));
      setLoading(false);
    }
    carica();
  }, [id]);

  async function salva(e: React.FormEvent) {
    e.preventDefault();
    const importoNum = parseFloat(importo.replace(",", "."));
    if (isNaN(importoNum) || importoNum <= 0) { setErrore("Importo non valido."); return; }
    setSaving(true);
    const { error } = await supabase.from("spese").update({ data, descrizione: descrizione.trim(), importo: importoNum }).eq("id", id);
    if (error) { setErrore("Errore: " + error.message); setSaving(false); return; }
    router.push("/dashboard/spese");
    router.refresh();
  }

  async function elimina() {
    if (!confirm("Eliminare questa spesa?")) return;
    setDeleting(true);
    await supabase.from("spese").delete().eq("id", id);
    router.push("/dashboard/spese");
    router.refresh();
  }

  if (loading) return <div className="p-6 text-sm text-muted-foreground">Caricamento…</div>;

  return (
    <div>
      <div className="border-b border-border px-6 py-3 flex items-center gap-3 bg-card">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={13} weight="bold" /> Spese
        </button>
        <span className="text-muted-foreground text-xs">/</span>
        <h1 className="text-sm font-semibold">Modifica spesa</h1>
      </div>
      <div className="p-6">
        <div className="max-w-md bg-card border border-border rounded-lg">
          <form onSubmit={salva} className="p-5 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Data</label>
              <input type="date" value={data} onChange={(e) => setData(e.target.value)} required className={inputClass} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Descrizione</label>
              <input type="text" value={descrizione} onChange={(e) => setDescrizione(e.target.value)} required className={inputClass} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Importo (€)</label>
              <input type="text" inputMode="decimal" value={importo} onChange={(e) => setImporto(e.target.value)} required className={inputClass + " font-mono"} />
            </div>
            {errore && <p className="text-sm text-destructive">{errore}</p>}
            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={saving} className="flex items-center gap-2 bg-primary text-primary-foreground text-sm font-semibold px-5 py-2.5 rounded-lg hover:opacity-90 disabled:opacity-50">
                <CheckCircle size={15} weight="fill" />
                {saving ? "Salvataggio…" : "Salva modifiche"}
              </button>
              <button type="button" onClick={() => router.back()} className="bg-muted text-foreground text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-muted/70">Annulla</button>
              <button type="button" onClick={elimina} disabled={deleting}
                className="ml-auto flex items-center gap-1.5 text-sm text-destructive hover:bg-destructive/10 px-3 py-2.5 rounded-lg transition-colors disabled:opacity-50">
                <Trash size={14} weight="bold" />
                {deleting ? "…" : "Elimina"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add "app/dashboard/spese/[id]/page.tsx"
git commit -m "feat: aggiungi pagina edit spesa"
```

---

## Task 5: Form edit carburante

**Files:**
- Create: `app/dashboard/carburante/[id]/page.tsx`

- [ ] **Step 1: Crea il file**

```tsx
"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, CheckCircle, Trash } from "@phosphor-icons/react";

const inputClass = "w-full bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground/60 px-3 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all font-mono";

export default function EditaCarburantePage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errore, setErrore] = useState("");
  const [data, setData] = useState("");
  const [targa, setTarga] = useState("");
  const [km, setKm] = useState("");
  const [litri, setLitri] = useState("");
  const [prezzoLitro, setPrezzoLitro] = useState("");
  const [importo, setImporto] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    async function carica() {
      const { data: rif, error } = await supabase.from("carburante").select("*").eq("id", id).single();
      if (error || !rif) { router.push("/dashboard/carburante"); return; }
      setData(rif.data);
      setTarga(rif.targa);
      setKm(rif.km != null ? String(rif.km) : "");
      setLitri(String(rif.litri));
      setPrezzoLitro(String(rif.prezzo_litro));
      setImporto(String(rif.importo));
      setNote(rif.note ?? "");
      setLoading(false);
    }
    carica();
  }, [id]);

  async function salva(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from("carburante").update({
      data,
      targa,
      km: km ? parseFloat(km) : null,
      litri: parseFloat(litri),
      prezzo_litro: parseFloat(prezzoLitro),
      importo: parseFloat(importo),
      note: note || null,
    }).eq("id", id);
    if (error) { setErrore("Errore: " + error.message); setSaving(false); return; }
    router.push("/dashboard/carburante");
    router.refresh();
  }

  async function elimina() {
    if (!confirm("Eliminare questo rifornimento?")) return;
    setDeleting(true);
    await supabase.from("carburante").delete().eq("id", id);
    router.push("/dashboard/carburante");
    router.refresh();
  }

  if (loading) return <div className="p-6 text-sm text-muted-foreground">Caricamento…</div>;

  return (
    <div>
      <div className="border-b border-border px-6 py-3 flex items-center gap-3 bg-card">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={13} weight="bold" /> Carburante
        </button>
        <span className="text-muted-foreground text-xs">/</span>
        <h1 className="text-sm font-semibold">Modifica rifornimento</h1>
      </div>
      <div className="p-6">
        <div className="max-w-md bg-card border border-border rounded-lg">
          <form onSubmit={salva} className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Data"><input type="date" value={data} onChange={(e) => setData(e.target.value)} required className={inputClass} /></Field>
              <Field label="Targa"><input type="text" value={targa} onChange={(e) => setTarga(e.target.value.toUpperCase())} required placeholder="AB123CD" className={inputClass} /></Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Litri"><input type="number" step="0.01" value={litri} onChange={(e) => setLitri(e.target.value)} required placeholder="45.00" className={inputClass} /></Field>
              <Field label="€/litro"><input type="number" step="0.001" value={prezzoLitro} onChange={(e) => setPrezzoLitro(e.target.value)} required placeholder="1.899" className={inputClass} /></Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Importo (€)"><input type="number" step="0.01" value={importo} onChange={(e) => setImporto(e.target.value)} required placeholder="85.45" className={inputClass} /></Field>
              <Field label="Km tachigrafo (opz.)"><input type="number" value={km} onChange={(e) => setKm(e.target.value)} placeholder="123456" className={inputClass} /></Field>
            </div>
            <Field label="Note (opz.)"><input type="text" value={note} onChange={(e) => setNote(e.target.value)} className={inputClass.replace("font-mono", "")} /></Field>
            {errore && <p className="text-sm text-destructive">{errore}</p>}
            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={saving} className="flex items-center gap-2 bg-primary text-primary-foreground text-sm font-semibold px-5 py-2.5 rounded-lg hover:opacity-90 disabled:opacity-50">
                <CheckCircle size={15} weight="fill" />
                {saving ? "Salvataggio…" : "Salva modifiche"}
              </button>
              <button type="button" onClick={() => router.back()} className="bg-muted text-foreground text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-muted/70">Annulla</button>
              <button type="button" onClick={elimina} disabled={deleting}
                className="ml-auto flex items-center gap-1.5 text-sm text-destructive hover:bg-destructive/10 px-3 py-2.5 rounded-lg transition-colors disabled:opacity-50">
                <Trash size={14} weight="bold" />
                {deleting ? "…" : "Elimina"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</label>
      {children}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add "app/dashboard/carburante/[id]/page.tsx"
git commit -m "feat: aggiungi pagina edit carburante"
```

---

## Task 6: Righe lista come Link

**Files:**
- Modify: `app/dashboard/corse/page.tsx`
- Modify: `app/dashboard/turni/page.tsx`
- Modify: `app/dashboard/spese/page.tsx`
- Modify: `app/dashboard/carburante/page.tsx`

- [ ] **Step 1: Corse — wrappa ogni riga in Link**

In `app/dashboard/corse/page.tsx`, aggiungi import:
```tsx
import Link from "next/link";
```

Sostituisci `<div key={c.id} className="hover:bg-muted/20 transition-colors">` con:
```tsx
<Link key={c.id} href={`/dashboard/corse/${c.id}`} className="block hover:bg-muted/20 transition-colors cursor-pointer">
```
E chiudi con `</Link>` invece di `</div>`.

- [ ] **Step 2: Turni — wrappa ogni riga in Link**

In `app/dashboard/turni/page.tsx`, aggiungi import `Link`. Sostituisci la riga map:
```tsx
<Link key={t.id} href={`/dashboard/turni/${t.id}`}
  className="grid grid-cols-4 px-4 py-3 hover:bg-muted/20 transition-colors cursor-pointer">
  {/* ... contenuto riga invariato ... */}
</Link>
```
Rimuovi il `<div>` wrapper esistente.

- [ ] **Step 3: Spese — aggiungi Link per ogni spesa**

In `app/dashboard/spese/page.tsx`, la riga desktop ha già un bottone "Elimina". Aggiungi un link "Modifica" accanto ad esso:

```tsx
<Link href={`/dashboard/spese/${s.id}`}
  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors px-2 py-1 rounded hover:bg-primary/10">
  ✏ Modifica
</Link>
```
Aggiungi `import Link from "next/link"` in cima.

- [ ] **Step 4: Carburante — aggiungi Link per ogni riga**

In `app/dashboard/carburante/page.tsx`, wrappa ogni riga o aggiungi link modifica nello stesso pattern di spese. (Adatta in base alla struttura della pagina carburante esistente.)

- [ ] **Step 5: Verifica navigazione**

```bash
npm run dev
```

Clicca una riga corse → si apre `/dashboard/corse/[id]` pre-popolato. Stessa verifica per turni, spese, carburante. Il bottone back torna alla lista.

- [ ] **Step 6: Commit**

```bash
git add app/dashboard/corse/page.tsx app/dashboard/turni/page.tsx app/dashboard/spese/page.tsx app/dashboard/carburante/page.tsx
git commit -m "feat: rendi ogni riga di lista cliccabile per modifica"
```
