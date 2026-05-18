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
