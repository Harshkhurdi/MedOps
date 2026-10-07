import { test, expect } from "@playwright/test";
test("Phase A manual commercial flow, revision UI, document generation and pricing denial", async ({
  page,
  browser,
}) => {
  await page.goto("/login");
  await page.getByLabel(/Email/).fill("admin@example.test");
  await page.getByLabel(/Password/).fill("synthetic-test-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/dashboard/);
  const request = page.request,
    suffix = Date.now(),
    headers = { Origin: "http://localhost:3000" };
  async function create(module: string, data: object) {
    const r = await request.post(`/api/records/${module}`, { headers, data });
    const body = await r.json();
    expect(r.ok(), JSON.stringify(body)).toBe(true);
    return body;
  }
  const manufacturer = await create("manufacturers", {
    name: `Commercial manufacturer ${suffix}`,
  });
  await page.goto("/rfqs");
  await page.getByRole("button", { name: "New RFQ", exact: true }).click();
  await page
    .getByRole("textbox", { name: "RFQ number", exact: true })
    .fill(`MANUAL-RFQ-${suffix}`);
  await page
    .getByRole("combobox", { name: "Manufacturer", exact: true })
    .fill(manufacturer.name);
  await page
    .getByRole("option", { name: manufacturer.name, exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Equipment/product", exact: true })
    .fill("Synthetic device");
  await page.getByRole("button", { name: "Save record", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(
    page.getByText(`MANUAL-RFQ-${suffix}`, { exact: true }),
  ).toBeVisible();
  let rfq = (
    await (await request.get(`/api/records/rfqs?q=MANUAL-RFQ-${suffix}`)).json()
  ).rows[0];
  const rfqInput = {
    number: rfq.number,
    manufacturerId: manufacturer.id,
    productName: "Synthetic device",
    quantity: 1,
  };
  for (const status of ["READY_TO_SEND", "SENT"]) {
    const r = await request.patch(`/api/records/rfqs/${rfq.id}`, {
      headers: { ...headers, "If-Match": JSON.stringify(rfq.updatedAt) },
      data: {
        ...rfqInput,
        status,
        ...(status === "SENT" ? { sentAt: new Date().toISOString() } : {}),
      },
    });
    expect(r.status()).toBe(200);
    rfq = await r.json();
  }
  const quote = await create("quotes", {
    number: `MANUAL-Q-${suffix}`,
    manufacturerId: manufacturer.id,
    rfqId: rfq.id,
    quotationDate: "2026-10-07",
    productName: "Synthetic device",
    quantity: 1,
    unitPrice: "100",
  });
  await create("comparisons", {
    name: `Commercial option ${suffix}`,
    quoteId: quote.id,
    sellingPrice: "150",
  });
  await page.goto("/quotes");
  await page.getByLabel("Search records").fill(`MANUAL-Q-${suffix}`);
  await page.getByRole("button", { name: "View", exact: true }).first().click();
  await page
    .getByRole("button", { name: "Add quotation revision", exact: true })
    .click();
  await page
    .getByRole("spinbutton", { name: "Unit price", exact: true })
    .fill("90");
  await page.getByRole("button", { name: "Save record", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
  const quotes = (
    await (await request.get(`/api/records/quotes?q=MANUAL-Q-${suffix}`)).json()
  ).rows;
  expect(quotes).toHaveLength(2);
  expect(quotes.map((q: { revision: number }) => q.revision).sort()).toEqual([
    1, 2,
  ]);
  await page.goto("/comparison");
  await expect(
    page.getByRole("cell").filter({ hasText: `Commercial option ${suffix}` }),
  ).toBeVisible();
  await expect(
    page.getByText("Lowest cost", { exact: true }).first(),
  ).toBeVisible();
  const template = await create("templates", {
    name: `RFQ letter ${suffix}`,
    kind: "RFQ_LETTER",
    approved: true,
    body: "RFQ {{rfq_number}} to {{manufacturer_name}} from {{company_name}}",
  });
  const company = await request.get("/api/records/company");
  if (!(await company.json()).total)
    await create("company", {
      legalName: "Synthetic Company",
      address: "Local test fixture",
    });
  for (const format of ["DOCX", "PDF"]) {
    const generated = await request.post("/api/generate", {
      headers,
      data: {
        templateId: template.id,
        sourceModule: "rfqs",
        sourceId: rfq.id,
        values: {},
        format,
      },
    });
    const draft = await generated.json();
    expect(generated.ok(), JSON.stringify(draft)).toBe(true);
    expect((await request.get(`/api/files/${draft.fileId}`)).status()).toBe(
      200,
    );
  }
  const employee = await create("users", {
    email: `pricing-denied-${suffix}@example.test`,
    name: "Synthetic non-pricing reader",
    role: "EMPLOYEE",
    password: "synthetic-test-password",
    permissions: [{ module: "quotes", read: true, write: false }],
  });
  expect(employee.passwordHash).toBeUndefined();
  const context = await browser.newContext();
  const login = await context.request.post(
    "http://localhost:3000/api/auth/login",
    {
      headers,
      data: { email: employee.email, password: "synthetic-test-password" },
    },
  );
  expect(login.ok()).toBe(true);
  expect(
    (
      await context.request.get("http://localhost:3000/api/records/quotes")
    ).status(),
  ).toBe(403);
  expect(
    (
      await context.request.get("http://localhost:3000/api/export/quotes")
    ).status(),
  ).toBe(403);
  await context.close();
});
