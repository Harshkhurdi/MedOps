import { test, expect } from "@playwright/test";

test("unhydrated login cannot put credentials in a URL", async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("http://localhost:3000/login");
  await expect(page.locator("form")).toHaveAttribute("method", "post");
  await expect(page.locator("form")).toHaveAttribute(
    "action",
    "/api/auth/login",
  );
  await expect(
    page.getByRole("button", { name: "Sign in", exact: true }),
  ).toBeDisabled();
  await page.getByLabel(/Email/).fill("admin@example.test");
  await page.getByLabel(/Password/).fill("synthetic-test-password");
  const submission = page.waitForRequest("**/api/auth/login");
  await page
    .locator("form")
    .evaluate((form: HTMLFormElement) => form.requestSubmit());
  const request = await submission;
  expect(request.method()).toBe("POST");
  expect(new URL(request.url()).search).toBe("");
  expect((await request.response())?.status()).toBe(415);
  await expect(page).toHaveURL("http://localhost:3000/api/auth/login");
  await context.close();
});
