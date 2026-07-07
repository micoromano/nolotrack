# SP7 — WhatsApp Meta Cloud API

**Goal:** Sezione WhatsApp per comunicare lo stato del servizio all'autista tramite bottoni interattivi (inizio corsa → fine corsa → forma di pagamento → fine servizio), inviare messaggi di stato/testo libero ai clienti, e gestire template riutilizzabili con placeholder.

**Architecture:** Migrazione DB (`autisti.telefono`, `corse.stato_servizio`, `whatsapp_templates`, `whatsapp_log`) → `lib/whatsapp.ts` (client Meta Graph API + firma webhook + placeholder) → `app/api/whatsapp/webhook` (pubblico, macchina a stati) → `app/api/whatsapp/invia` + `templates` (autenticate) → `app/dashboard/whatsapp` (hub) + `template` (CRUD).

**Tech Stack:** Meta WhatsApp Cloud API (Graph API v21.0), Supabase (RLS + service role per webhook pubblico), Next.js App Router.

---

## File Structure

| File | Azione |
|---|---|
| `supabase/migrations/20260707_sp7_whatsapp.sql` | CREATE — colonne `autisti.telefono`, `corse.stato_servizio`, tabelle `whatsapp_templates`/`whatsapp_log`, permessi sezione `whatsapp` |
| `lib/whatsapp.ts` | CREATE — invio testo/bottoni/lista, verifica firma, placeholder |
| `app/api/whatsapp/webhook/route.ts` | CREATE — GET verifica, POST macchina a stati |
| `app/api/whatsapp/invia/route.ts` | CREATE — avvia flusso / messaggio libero / usa template |
| `app/api/whatsapp/templates/route.ts` + `[id]/route.ts` | CREATE — CRUD template |
| `app/api/whatsapp/status/route.ts` | CREATE — health-check configurazione |
| `app/dashboard/whatsapp/page.tsx` | CREATE — hub |
| `app/dashboard/whatsapp/template/page.tsx` | CREATE — gestione template |
| `components/navbar.tsx`, `lib/permessi.ts` | MODIFY — voce e permessi sezione `whatsapp` |
| `types/index.ts` | MODIFY — tipi WhatsApp |
| `.env.local` | MODIFY — variabili Meta (vedi CLAUDE.md) |

---

## Task 1: Migrazione DB — [x]
## Task 2: `lib/whatsapp.ts` — [x]
## Task 3: Webhook Meta — [x]
## Task 4: API invio + CRUD template — [x]
## Task 5: UI dashboard/whatsapp — [x]
## Task 6: Navbar, permessi, types, docs — [x]

Dettagli in `docs/superpowers/logs/2026-07-07-sp7.md`.
