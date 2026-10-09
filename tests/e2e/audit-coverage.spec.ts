import { test, expect } from "@playwright/test";
import { configs } from "../../src/lib/ui-config";

const modules = Object.entries(configs);
const readApis = [
  "/api/auth/me",
  "/api/dashboard",
  "/api/settings",
  "/api/employees",
  "/api/reports",
  "/api/brief",
  "/api/search?q=synthetic",
  "/api/management?view=analytics",
  "/api/management?view=executive",
  "/api/management?view=profitability",
  "/api/engineer",
  "/api/service/summary",
  "/api/controls/summary",
  "/api/accounting",
  "/api/communication",
  "/api/ocr",
];

test("every register and operational read API loads for an administrator", async ({
  page,
}) => {
  test.setTimeout(300000);
  await page.goto("/login");
  await page.getByLabel(/Email/).fill("admin@example.test");
  await page.getByLabel(/Password/).fill("synthetic-test-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/dashboard/);
  for (const [module, config] of modules) {
    await test.step(module, async () => {
      const response = await page.request.get(`/api/records/${module}?limit=1`);
      expect(response.status(), `${module}: ${await response.text()}`).toBe(
        200,
      );
      const body = await response.json();
      expect(Array.isArray(body.rows)).toBe(true);
      expect(body.total).toBeGreaterThanOrEqual(0);
      await page.goto(`/${module}`);
      await expect(
        page
          .getByRole("main")
          .getByRole("heading", { name: config.title, exact: true }),
      ).toBeVisible();
      await expect(page.getByRole("main").getByRole("progressbar")).toHaveCount(
        0,
      );
      await expect(page.locator("main .MuiAlert-standardError")).toHaveCount(0);
    });
  }
  for (const path of readApis) {
    const response = await page.request.get(path);
    expect(response.status(), `${path}: ${await response.text()}`).toBe(200);
    expect(response.headers()["cache-control"]).toContain("no-store");
  }
});

test("dedicated screens render without client errors on desktop and mobile", async ({
  page,
}) => {
  test.setTimeout(180000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/login");
  await page.getByLabel(/Email/).fill("admin@example.test");
  await page.getByLabel(/Password/).fill("synthetic-test-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/dashboard/);
  for (const path of [
    "dashboard",
    "brief",
    "executive",
    "analytics",
    "profitability",
    "reports",
    "generator",
    "comparison",
    "communication",
    "accounting",
    "imports",
    "ocr",
    "ai",
    "settings",
    "engineer",
    "service-sla",
    "account",
  ]) {
    await test.step(path, async () => {
      await page.goto(`/${path}`);
      await expect(
        page.getByRole("main").getByRole("heading").first(),
      ).toBeVisible();
      await expect(page.getByRole("main").getByRole("progressbar")).toHaveCount(
        0,
      );
      await expect(page.locator("main .MuiAlert-standardError")).toHaveCount(0);
    });
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/dashboard");
  await expect(
    page.getByRole("heading", { name: "Operations overview" }),
  ).toBeVisible();
  await expect(page.getByRole("progressbar")).toHaveCount(0);
  await page.screenshot({
    path: "test-results/audit-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/engineer");
  await expect(
    page.getByRole("main").getByRole("heading").first(),
  ).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  await page.screenshot({
    path: "test-results/audit-mobile.png",
    fullPage: true,
  });
  expect(errors).toEqual([]);
});

test("all register APIs and operational read endpoints deny unauthenticated requests", async ({
  request,
}) => {
  for (const path of [
    ...modules.map(([module]) => `/api/records/${module}`),
    ...readApis,
  ]) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(401);
    expect(response.headers()["cache-control"]).toContain("no-store");
  }
});
