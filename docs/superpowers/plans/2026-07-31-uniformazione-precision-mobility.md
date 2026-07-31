# Uniformazione grafica "Precision Mobility" — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Applicare a tutte le pagine rimaste allo stile "pre-Stitch" lo stesso linguaggio visivo Precision Mobility già in uso in Home/Turni/Corse/Cassa/Carburante/Stipendio/Report/WhatsApp — solo classi Tailwind/JSX di presentazione, nessuna modifica a logica, query o validazioni.

**Architecture:** Sostituzioni di classi mirate e ripetibili in ~17 file, applicate con l'`Edit` tool (`old_string`/`new_string`), file per file. Nessuna modifica a `globals.css` (i token ci sono già) né a `components/navbar.tsx` (già coerente).

**Tech Stack:** Next.js 16 App Router, Tailwind v4 (token in `app/globals.css`), nessuna dipendenza nuova.

**Spec di riferimento:** `docs/superpowers/specs/2026-07-31-uniformazione-precision-mobility-design.md`

---

## Regole di sostituzione globali (usate in quasi tutti i task)

| Da | A | Dove |
|---|---|---|
| `border-b border-border px-6 py-3 ... bg-card` (header non sticky) | `sticky top-0 z-30 bg-surface/80 backdrop-blur-xl border-b border-border-subtle h-16 ... px-4 md:px-10` | Header di pagina |
| `text-sm font-semibold` (titolo h1) | `font-heading text-lg font-bold text-primary` | Titolo pagina |
| `bg-card border border-border rounded-lg` | `glass-card rounded-2xl` | Card/contenitore principale |
| `p-6` (wrapper pagina, fuori dalla card) | `px-4 md:px-10 py-8` | Wrapper contenuto |
| `border-border` (bordi interni a card/tabelle) | `border-border-subtle` | Divisori interni |
| `divide-border` | `divide-border-subtle` | Liste/tabelle |
| `text-muted-foreground` | `text-on-surface-variant` | Testo secondario |
| `bg-muted/30` (header riga tabella) + `text-xs font-medium text-muted-foreground uppercase tracking-wider` | `bg-surface-container-low/50` + `text-[11px] font-bold uppercase tracking-wider text-on-secondary-container` | Header colonne tabella |
| `hover:bg-muted/20` | `hover:bg-surface-variant/20` | Hover riga tabella |

Non toccare: colori semantici di stato (`amber-400`, `emerald-400`, `blue-400`, `slate-400`, `purple-400`, `destructive`), classi degli `<input>` (`inputClass`), pulsanti "Annulla"/`bg-muted` (già neutri e coerenti), logica dei componenti, query Supabase.

---

### Task 1: `app/dashboard/admin/page.tsx`

**Files:**
- Modify: `app/dashboard/admin/page.tsx`

- [ ] **Step 1: Sostituisci header e card con lo stile Precision Mobility**

old_string:
```tsx
    <div>
      <div className="border-b border-border px-6 py-3 bg-card">
        <h1 className="text-sm font-semibold">Amministrazione</h1>
        <p className="text-xs text-muted-foreground">Gestione utenti e permessi</p>
      </div>
      <div className="p-6 grid gap-4 sm:grid-cols-2 max-w-xl">
        <Link
          href="/dashboard/admin/utenti"
          className="flex items-center gap-4 bg-card border border-border rounded-lg p-4 hover:border-primary/40 transition-colors group"
        >
          <div className="w-10 h-10 rounded-xl bg-slate-400/15 text-slate-400 flex items-center justify-center">
            <Users size={20} weight="fill" />
          </div>
          <div>
            <p className="text-sm font-semibold">Autisti</p>
            <p className="text-xs text-muted-foreground">Invita e gestisci gli autisti</p>
          </div>
        </Link>
        <Link
          href="/dashboard/admin/ruoli"
          className="flex items-center gap-4 bg-card border border-border rounded-lg p-4 hover:border-primary/40 transition-colors group"
        >
          <div className="w-10 h-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
            <Shield size={20} weight="fill" />
          </div>
          <div>
            <p className="text-sm font-semibold">Ruoli e permessi</p>
            <p className="text-xs text-muted-foreground">Configura accessi per sezione</p>
          </div>
        </Link>
      </div>
    </div>
```

new_string:
```tsx
    <div>
      <header className="sticky top-0 z-30 bg-surface/80 backdrop-blur-xl border-b border-border-subtle h-16 flex items-center px-4 md:px-10">
        <div>
          <h1 className="font-heading text-lg font-bold text-primary">Amministrazione</h1>
          <p className="text-xs text-on-surface-variant">Gestione utenti e permessi</p>
        </div>
      </header>
      <div className="px-4 md:px-10 py-8 grid gap-4 sm:grid-cols-2 max-w-xl">
        <Link
          href="/dashboard/admin/utenti"
          className="flex items-center gap-4 glass-card rounded-2xl p-4 hover:border-primary/50 transition-all duration-300 group"
        >
          <div className="w-10 h-10 rounded-xl bg-slate-400/15 text-slate-400 flex items-center justify-center">
            <Users size={20} weight="fill" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Autisti</p>
            <p className="text-xs text-on-surface-variant">Invita e gestisci gli autisti</p>
          </div>
        </Link>
        <Link
          href="/dashboard/admin/ruoli"
          className="flex items-center gap-4 glass-card rounded-2xl p-4 hover:border-primary/50 transition-all duration-300 group"
        >
          <div className="w-10 h-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
            <Shield size={20} weight="fill" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Ruoli e permessi</p>
            <p className="text-xs text-on-surface-variant">Configura accessi per sezione</p>
          </div>
        </Link>
      </div>
    </div>
```

- [ ] **Step 2: Commit**

```bash
git add app/dashboard/admin/page.tsx
git commit -m "Uniforma admin/page.tsx allo stile Precision Mobility"
```

---

### Task 2: `app/dashboard/admin/ruoli/page.tsx`

**Files:**
- Modify: `app/dashboard/admin/ruoli/page.tsx`

- [ ] **Step 1: Header sticky**

old_string:
```tsx
      <div className="border-b border-border px-6 py-3 flex items-center gap-3 bg-card">
        <Link href="/dashboard/admin" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={13} weight="bold" /> Admin
        </Link>
        <span className="text-muted-foreground text-xs">/</span>
        <h1 className="text-sm font-semibold">Ruoli e permessi</h1>
      </div>
      <div className="p-6 space-y-6">
```

new_string:
```tsx
      <header className="sticky top-0 z-30 bg-surface/80 backdrop-blur-xl border-b border-border-subtle h-16 flex items-center gap-3 px-4 md:px-10">
        <Link href="/dashboard/admin" className="flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-foreground transition-colors">
          <ArrowLeft size={13} weight="bold" /> Admin
        </Link>
        <span className="text-on-surface-variant text-xs">/</span>
        <h1 className="font-heading text-lg font-bold text-primary">Ruoli e permessi</h1>
      </header>
      <div className="px-4 md:px-10 py-8 space-y-6">
```

- [ ] **Step 2: Card per ruolo + header tabella permessi**

old_string:
```tsx
          <div key={ruolo.id} className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="border-b border-border px-4 py-3">
              <p className="text-sm font-semibold capitalize">{ruolo.nome}</p>
              {ruolo.descrizione && (
                <p className="text-xs text-muted-foreground">{ruolo.descrizione}</p>
              )}
            </div>
            <div className="divide-y divide-border">
              <div className="grid grid-cols-4 px-4 py-1.5 bg-muted/30">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Sezione</span>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider text-center">Visualizza</span>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider text-center">Modifica</span>
                <span />
              </div>
```

new_string:
```tsx
          <div key={ruolo.id} className="glass-card rounded-2xl overflow-hidden">
            <div className="border-b border-border-subtle px-4 py-3">
              <p className="text-sm font-semibold capitalize text-foreground">{ruolo.nome}</p>
              {ruolo.descrizione && (
                <p className="text-xs text-on-surface-variant">{ruolo.descrizione}</p>
              )}
            </div>
            <div className="divide-y divide-border-subtle">
              <div className="grid grid-cols-4 px-4 py-1.5 bg-surface-container-low/50">
                <span className="text-[11px] font-bold uppercase tracking-wider text-on-secondary-container">Sezione</span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-on-secondary-container text-center">Visualizza</span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-on-secondary-container text-center">Modifica</span>
                <span />
              </div>
```

- [ ] **Step 3: Testo riga sezione + empty state**

old_string:
```tsx
                    <span className="text-sm capitalize">{sezione}</span>
```

new_string:
```tsx
                    <span className="text-sm capitalize text-foreground">{sezione}</span>
```

old_string:
```tsx
        {ruoli.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            Nessun ruolo trovato. Esegui la migrazione SQL nel Supabase dashboard.
          </p>
        )}
```

new_string:
```tsx
        {ruoli.length === 0 && (
          <p className="text-sm text-on-surface-variant text-center py-8">
            Nessun ruolo trovato. Esegui la migrazione SQL nel Supabase dashboard.
          </p>
        )}
```

- [ ] **Step 4: Commit**

```bash
git add app/dashboard/admin/ruoli/page.tsx
git commit -m "Uniforma admin/ruoli/page.tsx allo stile Precision Mobility"
```

---

### Task 3: `app/dashboard/admin/utenti/page.tsx`

**Files:**
- Modify: `app/dashboard/admin/utenti/page.tsx`

- [ ] **Step 1: Sostituisci l'intero markup di ritorno**

old_string:
```tsx
  return (
    <div>
      <div className="border-b border-border px-6 py-3 flex items-center justify-between bg-card">
        <div>
          <h1 className="text-sm font-semibold">Gestione autisti</h1>
          <p className="text-xs text-muted-foreground">{autisti.length} autisti registrati</p>
        </div>
        <Link href="/dashboard/admin/utenti/invita" className={cn(buttonVariants({ size: "sm" }), "text-xs")}>
          + Invita autista
        </Link>
      </div>
      <div className="p-6">
        <div className="bg-card border border-border rounded overflow-hidden">
          <div className="grid grid-cols-3 px-4 py-2 border-b border-border bg-muted/30">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Nome</span>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</span>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Ruolo</span>
          </div>
          <div className="divide-y divide-border">
            {autisti.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                Nessun autista registrato
              </div>
            )}
            {autisti.map((a) => (
              <div key={a.id} className="grid grid-cols-3 px-4 py-3 items-center hover:bg-muted/20 transition-colors">
                <span className="text-sm font-medium">{a.nome}</span>
                <span className="text-sm text-muted-foreground">{a.email}</span>
                <span className="text-xs bg-muted px-2 py-0.5 rounded w-fit">
                  {(Array.isArray(a.ruoli) ? (a.ruoli as { nome: string }[])[0]?.nome : (a.ruoli as unknown as { nome: string } | null)?.nome) ?? "autista"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
```

new_string:
```tsx
  return (
    <div>
      <header className="sticky top-0 z-30 bg-surface/80 backdrop-blur-xl border-b border-border-subtle h-16 flex items-center justify-between px-4 md:px-10">
        <div>
          <h1 className="font-heading text-lg font-bold text-primary">Gestione autisti</h1>
          <p className="text-xs text-on-surface-variant">{autisti.length} autisti registrati</p>
        </div>
        <Link href="/dashboard/admin/utenti/invita" className={cn(buttonVariants({ size: "sm" }), "text-xs font-bold uppercase tracking-wide shadow-lg shadow-primary/20")}>
          + Invita autista
        </Link>
      </header>
      <div className="px-4 md:px-10 py-8">
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="grid grid-cols-3 px-4 py-2 border-b border-border-subtle bg-surface-container-low/50">
            <span className="text-[11px] font-bold uppercase tracking-wider text-on-secondary-container">Nome</span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-on-secondary-container">Email</span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-on-secondary-container">Ruolo</span>
          </div>
          <div className="divide-y divide-border-subtle">
            {autisti.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-on-surface-variant">
                Nessun autista registrato
              </div>
            )}
            {autisti.map((a) => (
              <div key={a.id} className="grid grid-cols-3 px-4 py-3 items-center hover:bg-surface-variant/20 transition-colors">
                <span className="text-sm font-medium text-foreground">{a.nome}</span>
                <span className="text-sm text-on-surface-variant">{a.email}</span>
                <span className="text-xs bg-muted px-2 py-0.5 rounded w-fit">
                  {(Array.isArray(a.ruoli) ? (a.ruoli as { nome: string }[])[0]?.nome : (a.ruoli as unknown as { nome: string } | null)?.nome) ?? "autista"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
```

- [ ] **Step 2: Commit**

```bash
git add app/dashboard/admin/utenti/page.tsx
git commit -m "Uniforma admin/utenti/page.tsx allo stile Precision Mobility"
```

---

### Task 4: `app/dashboard/admin/utenti/invita/page.tsx`

**Files:**
- Modify: `app/dashboard/admin/utenti/invita/page.tsx`

- [ ] **Step 1: Header + card form**

old_string:
```tsx
    <div>
      <div className="border-b border-border px-6 py-3 flex items-center gap-3 bg-card">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={13} weight="bold" /> Admin
        </button>
        <span className="text-muted-foreground text-xs">/</span>
        <h1 className="text-sm font-semibold">Invita autista</h1>
      </div>
      <div className="p-6">
        <div className="max-w-md bg-card border border-border rounded-lg">
          <div className="border-b border-border px-5 py-3">
            <p className="text-xs text-muted-foreground">
              L&apos;autista riceverà una email con il link di registrazione.
            </p>
          </div>
          <form onSubmit={invita} className="p-5 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Nome
              </label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
                placeholder="Mario Rossi"
                className={inputClass}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Email
              </label>
```

new_string:
```tsx
    <div>
      <header className="sticky top-0 z-30 bg-surface/80 backdrop-blur-xl border-b border-border-subtle h-16 flex items-center gap-3 px-4 md:px-10">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-foreground transition-colors"
        >
          <ArrowLeft size={13} weight="bold" /> Admin
        </button>
        <span className="text-on-surface-variant text-xs">/</span>
        <h1 className="font-heading text-lg font-bold text-primary">Invita autista</h1>
      </header>
      <div className="px-4 md:px-10 py-8">
        <div className="max-w-md glass-card rounded-2xl">
          <div className="border-b border-border-subtle px-5 py-3">
            <p className="text-xs text-on-surface-variant">
              L&apos;autista riceverà una email con il link di registrazione.
            </p>
          </div>
          <form onSubmit={invita} className="p-5 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                Nome
              </label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
                placeholder="Mario Rossi"
                className={inputClass}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                Email
              </label>
```

- [ ] **Step 2: Commit**

```bash
git add app/dashboard/admin/utenti/invita/page.tsx
git commit -m "Uniforma admin/utenti/invita/page.tsx allo stile Precision Mobility"
```

---

### Task 5: `app/dashboard/agenda/page.tsx`

**Files:**
- Modify: `app/dashboard/agenda/page.tsx`

- [ ] **Step 1: Header sticky**

old_string:
```tsx
      {/* Command bar */}
      <div className="border-b border-border px-6 py-3 flex items-center justify-between bg-card">
        <div className="flex items-center gap-4">
          <h1 className="text-sm font-semibold text-foreground">Agenda</h1>
          <AgendaNav anno={anno} mese={mese} />
        </div>
        <div className="flex items-center gap-2">
          <IcalButton anno={anno} mese={mese} />
          {!integrazioneConnessa && <GoogleCalendarButton />}
          {integrazioneConnessa && (
            <span className="text-xs text-green-400 border border-green-400/30 rounded-lg px-2 py-1">
              Google Calendar connesso
            </span>
          )}
        </div>
      </div>

      <div className="p-6 space-y-2 max-w-2xl">
```

new_string:
```tsx
      {/* Header */}
      <header className="sticky top-0 z-30 bg-surface/80 backdrop-blur-xl border-b border-border-subtle h-16 flex items-center justify-between px-4 md:px-10">
        <div className="flex items-center gap-4">
          <h1 className="font-heading text-lg font-bold text-primary">Agenda</h1>
          <AgendaNav anno={anno} mese={mese} />
        </div>
        <div className="flex items-center gap-2">
          <IcalButton anno={anno} mese={mese} />
          {!integrazioneConnessa && <GoogleCalendarButton />}
          {integrazioneConnessa && (
            <span className="text-xs text-green-400 border border-green-400/30 rounded-lg px-2 py-1">
              Google Calendar connesso
            </span>
          )}
        </div>
      </header>

      <div className="px-4 md:px-10 py-8 space-y-2 max-w-2xl">
```

- [ ] **Step 2: Card giorno con servizi**

old_string:
```tsx
          return (
            <div key={dataStr} className={cn(
              "bg-card border border-border rounded-lg overflow-hidden",
              isOggi && "border-primary/40"
            )}>
              {/* Header giorno */}
              <div className={cn(
                "flex items-center justify-between px-4 py-2 border-b border-border",
                isOggi ? "bg-primary/10" : "bg-muted/20"
              )}>
                <span className={cn(
                  "text-sm font-semibold capitalize",
                  isOggi ? "text-primary" : "text-foreground"
                )}>
                  {giorno.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" })}
                  {isOggi && <span className="ml-2 text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded-lg">Oggi</span>}
                </span>
                <span className="text-xs text-muted-foreground">{corseGiorno.length} serviz{corseGiorno.length === 1 ? "io" : "i"}</span>
              </div>

              {/* Servizi del giorno */}
              <div className="divide-y divide-border">
                {corseGiorno.map((c) => (
                  <div key={c.id} className="px-4 py-3 flex items-start gap-4">
                    <div className="font-mono text-sm text-muted-foreground shrink-0 w-20">
                      {c.ora_partenza.slice(0, 5)}
                      {c.ora_fine && <><br /><span className="text-xs">→ {c.ora_fine.slice(0, 5)}</span></>}
                    </div>
                    <div className="flex-1 min-w-0">
                      {c.cliente_nome && (
                        <p className="text-sm font-medium text-foreground">{c.cliente_nome}
                          {c.n_pax && c.n_pax > 1 && <span className="ml-2 text-xs text-muted-foreground">{c.n_pax} pax</span>}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground truncate">{c.origine} → {c.destinazione}</p>
                      {c.tipo_servizio && <p className="text-xs text-muted-foreground/60">{c.tipo_servizio}</p>}
                    </div>
```

new_string:
```tsx
          return (
            <div key={dataStr} className={cn(
              "glass-card rounded-2xl overflow-hidden",
              isOggi && "border-primary/40"
            )}>
              {/* Header giorno */}
              <div className={cn(
                "flex items-center justify-between px-4 py-2 border-b border-border-subtle",
                isOggi ? "bg-primary/10" : "bg-surface-container-low/50"
              )}>
                <span className={cn(
                  "text-sm font-semibold capitalize",
                  isOggi ? "text-primary" : "text-foreground"
                )}>
                  {giorno.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" })}
                  {isOggi && <span className="ml-2 text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded-lg">Oggi</span>}
                </span>
                <span className="text-xs text-on-surface-variant">{corseGiorno.length} serviz{corseGiorno.length === 1 ? "io" : "i"}</span>
              </div>

              {/* Servizi del giorno */}
              <div className="divide-y divide-border-subtle">
                {corseGiorno.map((c) => (
                  <div key={c.id} className="px-4 py-3 flex items-start gap-4">
                    <div className="font-mono text-sm text-on-surface-variant shrink-0 w-20">
                      {c.ora_partenza.slice(0, 5)}
                      {c.ora_fine && <><br /><span className="text-xs">→ {c.ora_fine.slice(0, 5)}</span></>}
                    </div>
                    <div className="flex-1 min-w-0">
                      {c.cliente_nome && (
                        <p className="text-sm font-medium text-foreground">{c.cliente_nome}
                          {c.n_pax && c.n_pax > 1 && <span className="ml-2 text-xs text-on-surface-variant">{c.n_pax} pax</span>}
                        </p>
                      )}
                      <p className="text-xs text-on-surface-variant truncate">{c.origine} → {c.destinazione}</p>
                      {c.tipo_servizio && <p className="text-xs text-on-surface-variant/60">{c.tipo_servizio}</p>}
                    </div>
```

- [ ] **Step 3: Giorni senza servizi (empty row)**

old_string:
```tsx
              <div key={dataStr} className={cn(
                "flex items-center gap-3 px-4 py-2 rounded-lg text-xs text-muted-foreground/50",
                isOggi && "bg-primary/5 text-primary font-medium"
              )}>
```

new_string:
```tsx
              <div key={dataStr} className={cn(
                "flex items-center gap-3 px-4 py-2 rounded-lg text-xs text-on-surface-variant/50",
                isOggi && "bg-primary/5 text-primary font-medium"
              )}>
```

- [ ] **Step 4: Commit**

```bash
git add app/dashboard/agenda/page.tsx
git commit -m "Uniforma agenda/page.tsx allo stile Precision Mobility"
```

---

### Task 6: `app/dashboard/corse/nuova/page.tsx`

**Files:**
- Modify: `app/dashboard/corse/nuova/page.tsx`

- [ ] **Step 1: Header + apertura card form**

old_string:
```tsx
    <div>
      {/* Command bar */}
      <div className="border-b border-border px-6 py-3 flex items-center gap-3 bg-card">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={13} weight="bold" />
          Indietro
        </button>
        <span className="text-muted-foreground text-xs">/</span>
        <h1 className="text-sm font-semibold text-foreground">Nuova corsa</h1>
      </div>

      <div className="p-6">
        <div className="max-w-md bg-card border border-border rounded-lg">
          <div className="border-b border-border px-5 py-3">
            <p className="text-xs text-muted-foreground">Inserisci i dettagli della corsa</p>
          </div>
          <form onSubmit={salva} className="p-5 space-y-5">
```

new_string:
```tsx
    <div>
      {/* Header */}
      <header className="sticky top-0 z-30 bg-surface/80 backdrop-blur-xl border-b border-border-subtle h-16 flex items-center gap-3 px-4 md:px-10">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-foreground transition-colors"
        >
          <ArrowLeft size={13} weight="bold" />
          Indietro
        </button>
        <span className="text-on-surface-variant text-xs">/</span>
        <h1 className="font-heading text-lg font-bold text-primary">Nuova corsa</h1>
      </header>

      <div className="px-4 md:px-10 py-8">
        <div className="max-w-md glass-card rounded-2xl">
          <div className="border-b border-border-subtle px-5 py-3">
            <p className="text-xs text-on-surface-variant">Inserisci i dettagli della corsa</p>
          </div>
          <form onSubmit={salva} className="p-5 space-y-5">
```

- [ ] **Step 2: Sezione "Dettaglio ordine"**

old_string:
```tsx
            {/* Sezione dettaglio ordine */}
            <div className="border-t border-border pt-5 space-y-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Dettaglio ordine
              </p>
```

new_string:
```tsx
            {/* Sezione dettaglio ordine */}
            <div className="border-t border-border-subtle pt-5 space-y-4">
              <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                Dettaglio ordine
              </p>
```

- [ ] **Step 3: Label del componente `Field`**

old_string:
```tsx
      <label className={cn("flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider")}>
        {Icon && <Icon size={11} weight="bold" className={iconClass} />}
        {label}
      </label>
```

new_string:
```tsx
      <label className={cn("flex items-center gap-1.5 text-xs font-semibold text-on-surface-variant uppercase tracking-wider")}>
        {Icon && <Icon size={11} weight="bold" className={iconClass} />}
        {label}
      </label>
```

- [ ] **Step 4: Commit**

```bash
git add app/dashboard/corse/nuova/page.tsx
git commit -m "Uniforma corse/nuova/page.tsx allo stile Precision Mobility"
```

---

### Task 7: `app/dashboard/corse/[id]/page.tsx`

**Files:**
- Modify: `app/dashboard/corse/[id]/page.tsx`

- [ ] **Step 1: Header + apertura card form**

old_string:
```tsx
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
```

new_string:
```tsx
      <header className="sticky top-0 z-30 bg-surface/80 backdrop-blur-xl border-b border-border-subtle h-16 flex items-center gap-3 px-4 md:px-10">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-foreground transition-colors"
        >
          <ArrowLeft size={13} weight="bold" />
          Corse
        </button>
        <span className="text-on-surface-variant text-xs">/</span>
        <h1 className="font-heading text-lg font-bold text-primary">Modifica corsa</h1>
      </header>

      <div className="px-4 md:px-10 py-8">
        <div className="max-w-md glass-card rounded-2xl">
          <div className="border-b border-border-subtle px-5 py-3">
            <p className="text-xs text-on-surface-variant">Modifica i dettagli della corsa</p>
          </div>
          <form onSubmit={salva} className="p-5 space-y-5">
```

- [ ] **Step 2: Sezione "Dettaglio ordine"**

old_string:
```tsx
            {/* Dettaglio ordine */}
            <div className="border-t border-border pt-5 space-y-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Dettaglio ordine</p>
```

new_string:
```tsx
            {/* Dettaglio ordine */}
            <div className="border-t border-border-subtle pt-5 space-y-4">
              <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Dettaglio ordine</p>
```

- [ ] **Step 3: Label del componente `Field`**

old_string:
```tsx
      <label className={cn("flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider")}>
        {Icon && <Icon size={11} weight="bold" className={iconClass} />}
        {label}
      </label>
```

new_string:
```tsx
      <label className={cn("flex items-center gap-1.5 text-xs font-semibold text-on-surface-variant uppercase tracking-wider")}>
        {Icon && <Icon size={11} weight="bold" className={iconClass} />}
        {label}
      </label>
```

- [ ] **Step 4: Loading state**

old_string:
```tsx
  if (loading) {
    return (
      <div className="p-6 text-sm text-muted-foreground">Caricamento…</div>
    );
  }
```

new_string:
```tsx
  if (loading) {
    return (
      <div className="px-4 md:px-10 py-8 text-sm text-on-surface-variant">Caricamento…</div>
    );
  }
```

- [ ] **Step 5: Commit**

```bash
git add "app/dashboard/corse/[id]/page.tsx"
git commit -m "Uniforma corse/[id]/page.tsx allo stile Precision Mobility"
```

---

### Task 8: `app/dashboard/turni/nuovo/page.tsx`

**Files:**
- Modify: `app/dashboard/turni/nuovo/page.tsx`

- [ ] **Step 1: Header + card form**

old_string:
```tsx
    <div>
      {/* Command bar */}
      <div className="border-b border-border px-6 py-3 flex items-center gap-3 bg-card">
        <button
          onClick={() => router.back()}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Indietro
        </button>
        <span className="text-muted-foreground text-xs">/</span>
        <h1 className="text-sm font-semibold text-foreground">Nuovo turno</h1>
      </div>

      <div className="p-6">
        <div className="max-w-md bg-card border border-border rounded-lg">
          <div className="border-b border-border px-5 py-3">
            <p className="text-xs text-muted-foreground">Registra il tuo orario di lavoro</p>
          </div>
          <form onSubmit={salva} className="p-5 space-y-4">
```

new_string:
```tsx
    <div>
      {/* Header */}
      <header className="sticky top-0 z-30 bg-surface/80 backdrop-blur-xl border-b border-border-subtle h-16 flex items-center gap-3 px-4 md:px-10">
        <button
          onClick={() => router.back()}
          className="text-xs text-on-surface-variant hover:text-foreground transition-colors"
        >
          ← Indietro
        </button>
        <span className="text-on-surface-variant text-xs">/</span>
        <h1 className="font-heading text-lg font-bold text-primary">Nuovo turno</h1>
      </header>

      <div className="px-4 md:px-10 py-8">
        <div className="max-w-md glass-card rounded-2xl">
          <div className="border-b border-border-subtle px-5 py-3">
            <p className="text-xs text-on-surface-variant">Registra il tuo orario di lavoro</p>
          </div>
          <form onSubmit={salva} className="p-5 space-y-4">
```

- [ ] **Step 2: Label del componente `Field`**

old_string:
```tsx
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</label>
      {children}
    </div>
  );
}
```

new_string:
```tsx
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-on-surface-variant uppercase tracking-wider">{label}</label>
      {children}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add app/dashboard/turni/nuovo/page.tsx
git commit -m "Uniforma turni/nuovo/page.tsx allo stile Precision Mobility"
```

---

### Task 9: `app/dashboard/turni/[id]/page.tsx`

**Files:**
- Modify: `app/dashboard/turni/[id]/page.tsx`

- [ ] **Step 1: Loading state**

old_string:
```tsx
  if (loading) return <div className="p-6 text-sm text-muted-foreground">Caricamento…</div>;
```

new_string:
```tsx
  if (loading) return <div className="px-4 md:px-10 py-8 text-sm text-on-surface-variant">Caricamento…</div>;
```

- [ ] **Step 2: Header + card form**

old_string:
```tsx
      <div className="border-b border-border px-6 py-3 flex items-center gap-3 bg-card">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={13} weight="bold" /> Turni
        </button>
        <span className="text-muted-foreground text-xs">/</span>
        <h1 className="text-sm font-semibold">Modifica turno</h1>
      </div>
      <div className="p-6">
        <div className="max-w-md bg-card border border-border rounded-lg">
          <div className="border-b border-border px-5 py-3">
            <p className="text-xs text-muted-foreground">Modifica l'orario di lavoro</p>
          </div>
          <form onSubmit={salva} className="p-5 space-y-4">
```

new_string:
```tsx
      <header className="sticky top-0 z-30 bg-surface/80 backdrop-blur-xl border-b border-border-subtle h-16 flex items-center gap-3 px-4 md:px-10">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-foreground transition-colors">
          <ArrowLeft size={13} weight="bold" /> Turni
        </button>
        <span className="text-on-surface-variant text-xs">/</span>
        <h1 className="font-heading text-lg font-bold text-primary">Modifica turno</h1>
      </header>
      <div className="px-4 md:px-10 py-8">
        <div className="max-w-md glass-card rounded-2xl">
          <div className="border-b border-border-subtle px-5 py-3">
            <p className="text-xs text-on-surface-variant">Modifica l'orario di lavoro</p>
          </div>
          <form onSubmit={salva} className="p-5 space-y-4">
```

- [ ] **Step 3: Label del componente `Field`**

old_string:
```tsx
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</label>
      {children}
    </div>
  );
}
```

new_string:
```tsx
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-on-surface-variant uppercase tracking-wider">{label}</label>
      {children}
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add "app/dashboard/turni/[id]/page.tsx"
git commit -m "Uniforma turni/[id]/page.tsx allo stile Precision Mobility"
```

---

### Task 10: `app/dashboard/spese/[id]/page.tsx`

**Files:**
- Modify: `app/dashboard/spese/[id]/page.tsx`

- [ ] **Step 1: Loading state**

old_string:
```tsx
  if (loading) return <div className="p-6 text-sm text-muted-foreground">Caricamento…</div>;
```

new_string:
```tsx
  if (loading) return <div className="px-4 md:px-10 py-8 text-sm text-on-surface-variant">Caricamento…</div>;
```

- [ ] **Step 2: Header + card form**

old_string:
```tsx
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
```

new_string:
```tsx
      <header className="sticky top-0 z-30 bg-surface/80 backdrop-blur-xl border-b border-border-subtle h-16 flex items-center gap-3 px-4 md:px-10">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-foreground transition-colors">
          <ArrowLeft size={13} weight="bold" /> Spese
        </button>
        <span className="text-on-surface-variant text-xs">/</span>
        <h1 className="font-heading text-lg font-bold text-primary">Modifica spesa</h1>
      </header>
      <div className="px-4 md:px-10 py-8">
        <div className="max-w-md glass-card rounded-2xl">
          <form onSubmit={salva} className="p-5 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Data</label>
              <input type="date" value={data} onChange={(e) => setData(e.target.value)} required className={inputClass} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Descrizione</label>
              <input type="text" value={descrizione} onChange={(e) => setDescrizione(e.target.value)} required className={inputClass} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Importo (€)</label>
```

- [ ] **Step 3: Commit**

```bash
git add "app/dashboard/spese/[id]/page.tsx"
git commit -m "Uniforma spese/[id]/page.tsx allo stile Precision Mobility"
```

---

### Task 11: `app/dashboard/carburante/[id]/page.tsx`

**Files:**
- Modify: `app/dashboard/carburante/[id]/page.tsx`

- [ ] **Step 1: Loading state**

old_string:
```tsx
  if (loading) return <div className="p-6 text-sm text-muted-foreground">Caricamento…</div>;
```

new_string:
```tsx
  if (loading) return <div className="px-4 md:px-10 py-8 text-sm text-on-surface-variant">Caricamento…</div>;
```

- [ ] **Step 2: Header + card form**

old_string:
```tsx
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
```

new_string:
```tsx
      <header className="sticky top-0 z-30 bg-surface/80 backdrop-blur-xl border-b border-border-subtle h-16 flex items-center gap-3 px-4 md:px-10">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-foreground transition-colors">
          <ArrowLeft size={13} weight="bold" /> Carburante
        </button>
        <span className="text-on-surface-variant text-xs">/</span>
        <h1 className="font-heading text-lg font-bold text-primary">Modifica rifornimento</h1>
      </header>
      <div className="px-4 md:px-10 py-8">
        <div className="max-w-md glass-card rounded-2xl">
          <form onSubmit={salva} className="p-5 space-y-4">
```

- [ ] **Step 3: Label del componente `Field`**

old_string:
```tsx
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</label>
      {children}
    </div>
  );
}
```

new_string:
```tsx
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">{label}</label>
      {children}
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add "app/dashboard/carburante/[id]/page.tsx"
git commit -m "Uniforma carburante/[id]/page.tsx allo stile Precision Mobility"
```

---

### Task 12: `app/dashboard/invia/page.tsx`

Questa pagina ha già l'header sticky Precision Mobility corretto (righe 235-241): nessuna modifica lì. Le sezioni sottostanti usano ancora `bg-card border border-border rounded-lg`.

**Files:**
- Modify: `app/dashboard/invia/page.tsx`

- [ ] **Step 1: Banner Gmail non configurato + blocco istruzioni**

old_string:
```tsx
        {/* Istruzioni App Password Gmail */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => setIstruzioniAperte((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-2.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="flex items-center gap-2 font-medium">
              <EnvelopeSimple size={13} />
              Come ottenere la App Password Gmail
            </span>
            {istruzioniAperte ? <CaretUp size={12} /> : <CaretDown size={12} />}
          </button>
          {istruzioniAperte && (
            <div className="border-t border-border px-4 py-3 text-xs text-muted-foreground space-y-1.5">
```

new_string:
```tsx
        {/* Istruzioni App Password Gmail */}
        <div className="glass-card rounded-2xl overflow-hidden">
          <button
            type="button"
            onClick={() => setIstruzioniAperte((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-2.5 text-xs text-on-surface-variant hover:text-foreground transition-colors"
          >
            <span className="flex items-center gap-2 font-medium">
              <EnvelopeSimple size={13} />
              Come ottenere la App Password Gmail
            </span>
            {istruzioniAperte ? <CaretUp size={12} /> : <CaretDown size={12} />}
          </button>
          {istruzioniAperte && (
            <div className="border-t border-border-subtle px-4 py-3 text-xs text-on-surface-variant space-y-1.5">
```

- [ ] **Step 2: Sezione A) Destinatario**

old_string:
```tsx
          {/* A) Destinatario */}
          <section className="bg-card border border-border rounded-lg">
            <div className="border-b border-border px-4 py-2 flex items-center gap-2">
              <EnvelopeSimple size={13} className="text-muted-foreground" />
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Destinatario</p>
            </div>
            <div className="px-4 py-3 space-y-2">
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="email@esempio.com"
                  value={destinatario}
                  onChange={(e) => setDestinatario(e.target.value)}
                  required
                  className={cn(inputClass, "flex-1")}
                />
                {userEmail && (
                  <button
                    type="button"
                    onClick={() => setDestinatario(userEmail)}
                    className="shrink-0 text-xs bg-muted border border-border text-muted-foreground hover:text-foreground px-3 py-2 rounded-lg transition-colors"
                  >
                    Usa mia email
                  </button>
                )}
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Oggetto</label>
```

new_string:
```tsx
          {/* A) Destinatario */}
          <section className="glass-card rounded-2xl">
            <div className="border-b border-border-subtle px-4 py-2 flex items-center gap-2">
              <EnvelopeSimple size={13} className="text-on-surface-variant" />
              <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-widest">Destinatario</p>
            </div>
            <div className="px-4 py-3 space-y-2">
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="email@esempio.com"
                  value={destinatario}
                  onChange={(e) => setDestinatario(e.target.value)}
                  required
                  className={cn(inputClass, "flex-1")}
                />
                {userEmail && (
                  <button
                    type="button"
                    onClick={() => setDestinatario(userEmail)}
                    className="shrink-0 text-xs bg-muted border border-border-subtle text-on-surface-variant hover:text-foreground px-3 py-2 rounded-lg transition-colors"
                  >
                    Usa mia email
                  </button>
                )}
              </div>
              <div>
                <label className="block text-xs text-on-surface-variant mb-1">Oggetto</label>
```

- [ ] **Step 3: Sezione B) Periodo**

old_string:
```tsx
          {/* B) Periodo */}
          <section className="bg-card border border-border rounded-lg">
            <div className="border-b border-border px-4 py-2 flex items-center gap-2">
              <CalendarBlank size={13} className="text-muted-foreground" />
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Periodo</p>
            </div>
            <div className="px-4 py-3 space-y-3">
              <div className="flex flex-wrap gap-2">
                {(["oggi", "settimana", "mese"] as const).map((tipo) => (
                  <button
                    key={tipo}
                    type="button"
                    onClick={() => impostaPeriodo(tipo)}
                    className="text-xs bg-muted border border-border text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg transition-colors capitalize"
                  >
                    {tipo === "oggi" ? "Oggi" : tipo === "settimana" ? "Questa settimana" : "Questo mese"}
                  </button>
                ))}
              </div>
              <div className="flex gap-3 items-center">
                <div className="flex-1">
                  <label className="block text-xs text-muted-foreground mb-1">Da</label>
                  <input
                    type="date"
                    value={dataInizio}
                    onChange={(e) => setDataInizio(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-muted-foreground mb-1">A</label>
```

new_string:
```tsx
          {/* B) Periodo */}
          <section className="glass-card rounded-2xl">
            <div className="border-b border-border-subtle px-4 py-2 flex items-center gap-2">
              <CalendarBlank size={13} className="text-on-surface-variant" />
              <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-widest">Periodo</p>
            </div>
            <div className="px-4 py-3 space-y-3">
              <div className="flex flex-wrap gap-2">
                {(["oggi", "settimana", "mese"] as const).map((tipo) => (
                  <button
                    key={tipo}
                    type="button"
                    onClick={() => impostaPeriodo(tipo)}
                    className="text-xs bg-muted border border-border-subtle text-on-surface-variant hover:text-foreground px-3 py-1.5 rounded-lg transition-colors capitalize"
                  >
                    {tipo === "oggi" ? "Oggi" : tipo === "settimana" ? "Questa settimana" : "Questo mese"}
                  </button>
                ))}
              </div>
              <div className="flex gap-3 items-center">
                <div className="flex-1">
                  <label className="block text-xs text-on-surface-variant mb-1">Da</label>
                  <input
                    type="date"
                    value={dataInizio}
                    onChange={(e) => setDataInizio(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-on-surface-variant mb-1">A</label>
```

- [ ] **Step 4: Sezione C) Documenti**

old_string:
```tsx
          {/* C) Documenti */}
          <section className="bg-card border border-border rounded-lg">
            <div className="border-b border-border px-4 py-2 flex items-center gap-2">
              <FileText size={13} className="text-muted-foreground" />
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Documenti da allegare</p>
            </div>
            <div className="px-4 py-3 space-y-2">
              {DOCUMENTI_DISPONIBILI.map((doc) => (
                <label
                  key={doc.id}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-all",
                    documentiSelezionati.has(doc.id)
                      ? "border-primary/40 bg-primary/5 text-foreground"
                      : "border-border text-muted-foreground hover:border-border/80 hover:text-foreground"
                  )}
                >
```

new_string:
```tsx
          {/* C) Documenti */}
          <section className="glass-card rounded-2xl">
            <div className="border-b border-border-subtle px-4 py-2 flex items-center gap-2">
              <FileText size={13} className="text-on-surface-variant" />
              <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-widest">Documenti da allegare</p>
            </div>
            <div className="px-4 py-3 space-y-2">
              {DOCUMENTI_DISPONIBILI.map((doc) => (
                <label
                  key={doc.id}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-all",
                    documentiSelezionati.has(doc.id)
                      ? "border-primary/40 bg-primary/5 text-foreground"
                      : "border-border-subtle text-on-surface-variant hover:border-border-subtle/60 hover:text-foreground"
                  )}
                >
```

- [ ] **Step 5: Sezione D) Anteprima**

old_string:
```tsx
          {/* D) Anteprima */}
          <section className="bg-card border border-border rounded-lg">
            <div className="border-b border-border px-4 py-2 flex items-center justify-between">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Anteprima corpo email</p>
              {caricandoAnteprima && (
                <span className="text-xs text-muted-foreground animate-pulse">Generazione…</span>
              )}
            </div>
```

new_string:
```tsx
          {/* D) Anteprima */}
          <section className="glass-card rounded-2xl">
            <div className="border-b border-border-subtle px-4 py-2 flex items-center justify-between">
              <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-widest">Anteprima corpo email</p>
              {caricandoAnteprima && (
                <span className="text-xs text-on-surface-variant animate-pulse">Generazione…</span>
              )}
            </div>
```

- [ ] **Step 6: Sezione F) Storico invii**

old_string:
```tsx
        {/* F) Storico invii di sessione */}
        {storico.length > 0 && (
          <section className="bg-card border border-border rounded-lg">
            <div className="border-b border-border px-4 py-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Storico invii (sessione)</p>
            </div>
            <div className="divide-y divide-border">
              {storico.map((rec) => (
                <div key={rec.id} className="px-4 py-3 flex items-start gap-3">
                  {rec.esito === "ok" ? (
                    <CheckCircle size={15} weight="fill" className="text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <Warning size={15} weight="fill" className="text-destructive shrink-0 mt-0.5" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-foreground truncate">{rec.to}</p>
                    <p className="text-xs text-muted-foreground truncate">{rec.subject}</p>
                    {rec.errore && (
                      <p className="text-xs text-destructive mt-0.5">{rec.errore}</p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">{rec.timestamp}</span>
                </div>
              ))}
            </div>
          </section>
        )}
```

new_string:
```tsx
        {/* F) Storico invii di sessione */}
        {storico.length > 0 && (
          <section className="glass-card rounded-2xl">
            <div className="border-b border-border-subtle px-4 py-2">
              <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-widest">Storico invii (sessione)</p>
            </div>
            <div className="divide-y divide-border-subtle">
              {storico.map((rec) => (
                <div key={rec.id} className="px-4 py-3 flex items-start gap-3">
                  {rec.esito === "ok" ? (
                    <CheckCircle size={15} weight="fill" className="text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <Warning size={15} weight="fill" className="text-destructive shrink-0 mt-0.5" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-foreground truncate">{rec.to}</p>
                    <p className="text-xs text-on-surface-variant truncate">{rec.subject}</p>
                    {rec.errore && (
                      <p className="text-xs text-destructive mt-0.5">{rec.errore}</p>
                    )}
                  </div>
                  <span className="text-xs text-on-surface-variant shrink-0">{rec.timestamp}</span>
                </div>
              ))}
            </div>
          </section>
        )}
```

- [ ] **Step 7: Commit**

```bash
git add app/dashboard/invia/page.tsx
git commit -m "Uniforma invia/page.tsx allo stile Precision Mobility"
```

---

### Task 13: `app/login/page.tsx`

**Files:**
- Modify: `app/login/page.tsx`

- [ ] **Step 1: Titolo con font-heading + pannello form come glass-card**

old_string:
```tsx
      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-6">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Accedi a NoloTrack</h1>
            <p className="text-sm text-muted-foreground mt-1">Inserisci le tue credenziali per continuare.</p>
          </div>

          <form onSubmit={accedi} className="space-y-4">
```

new_string:
```tsx
      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm glass-card rounded-2xl p-6 space-y-6">
          <div>
            <h1 className="font-heading text-xl font-bold text-primary">Accedi a NoloTrack</h1>
            <p className="text-sm text-on-surface-variant mt-1">Inserisci le tue credenziali per continuare.</p>
          </div>

          <form onSubmit={accedi} className="space-y-4">
```

- [ ] **Step 2: Label form + bottone submit con shadow-glow**

old_string:
```tsx
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</label>
```

new_string:
```tsx
            <div className="space-y-1">
              <label className="text-xs font-medium text-on-surface-variant uppercase tracking-wider">Email</label>
```

old_string:
```tsx
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Password</label>
```

new_string:
```tsx
            <div className="space-y-1">
              <label className="text-xs font-medium text-on-surface-variant uppercase tracking-wider">Password</label>
```

old_string:
```tsx
            <button
              type="submit"
              disabled={caricamento}
              className="w-full bg-primary text-primary-foreground text-sm font-medium py-2.5 rounded-lg transition-colors hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {caricamento ? "Accesso in corso…" : "Accedi"}
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-background px-3 text-xs text-muted-foreground">oppure</span>
            </div>
          </div>

          <button
            onClick={accediConGoogle}
            className="w-full flex items-center justify-center gap-3 bg-card border border-border text-sm text-foreground font-medium py-2.5 rounded-lg transition-colors hover:bg-muted"
          >
```

new_string:
```tsx
            <button
              type="submit"
              disabled={caricamento}
              className="w-full bg-primary text-primary-foreground text-sm font-medium py-2.5 rounded-lg shadow-lg shadow-primary/20 transition-colors hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {caricamento ? "Accesso in corso…" : "Accedi"}
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border-subtle" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-surface-container px-3 text-xs text-on-surface-variant">oppure</span>
            </div>
          </div>

          <button
            onClick={accediConGoogle}
            className="w-full flex items-center justify-center gap-3 bg-surface-container-low border border-border-subtle text-sm text-foreground font-medium py-2.5 rounded-lg transition-colors hover:bg-muted"
          >
```

- [ ] **Step 3: Commit**

```bash
git add app/login/page.tsx
git commit -m "Uniforma login/page.tsx allo stile Precision Mobility"
```

---

### Task 14: `app/page.tsx` (sito vetrina pubblico)

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Titolo hero con font-heading**

old_string:
```tsx
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
            Noleggio Con Conducente a {siteConfig.citta}
          </h1>
```

new_string:
```tsx
          <h1 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Noleggio Con Conducente a {siteConfig.citta}
          </h1>
```

- [ ] **Step 2: Card servizi**

old_string:
```tsx
            {servizi.map(({ icon: Icon, titolo, desc }) => (
              <div key={titolo} className="bg-card border border-border rounded-lg p-5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-primary/15 text-primary mb-3">
                  <Icon size={18} weight="fill" />
                </div>
                <h2 className="text-sm font-medium">{titolo}</h2>
                <p className="text-sm text-muted-foreground mt-1">{desc}</p>
              </div>
            ))}
```

new_string:
```tsx
            {servizi.map(({ icon: Icon, titolo, desc }) => (
              <div key={titolo} className="glass-card rounded-2xl p-5 hover:border-primary/50 transition-all duration-300">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-primary/15 text-primary mb-3">
                  <Icon size={18} weight="fill" />
                </div>
                <h2 className="font-heading text-sm font-semibold text-foreground">{titolo}</h2>
                <p className="text-sm text-on-surface-variant mt-1">{desc}</p>
              </div>
            ))}
```

- [ ] **Step 3: Card "Come prenotare"**

old_string:
```tsx
          <div className="bg-card border border-border rounded-lg p-6 sm:p-8">
            <h2 className="text-lg font-semibold">Come prenotare</h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
```

new_string:
```tsx
          <div className="glass-card rounded-2xl p-6 sm:p-8">
            <h2 className="font-heading text-lg font-bold text-foreground">Come prenotare</h2>
            <p className="text-sm text-on-surface-variant mt-1 max-w-2xl">
```

- [ ] **Step 4: Footer info (zona di servizio, licenza)**

old_string:
```tsx
            <div className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin size={14} />
              <span>Zona di servizio: {siteConfig.citta}</span>
            </div>
            {siteConfig.licenzaNcc && (
              <p className="mt-1 text-xs text-muted-foreground">
                Licenza NCC n. {siteConfig.licenzaNcc}
              </p>
            )}
```

new_string:
```tsx
            <div className="mt-5 flex items-center gap-2 text-xs text-on-surface-variant">
              <MapPin size={14} />
              <span>Zona di servizio: {siteConfig.citta}</span>
            </div>
            {siteConfig.licenzaNcc && (
              <p className="mt-1 text-xs text-on-surface-variant">
                Licenza NCC n. {siteConfig.licenzaNcc}
              </p>
            )}
```

- [ ] **Step 5: Footer sito**

old_string:
```tsx
      <footer className="border-t border-border">
        <div className="max-w-5xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
```

new_string:
```tsx
      <footer className="border-t border-border-subtle">
        <div className="max-w-5xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-on-surface-variant">
```

- [ ] **Step 6: Header sito**

old_string:
```tsx
      <header className="border-b border-border">
```

new_string:
```tsx
      <header className="border-b border-border-subtle">
```

- [ ] **Step 7: Commit**

```bash
git add app/page.tsx
git commit -m "Uniforma il sito vetrina pubblico allo stile Precision Mobility"
```

---

### Task 15: `app/privacy/page.tsx`

**Files:**
- Modify: `app/privacy/page.tsx`

- [ ] **Step 1: Titolo + card contenitore**

old_string:
```tsx
        <Link href="/" className="text-sm text-primary hover:underline">&larr; Torna al sito</Link>
        <h1 className="text-2xl font-semibold mt-6">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mt-1">Ultimo aggiornamento: {new Date().toLocaleDateString("it-IT")}</p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-foreground/90">
```

new_string:
```tsx
        <Link href="/" className="text-sm text-primary hover:underline">&larr; Torna al sito</Link>
        <h1 className="font-heading text-2xl font-bold mt-6 text-foreground">Privacy Policy</h1>
        <p className="text-sm text-on-surface-variant mt-1">Ultimo aggiornamento: {new Date().toLocaleDateString("it-IT")}</p>

        <div className="mt-8 glass-card rounded-2xl p-6 sm:p-8 space-y-6 text-sm leading-relaxed text-foreground/90">
```

- [ ] **Step 2: Commit**

```bash
git add app/privacy/page.tsx
git commit -m "Uniforma privacy/page.tsx allo stile Precision Mobility"
```

---

### Task 16: `app/termini/page.tsx`

**Files:**
- Modify: `app/termini/page.tsx`

- [ ] **Step 1: Titolo + card contenitore**

old_string:
```tsx
        <Link href="/" className="text-sm text-primary hover:underline">&larr; Torna al sito</Link>
        <h1 className="text-2xl font-semibold mt-6">Termini di servizio</h1>
        <p className="text-sm text-muted-foreground mt-1">Ultimo aggiornamento: {new Date().toLocaleDateString("it-IT")}</p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-foreground/90">
```

new_string:
```tsx
        <Link href="/" className="text-sm text-primary hover:underline">&larr; Torna al sito</Link>
        <h1 className="font-heading text-2xl font-bold mt-6 text-foreground">Termini di servizio</h1>
        <p className="text-sm text-on-surface-variant mt-1">Ultimo aggiornamento: {new Date().toLocaleDateString("it-IT")}</p>

        <div className="mt-8 glass-card rounded-2xl p-6 sm:p-8 space-y-6 text-sm leading-relaxed text-foreground/90">
```

- [ ] **Step 2: Commit**

```bash
git add app/termini/page.tsx
git commit -m "Uniforma termini/page.tsx allo stile Precision Mobility"
```

---

### Task 17: Verifica finale

**Files:** nessuna modifica — solo controllo.

- [ ] **Step 1: Build TypeScript/Next**

Run: `npm run build`
Expected: build completata senza errori TypeScript/ESLint (nessun cambiamento di logica è stato introdotto, solo classi — eventuali errori indicano una stringa `old_string` non allineata o una classe rotta).

- [ ] **Step 2: Grep di residui dello stile vecchio nei file toccati**

Run:
```bash
git grep -n "bg-card border border-border rounded-lg" -- app/dashboard/admin app/dashboard/agenda app/dashboard/corse app/dashboard/turni app/dashboard/spese app/dashboard/carburante app/dashboard/invia app/login app/page.tsx app/privacy app/termini
```
Expected: nessun risultato (tutte le card sono ora `glass-card`).

- [ ] **Step 3: Controllo visivo rapido**

Avvia il dev server (`npm run dev`) e apri almeno:
- `/dashboard/admin` e `/dashboard/admin/ruoli` (card e tabella)
- `/dashboard/corse/nuova` (form)
- `/dashboard/turni/[un id esistente]` (form di modifica)
- `/login`
- `/` (sito vetrina pubblico)

Verifica che header, card e tabelle abbiano lo stesso trattamento (blur, bordo sottile, `font-heading` sui titoli) delle pagine già migrate come `/dashboard/turni` o `/dashboard/corse`.

- [ ] **Step 4: Commit finale (se necessario)**

Se il controllo visivo richiede piccoli aggiustamenti, applicarli file per file e committare separatamente. Nessun commit "di verifica" è necessario se tutto è già a posto.
