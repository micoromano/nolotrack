# SP6 — Security Review + Test Suite

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Risolvere vulnerabilità di sicurezza note e creare suite di test (unit + E2E) per le funzionalità critiche.

**Architecture:** Security review manuale su OWASP top-10 per il codebase → fix inline → unit tests con Vitest per logica business → E2E con Playwright per flussi critici.

**Tech Stack:** Vitest, Playwright, TypeScript

---

## File Structure

| File | Azione |
|---|---|
| `vitest.config.ts` | CREATE — configurazione Vitest |
| `tests/unit/calcoli.test.ts` | CREATE — test logica stipendio e saldo |
| `playwright.config.ts` | CREATE — configurazione Playwright |
| `tests/e2e/auth.spec.ts` | CREATE — test login |
| `tests/e2e/corse.spec.ts` | CREATE — test CRUD corse |
| `tests/e2e/tema.spec.ts` | CREATE — test toggle tema |
| `app/api/invia-email/route.ts` | MODIFY — aggiungere rate limiting |
| `supabase/rls-check.sql` | CREATE — verifica RLS su tutte le tabelle |

---

## Task 1: Security — Verifica RLS completo

**Files:**
- Create: `supabase/rls-check.sql`

- [ ] **Step 1: Crea query di verifica**

```sql
-- supabase/rls-check.sql
-- Eseguire nel SQL Editor per verificare che RLS sia attivo su tutte le tabelle user-data

SELECT
  t.tablename,
  t.rowsecurity AS rls_enabled,
  COUNT(p.policyname) AS policy_count
FROM pg_tables t
LEFT JOIN pg_policies p ON p.tablename = t.tablename
WHERE t.schemaname = 'public'
  AND t.tablename IN ('corse','turni','spese','carburante','targhe','integrazioni','autisti','ruoli','ruolo_permessi')
GROUP BY t.tablename, t.rowsecurity
ORDER BY t.tablename;
```

- [ ] **Step 2: Esegui e verifica output**

Expected:

| tablename | rls_enabled | policy_count |
|---|---|---|
| autisti | true | ≥1 |
| carburante | true | ≥1 |
| corse | true | ≥1 |
| integrazioni | true | ≥1 |
| ruoli | false | 0 (tabella di sistema, solo admin accede via server) |
| ruolo_permessi | false | 0 (idem) |
| spese | true | ≥1 |
| targhe | true | ≥1 |
| turni | true | ≥1 |

Se `rls_enabled = false` su tabelle user-data: eseguire `ALTER TABLE <nome> ENABLE ROW LEVEL SECURITY;` e aggiungere policy.

- [ ] **Step 3: Aggiungere RLS su autisti**

```sql
ALTER TABLE autisti ENABLE ROW LEVEL SECURITY;

-- Ogni autista legge solo il proprio profilo
CREATE POLICY "autisti_own_read" ON autisti
  FOR SELECT USING (id = auth.uid());

-- Solo admin può vedere tutti (policy separata per service role)
-- La lettura admin avviene via SUPABASE_SERVICE_ROLE_KEY che bypassa RLS
```

- [ ] **Step 4: Commit**

```bash
git add supabase/rls-check.sql
git commit -m "security: verifica e completa RLS su tutte le tabelle"
```

---

## Task 2: Security — Rate limiting su invia-email

**Files:**
- Modify: `app/api/invia-email/route.ts`

- [ ] **Step 1: Leggi il file corrente**

Apri `app/api/invia-email/route.ts` e identifica la funzione POST.

- [ ] **Step 2: Aggiungi rate limiting in-memory semplice**

Aggiungi prima dell'export della route:

```typescript
// Rate limiter semplice in-memory (resettato a ogni deploy)
const rateLimit = new Map<string, { count: number; reset: number }>();
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minuto

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimit.get(userId);

  if (!entry || now > entry.reset) {
    rateLimit.set(userId, { count: 1, reset: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) return false;

  entry.count++;
  return true;
}
```

All'inizio della funzione POST, dopo aver verificato l'utente:

```typescript
if (!checkRateLimit(user.id)) {
  return NextResponse.json(
    { error: "Troppe richieste. Attendi un minuto." },
    { status: 429 }
  );
}
```

- [ ] **Step 3: Verifica che la route funzioni ancora**

```bash
npm run dev
```

Vai su `/dashboard/invia` e invia una email di test. Deve funzionare normalmente.

- [ ] **Step 4: Commit**

```bash
git add app/api/invia-email/route.ts
git commit -m "security: aggiungi rate limiting a invia-email (5 req/min)"
```

---

## Task 3: Security — Verifica env vars

- [ ] **Step 1: Controlla che nessuna secret sia in variabili NEXT_PUBLIC_***

```bash
grep -r "NEXT_PUBLIC_" .env.local
```

Expected: solo `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`.

`SUPABASE_SERVICE_ROLE_KEY`, `GMAIL_APP_PASSWORD`, `GOOGLE_CLIENT_SECRET` NON devono mai avere prefisso `NEXT_PUBLIC_`.

- [ ] **Step 2: Verifica .gitignore**

```bash
grep ".env.local" .gitignore
```

Expected: `.env.local` è nella lista. Se non c'è, aggiungerlo.

- [ ] **Step 3: Verifica che .env.local non sia in git**

```bash
git ls-files .env.local
```

Expected: nessun output. Se appare, rimuoverlo da git: `git rm --cached .env.local`.

- [ ] **Step 4: Commit (se necessario)**

```bash
git add .gitignore
git commit -m "security: verifica env vars e gitignore"
```

---

## Task 4: Installa e configura Vitest

- [ ] **Step 1: Installa dipendenze**

```bash
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom
```

- [ ] **Step 2: Crea vitest.config.ts**

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
```

- [ ] **Step 3: Crea setup file**

```typescript
// tests/setup.ts
import "@testing-library/jest-dom";
```

- [ ] **Step 4: Aggiungi script in package.json**

Nel `package.json`, aggiungi alla sezione `scripts`:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 5: Verifica che Vitest si avvii**

```bash
npm test
```

Expected: "No test files found" (zero test, zero failure — OK per ora).

- [ ] **Step 6: Commit**

```bash
git add vitest.config.ts tests/setup.ts package.json package-lock.json
git commit -m "test: configura Vitest per unit tests"
```

---

## Task 5: Unit test — logica business

**Files:**
- Create: `tests/unit/calcoli.test.ts`

- [ ] **Step 1: Crea il file di test**

```typescript
// tests/unit/calcoli.test.ts
import { describe, it, expect } from "vitest";

// ── Funzioni da testare (estratte o replicate da lib/) ──

function formatEuro(n: number): string {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(n);
}

function calcolaStipendio({
  oreLavorate,
  tariffaOraria,
  totaleCash,
  totaleCarta,
  totaleUber,
  percCash,
  percCarta,
  percUber,
}: {
  oreLavorate: number;
  tariffaOraria: number;
  totaleCash: number;
  totaleCarta: number;
  totaleUber: number;
  percCash: number;
  percCarta: number;
  percUber: number;
}): number {
  const base = oreLavorate * tariffaOraria;
  const commCash = totaleCash * percCash;
  const commCarta = totaleCarta * percCarta;
  const commUber = totaleUber * percUber;
  return base + commCash + commCarta + commUber;
}

function calcolaSaldo(
  corse: { data: string; tipo_pagamento: string; importo: number }[],
  spese: { data: string; importo: number }[],
  fino: string,
): number {
  const cashEntrate = corse
    .filter((c) => c.tipo_pagamento === "cash" && c.data <= fino)
    .reduce((acc, c) => acc + c.importo, 0);
  const uscite = spese
    .filter((s) => s.data <= fino)
    .reduce((acc, s) => acc + s.importo, 0);
  return cashEntrate - uscite;
}

// ── Test suite ──

describe("formatEuro", () => {
  it("formatta zero", () => {
    expect(formatEuro(0)).toBe("0,00 €");
  });
  it("formatta importo positivo", () => {
    expect(formatEuro(120.5)).toBe("120,50 €");
  });
  it("formatta importo con migliaia", () => {
    expect(formatEuro(1250)).toBe("1.250,00 €");
  });
});

describe("calcolaStipendio", () => {
  it("calcola stipendio base senza commissioni", () => {
    const s = calcolaStipendio({
      oreLavorate: 8,
      tariffaOraria: 10,
      totaleCash: 0,
      totaleCarta: 0,
      totaleUber: 0,
      percCash: 0.35,
      percCarta: 0.35,
      percUber: 0.35,
    });
    expect(s).toBe(80);
  });

  it("calcola commissioni cash", () => {
    const s = calcolaStipendio({
      oreLavorate: 0,
      tariffaOraria: 10,
      totaleCash: 100,
      totaleCarta: 0,
      totaleUber: 0,
      percCash: 0.35,
      percCarta: 0.35,
      percUber: 0.35,
    });
    expect(s).toBe(35);
  });

  it("calcola stipendio completo", () => {
    const s = calcolaStipendio({
      oreLavorate: 8,
      tariffaOraria: 12,
      totaleCash: 200,
      totaleCarta: 100,
      totaleUber: 50,
      percCash: 0.35,
      percCarta: 0.35,
      percUber: 0.35,
    });
    // 8*12 + 200*0.35 + 100*0.35 + 50*0.35 = 96 + 70 + 35 + 17.5 = 218.5
    expect(s).toBeCloseTo(218.5);
  });
});

describe("calcolaSaldo", () => {
  const corse = [
    { data: "2026-05-08", tipo_pagamento: "cash",   importo: 100 },
    { data: "2026-05-08", tipo_pagamento: "carta",  importo: 85 },  // carta non entra nel saldo
    { data: "2026-05-08", tipo_pagamento: "noninc", importo: 50 },  // noninc non entra
    { data: "2026-05-10", tipo_pagamento: "cash",   importo: 120 }, // dopo la data di taglio
  ];
  const spese = [
    { data: "2026-05-07", importo: 30 },
    { data: "2026-05-09", importo: 20 }, // dopo il taglio
  ];

  it("include solo cash e spese fino alla data", () => {
    const saldo = calcolaSaldo(corse, spese, "2026-05-08");
    // cash fino all'08: 100; spese fino all'08: 30; saldo = 100 - 30 = 70
    expect(saldo).toBe(70);
  });

  it("esclude carta e noninc dal saldo", () => {
    const saldo = calcolaSaldo(corse, spese, "2026-05-11");
    // cash: 100 + 120 = 220; spese: 30 + 20 = 50; saldo = 170
    expect(saldo).toBe(170);
  });
});
```

- [ ] **Step 2: Esegui i test**

```bash
npm test
```

Expected: tutti i test passano (verde).

- [ ] **Step 3: Commit**

```bash
git add tests/unit/calcoli.test.ts
git commit -m "test: unit tests per logica stipendio e saldo cassa"
```

---

## Task 6: Configura Playwright per E2E

- [ ] **Step 1: Installa Playwright**

```bash
npm install -D @playwright/test
npx playwright install --with-deps chromium
```

- [ ] **Step 2: Crea playwright.config.ts**

```typescript
// playwright.config.ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
  },
});
```

- [ ] **Step 3: Aggiungi script in package.json**

```json
"test:e2e": "playwright test",
"test:e2e:ui": "playwright test --ui"
```

- [ ] **Step 4: Commit**

```bash
git add playwright.config.ts package.json
git commit -m "test: configura Playwright per E2E"
```

---

## Task 7: E2E test — flusso corse

**Files:**
- Create: `tests/e2e/corse.spec.ts`

- [ ] **Step 1: Crea file con credenziali test**

Aggiungi a `.env.local`:
```
TEST_EMAIL=marco.camelin@gmail.com
TEST_PASSWORD=la-tua-password-di-test
```

- [ ] **Step 2: Crea il file E2E**

```typescript
// tests/e2e/corse.spec.ts
import { test, expect } from "@playwright/test";

const EMAIL = process.env.TEST_EMAIL ?? "";
const PASSWORD = process.env.TEST_PASSWORD ?? "";

test.describe("Flusso corse", () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto("/login");
    await page.fill('input[type="email"]', EMAIL);
    await page.fill('input[type="password"]', PASSWORD);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/dashboard/);
  });

  test("crea una nuova corsa", async ({ page }) => {
    await page.goto("/dashboard/corse/nuova");

    // Campi base
    await page.fill('input[type="date"]', "2026-05-15");
    await page.fill('input[type="time"]', "10:00");

    // Origine (fallback a input normale se Places non disponibile in test)
    const origineInput = page.locator('input[placeholder*="Milano"]');
    await origineInput.fill("Termini Roma");

    const destInput = page.locator('input[placeholder*="Aeroporto"]');
    await destInput.fill("FCO");

    // Tipo pagamento: Cash è già selezionato di default
    await page.fill('input[type="number"][placeholder="0.00"]', "85");

    // Dettaglio ordine
    await page.fill('input[placeholder="Nome passeggero"]', "Test Cliente");
    await page.fill('input[placeholder="+39…"]', "+391234567890");
    await page.fill('input[placeholder="es. Tika"]', "Tika Test");

    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard\/corse$/);

    // Verifica in lista
    await expect(page.locator("text=Test Cliente")).toBeVisible();
  });

  test("modifica una corsa esistente", async ({ page }) => {
    await page.goto("/dashboard/corse");

    // Clicca la prima riga
    const primaRiga = page.locator("a[href*='/dashboard/corse/']").first();
    await primaRiga.click();

    await expect(page).toHaveURL(/\/dashboard\/corse\/.+/);
    await expect(page.locator("h1")).toHaveText("Modifica corsa");

    // Modifica l'importo
    const importoInput = page.locator('input[type="number"][placeholder="0.00"]');
    await importoInput.clear();
    await importoInput.fill("99.99");

    await page.click('button:has-text("Salva modifiche")');
    await expect(page).toHaveURL(/\/dashboard\/corse$/);
  });
});
```

- [ ] **Step 3: Esegui i test E2E**

```bash
npm run test:e2e
```

Expected: i test passano. Se falliscono per mancanza di credenziali test, verifica `.env.local`.

- [ ] **Step 4: Commit**

```bash
git add tests/e2e/corse.spec.ts .env.local
git commit -m "test: E2E test per flusso corse (crea e modifica)"
```

---

## Task 8: E2E test — toggle tema

**Files:**
- Create: `tests/e2e/tema.spec.ts`

- [ ] **Step 1: Crea test**

```typescript
// tests/e2e/tema.spec.ts
import { test, expect } from "@playwright/test";

const EMAIL = process.env.TEST_EMAIL ?? "";
const PASSWORD = process.env.TEST_PASSWORD ?? "";

test("toggle tema chiaro/scuro", async ({ page }) => {
  await page.goto("/login");
  await page.fill('input[type="email"]', EMAIL);
  await page.fill('input[type="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/dashboard/);

  // Default: dark
  await expect(page.locator("html")).toHaveClass(/dark/);

  // Cambia a chiaro
  const select = page.locator("select").filter({ hasText: "Scuro" });
  await select.selectOption("light");

  await expect(page.locator("html")).toHaveClass(/light/);

  // Ricarica — deve persistere
  await page.reload();
  await expect(page.locator("html")).toHaveClass(/light/);

  // Torna a scuro
  await select.selectOption("dark");
  await expect(page.locator("html")).toHaveClass(/dark/);
});
```

- [ ] **Step 2: Esegui**

```bash
npm run test:e2e -- --grep "toggle tema"
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/tema.spec.ts
git commit -m "test: E2E test per toggle tema chiaro/scuro"
```

---

## Task 9: Commit finale e riepilogo

- [ ] **Step 1: Esegui tutti i test**

```bash
npm test && npm run test:e2e
```

Expected: tutti i test passano.

- [ ] **Step 2: Commit finale**

```bash
git add -A
git commit -m "test: suite completa unit + E2E per NoloTrack v2"
```
