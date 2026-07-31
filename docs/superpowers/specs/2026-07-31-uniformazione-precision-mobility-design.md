# Uniformazione grafica "Precision Mobility" (Stitch)

**Data:** 2026-07-31
**Stato:** approvato

## Contesto

Il design system "Precision Mobility" (generato in Stitch, progetto "NoloTrack Rental Manager") è già stato importato a livello di token in `app/globals.css` (`--primary`, `--surface-*`, `.glass-card`, font Inter/IBM Plex Sans/JetBrains Mono, shadow glow) ed è già applicato in: Home, Turni (lista), Corse (lista), Cassa, Carburante (lista), Stipendio, Report, WhatsApp (hub + template).

Un secondo gruppo di pagine è rimasto al vecchio stile piatto (pre-Stitch): `bg-card border border-border rounded-lg`, header non sticky, tabelle con `bg-muted/30`, niente `font-heading` sui titoli, niente glow sui CTA.

## Obiettivo

Applicare lo stesso linguaggio visivo già affermato nelle pagine migrate anche alle pagine rimaste indietro, senza toccare logica di business, query Supabase, validazioni o struttura dei dati. Solo classi Tailwind/JSX di presentazione.

## Pattern di riferimento (estratto da pagine già migrate)

| Elemento | Vecchio | Nuovo (Precision Mobility) |
|---|---|---|
| Header pagina | `border-b border-border px-6 py-3 bg-card`, titolo `text-sm font-semibold` | `sticky top-0 z-30 bg-surface/80 backdrop-blur-xl border-b border-border-subtle h-16 flex items-center justify-between px-4 md:px-10`; titolo `font-heading text-lg font-bold text-primary`; sottotitolo `text-xs text-on-surface-variant` |
| Contenitore/card | `bg-card border border-border rounded-lg` | `glass-card rounded-2xl` |
| Wrapper pagina | `p-6` | `px-4 md:px-10 py-8 max-w-[1440px] mx-auto` |
| Tabelle — header riga | `bg-muted/30`, `text-xs font-medium text-muted-foreground uppercase tracking-wider` | `bg-surface-container-low/50`, `text-[11px] font-bold uppercase tracking-wider text-on-secondary-container` |
| Tabelle — righe | `divide-y divide-border`, hover `hover:bg-muted/20` | `divide-y divide-border-subtle`, hover `hover:bg-surface-variant/20` |
| CTA primario | `bg-primary text-primary-foreground rounded-lg` | invariato + `shadow-lg shadow-primary/20` |
| Empty state | testo semplice | icona Phosphor `text-on-surface-variant` + testo `text-sm text-on-surface-variant` |
| Input form | `bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary` | **invariato** — già coerente col design system, si modifica solo il contenitore attorno |

Nessuna modifica a `app/globals.css` (token già presenti) né a `components/navbar.tsx` (già coerente).

## Ambito — file da aggiornare

Pagine dashboard (form/dettaglio/admin, non ancora migrate):
- `app/dashboard/admin/page.tsx`
- `app/dashboard/admin/ruoli/page.tsx`
- `app/dashboard/admin/utenti/page.tsx`
- `app/dashboard/admin/utenti/invita/page.tsx`
- `app/dashboard/agenda/page.tsx`
- `app/dashboard/corse/nuova/page.tsx`
- `app/dashboard/corse/[id]/page.tsx`
- `app/dashboard/turni/nuovo/page.tsx`
- `app/dashboard/turni/[id]/page.tsx`
- `app/dashboard/spese/[id]/page.tsx`
- `app/dashboard/carburante/[id]/page.tsx`
- `app/dashboard/invia/page.tsx`

Autenticazione:
- `app/login/page.tsx` — il pannello form diventa `glass-card`; il titolo `h1` riceve `font-heading`; bottone submit riceve lo shadow-glow del CTA primario.

Sito vetrina pubblico:
- `app/page.tsx` — card "servizi" e card "come prenotare" diventano `glass-card rounded-2xl`; `h1`/`h2` ricevono `font-heading`.
- `app/privacy/page.tsx`, `app/termini/page.tsx` — stesso trattamento per coerenza (contenitore card + titoli), mantenendo il tono testuale invariato (sono pagine legali, non promozionali).

## Non-obiettivi

- Nessuna modifica a schema DB, RLS, query, validazioni o comportamento dei form.
- Nessuna modifica a `globals.css` o ai token del design system (già corretti).
- Nessuna modifica a `components/navbar.tsx` (già allineato).
- Nessun redesign concettuale: si riapplica un pattern già esistente e approvato, non se ne inventa uno nuovo.

## Verifica

- `npm run build` (o `next build`) senza errori TypeScript/lint dopo le modifiche.
- Controllo visivo rapido (screenshot o dev server) di almeno una pagina per categoria (una admin, una form "nuovo/nuova", una "[id]" di dettaglio, login, sito pubblico) per confermare che il pattern sia applicato in modo coerente con le pagine già migrate.
