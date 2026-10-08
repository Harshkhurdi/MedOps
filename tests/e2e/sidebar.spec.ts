import { test, expect } from "@playwright/test";

test("sidebar retains its dark surface below the fold after navigation", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("/login");
  await page.getByLabel(/Email/).fill("admin@example.test");
  await page.getByLabel(/Password/).fill("synthetic-test-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/dashboard/);
  const nav = page.locator("nav .MuiDrawer-paper:visible");
  for (const scheme of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme: scheme });
    await nav.getByRole("link", { name: "Settings", exact: true }).click();
    await expect(page).toHaveURL(/settings/);
    const settings = nav.getByRole("link", { name: "Settings", exact: true });
    await expect(settings).toHaveCSS("background-color", "rgb(34, 83, 79)");
    await expect(settings).toHaveCSS("color", "rgb(155, 241, 218)");
    const surface = await nav.evaluate((paper) => {
      const content = paper.firstElementChild!;
      return { contentHeight: content.getBoundingClientRect().height,
        scrollHeight: content.scrollHeight };
    });
    expect(surface.contentHeight).toBeGreaterThanOrEqual(surface.scrollHeight - 1);
    await expect(nav.getByRole("link", { name: "Private OCR", exact: true })).toHaveCSS("color", "rgb(219, 231, 234)");
    await nav.getByRole("link", { name: "Operations dashboard", exact: true }).click();
    await expect(page).toHaveURL(/dashboard/);
  }
});
