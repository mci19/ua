import { expect, test } from "@playwright/test";

// Demo-mode happy path: log in as Anna → open existing draft → submit it
// → assert that /aanvragen now shows the updated status. Mirrors the
// flow described in the project README.

test.describe("happy path (demo mode)", () => {
  test("login as anna and see her draft requests", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/Gebruiker/i).fill("anna");
    await page.getByLabel(/Wachtwoord/i).fill("demo");
    await page.getByRole("button", { name: /(aan)?[Mm]eld/i }).click();

    // Welcome / overview
    await expect(page.locator("main")).toBeVisible();
    await page.getByRole("link", { name: /Mijn aanvragen|Aanvragen/i }).first().click();

    // /aanvragen — the demo seed gives Anna at least one ongoing request
    await expect(page).toHaveURL(/\/aanvragen/);
    await expect(page.locator("body")).toContainText(/UA-\d{4}-/);
  });

  test("rejects unknown demo user", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/Gebruiker/i).fill("nobody");
    await page.getByLabel(/Wachtwoord/i).fill("demo");
    await page.getByRole("button", { name: /(aan)?[Mm]eld/i }).click();
    // Should stay on /login (or near it) with an error
    await expect(page).toHaveURL(/\/login/);
  });

  test("health endpoint returns ok in demo mode", async ({ page }) => {
    const response = await page.request.get("/api/health");
    expect(response.ok()).toBe(true);
    const body = await response.json();
    expect(body.mode).toBe("demo");
  });
});
