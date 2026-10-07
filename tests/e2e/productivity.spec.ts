import { test, expect } from "@playwright/test";
test("reviewed CSV import, financial correction UI and authorization for productivity APIs", async ({
  page,
  browser,
}) => {
  await page.goto("/login");
  await page.getByLabel(/Email/).fill("admin@example.test");
  await page.getByLabel(/Password/).fill("synthetic-test-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/dashboard/);
  const suffix = Date.now(),
    headers = { Origin: "http://localhost:3000" },
    request = page.request;
  await page.goto("/imports");
  const name = `Browser import hospital ${suffix}`;
  await page
    .locator('input[type="file"]')
    .setInputFiles({
      name: "synthetic-customers.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(
        `name,originalDate\n${name},2010-01-01\n${name},2010-01-01`,
      ),
    });
  await expect(
    page.getByText(
      "2 rows loaded. Map required fields; relation fields use saved record IDs.",
    ),
  ).toBeVisible();
  await page.getByRole("button", { name: "Validate and preview" }).click();
  await expect(page.getByText(/Row 2: REJECTED/)).toBeVisible();
  await page.getByRole("checkbox").check();
  await page
    .getByRole("button", { name: "Confirm import", exact: true })
    .click();
  await expect(page.getByText("Imported: 1 · Rejected: 1")).toBeVisible();
  const customer = (
    await (
      await request.get(`/api/records/customers?q=${encodeURIComponent(name)}`)
    ).json()
  ).rows[0];
  const invoiceResponse = await request.post("/api/records/invoices", {
    headers,
    data: {
      number: `UI-correction-${suffix}`,
      customerId: customer.id,
      invoiceDate: "2020-01-01",
      dueDate: "2020-02-15",
      amount: "100",
      taxAmount: "18",
      paymentTermDays: 30,
      historical: true,
    },
  });
  const invoice = await invoiceResponse.json();
  expect(invoiceResponse.ok(), JSON.stringify(invoice)).toBe(true);
  expect(invoice.dueDate.slice(0, 10)).toBe("2020-02-15");
  await page.goto("/adjustments");
  await page
    .getByRole("button", { name: "New Financial Correction", exact: true })
    .click();
  await page
    .getByRole("combobox", { name: "Invoice", exact: true })
    .fill(invoice.number);
  await page.getByRole("option", { name: invoice.number, exact: true }).click();
  await page.getByLabel("Correction type").click();
  await page
    .getByRole("option", { name: "INVOICE CREDIT", exact: true })
    .click();
  await page
    .getByRole("spinbutton", {
      name: "Base amount / reversed receipt (INR)",
      exact: true,
    })
    .fill("10");
  await page
    .getByRole("spinbutton", {
      name: "Tax amount (zero for reversal)",
      exact: true,
    })
    .fill("1.80");
  await page.getByLabel(/Correction date/).fill("2020-02-02");
  await page
    .getByRole("textbox", { name: "Correction reference", exact: true })
    .fill(`UI-CREDIT-${suffix}`);
  await page
    .getByRole("textbox", { name: "Reason", exact: true })
    .fill("Synthetic customer correction");
  await page
    .getByRole("checkbox", { name: "I confirm this financial correction" })
    .check();
  await page.getByRole("button", { name: "Save record", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
  expect(
    (await (await request.get(`/api/records/invoices/${invoice.id}`)).json())
      .outstanding,
  ).toBe("106.20");
  const context = await browser.newContext();
  const other = context.request;
  expect(
    (
      await other.post("http://localhost:3000/api/auth/login", {
        headers,
        data: {
          email: "employee@example.test",
          password: "synthetic-test-password",
        },
      })
    ).ok(),
  ).toBe(true);
  for (const url of [
    "/api/search?q=Hospital",
    "/api/brief",
    "/api/management?view=analytics",
    "/api/accounting",
    "/api/ocr",
    `/api/customers/${customer.id}/timeline`,
  ])
    expect((await other.get("http://localhost:3000" + url)).status()).toBe(403);
  expect(
    (
      await other.post("http://localhost:3000/api/imports", {
        headers,
        data: {},
      })
    ).status(),
  ).toBe(403);
  const anon = await browser.newContext();
  for (const url of [
    "/api/brief",
    "/api/search?q=Hospital",
    "/api/management?view=executive",
    "/api/accounting",
    "/api/ocr",
  ])
    expect(
      (await anon.request.get("http://localhost:3000" + url)).status(),
    ).toBe(401);
  await context.close();
  await anon.close();
});
