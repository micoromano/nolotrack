import { test, expect } from "@playwright/test";

const EMAIL = process.env.TEST_EMAIL ?? "";
const PASSWORD = process.env.TEST_PASSWORD ?? "";

test.describe("Flusso corse", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', EMAIL);
    await page.fill('input[type="password"]', PASSWORD);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/dashboard/);
  });

  test("crea una nuova corsa", async ({ page }) => {
    await page.goto("/dashboard/corse/nuova");

    await page.fill('input[type="date"]', "2026-05-15");
    await page.fill('input[type="time"]', "10:00");

    // Origine (fallback a input normale se Places non disponibile in test)
    const origineInput = page.locator('input[placeholder*="Milano"]');
    await origineInput.fill("Termini Roma");

    const destInput = page.locator('input[placeholder*="Aeroporto"]');
    await destInput.fill("FCO");

    // Tipo pagamento: Cash è già selezionato di default
    await page.fill('input[type="number"][placeholder="0.00"]', "85");

    await page.fill('input[placeholder="Nome passeggero"]', "Test Cliente");
    await page.fill('input[placeholder="+39…"]', "+391234567890");
    await page.fill('input[placeholder="es. Tika"]', "Tika Test");

    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard\/corse$/);

    await expect(page.locator("text=Test Cliente")).toBeVisible();
  });

  test("modifica una corsa esistente", async ({ page }) => {
    await page.goto("/dashboard/corse");

    const primaRiga = page.locator("a[href*='/dashboard/corse/']").first();
    await primaRiga.click();

    await expect(page).toHaveURL(/\/dashboard\/corse\/.+/);
    await expect(page.locator("h1")).toHaveText("Modifica corsa");

    const importoInput = page.locator('input[type="number"][placeholder="0.00"]');
    await importoInput.clear();
    await importoInput.fill("99.99");

    await page.click('button:has-text("Salva modifiche")');
    await expect(page).toHaveURL(/\/dashboard\/corse$/);
  });
});
