import { test, expect } from "@playwright/test";
test("Phase C legacy registration, engineer visits, draft restore, stock use and private reports", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByLabel(/Email/).fill("admin@example.test");
  await page.getByLabel(/Password/).fill("synthetic-test-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/dashboard/);
  const headers = { Origin: "http://localhost:3000" },
    suffix = Date.now(),
    request = page.request;
  async function create(m: string, data: object) {
    const r = await request.post("/api/records/" + m, { headers, data });
    const d = await r.json();
    expect(r.ok(), JSON.stringify(d)).toBe(true);
    return d;
  }
  const admin = await (await request.get("/api/auth/me")).json();
  const customer = await create("customers", {
    name: `Legacy hospital ${suffix}`,
    address: "Synthetic test address",
  });
  await page.goto("/equipment");
  await page
    .getByRole("button", { name: "Register Equipment", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Serial number", exact: true })
    .fill(`SERIAL-${suffix}`);
  await page
    .getByRole("combobox", { name: "Customer", exact: true })
    .fill(customer.name);
  await page.getByRole("option", { name: customer.name, exact: true }).click();
  await page
    .getByRole("textbox", { name: "Equipment/product", exact: true })
    .fill("Synthetic legacy device");
  await page
    .getByRole("checkbox", { name: "Historical record", exact: true })
    .check();
  await page.getByRole("button", { name: "Save record", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
  const equipment = (
    await (
      await request.get("/api/records/equipment?q=SERIAL-" + suffix)
    ).json()
  ).rows[0];
  expect(equipment.orderId).toBeNull();
  await create("warranties", {
    equipmentId: equipment.id,
    commencement: "CONTRACT",
    startDate: "2026-01-31",
    durationMonths: 12,
    terms: "Actual test contract",
  });
  await page.goto("/tickets?from=equipment&id=" + equipment.id);
  await expect(page.getByRole("dialog")).toBeVisible();
  await page
    .getByRole("textbox", { name: "Ticket number", exact: true })
    .fill(`ST-${suffix}`);
  await page
    .getByRole("textbox", { name: "Reported issue", exact: true })
    .fill("Synthetic fault requiring inspection");
  await page
    .getByRole("textbox", { name: "Reported date/time", exact: true })
    .fill("2026-10-01T08:00");
  await page
    .getByRole("combobox", { name: "Assigned engineer", exact: true })
    .fill(admin.name);
  await page.getByRole("option", { name: admin.name, exact: true }).click();
  await page
    .getByRole("button", {
      name: "Save temporary draft in this tab",
      exact: true,
    })
    .click();
  await page
    .getByRole("textbox", { name: "Reported issue", exact: true })
    .fill("Changed draft");
  await page
    .getByRole("button", { name: "Restore temporary draft", exact: true })
    .click();
  await expect(
    page.getByRole("textbox", { name: "Reported issue", exact: true }),
  ).toHaveValue("Synthetic fault requiring inspection");
  await page.getByRole("button", { name: "Save record", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
  const ticket = (
    await (await request.get("/api/records/tickets?q=ST-" + suffix)).json()
  ).rows[0];
  const coverage = await (
    await request.get(`/api/service/tickets/${ticket.id}/coverage`)
  ).json();
  expect(coverage.warrantyStatus).toBe("Active");
  const visit = await create("ticket-visits", {
    ticketId: ticket.id,
    engineerId: admin.id,
    scheduledAt: "2026-10-07T09:00:00Z",
    startedAt: "2026-10-07T09:00:00Z",
    completedAt: "2026-10-07T10:00:00Z",
    status: "COMPLETED",
    workDone: "Test inspection and part replacement",
    representative: "Synthetic contact",
    acknowledgement: "Acknowledged in test",
  });
  const part = await create("parts", {
    sku: `SP-${suffix}`,
    name: `Test spare ${suffix}`,
    unitCost: "20",
    reorderLevel: 1,
  });
  await page.goto("/inventory");
  await page
    .getByRole("button", { name: "New Stock Transaction", exact: true })
    .click();
  await page
    .getByRole("combobox", { name: "Part", exact: true })
    .fill(part.name);
  await page.getByRole("option", { name: new RegExp(part.name) }).click();
  await page
    .getByRole("combobox", { name: "Transaction type", exact: true })
    .click();
  await page.getByRole("option", { name: "IN", exact: true }).click();
  await page
    .getByRole("spinbutton", {
      name: "Quantity (signed only for adjustment)",
      exact: true,
    })
    .fill("3");
  await page
    .getByRole("textbox", { name: "Transaction date/time", exact: true })
    .fill("2026-10-07T09:00");
  await expect(
    page.getByRole("textbox", {
      name: "Unique transaction reference",
      exact: true,
    }),
  ).not.toHaveValue("");
  await page.getByRole("button", { name: "Save record", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
  await create("inventory", {
    partId: part.id,
    type: "USED_IN_SERVICE",
    quantity: 2,
    ticketId: ticket.id,
    engineerId: admin.id,
    transactionDate: "2026-10-07T10:00:00Z",
    requestId: crypto.randomUUID(),
  });
  const stock = await (
    await request.get("/api/records/parts/" + part.id)
  ).json();
  expect(stock.availableQuantity).toBe(1);
  const template = await create("templates", {
    name: `Service report ${suffix}`,
    kind: "SERVICE_REPORT",
    approved: true,
    body: "Service {{ticket_number}}: {{work_done}} / {{representative}}",
  });
  for (const format of ["DOCX", "PDF"]) {
    const r = await request.post("/api/generate", {
      headers,
      data: {
        templateId: template.id,
        sourceModule: "ticket-visits",
        sourceId: visit.id,
        values: {},
        format,
      },
    });
    const g = await r.json();
    expect(r.ok(), JSON.stringify(g)).toBe(true);
    expect((await request.get("/api/files/" + g.fileId)).ok()).toBe(true);
  }
  await page.goto("/engineer");
  await expect(
    page.getByRole("heading", { name: "Engineer home", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: new RegExp(ticket.number) }),
  ).toBeVisible();
  await page.goto("/service-sla");
  await expect(
    page.getByRole("heading", { name: "Service SLA", exact: true }),
  ).toBeVisible();
  const refresh = await request.post("/api/opportunities/refresh", { headers });
  expect(refresh.ok()).toBe(true);
  const opportunities = (
    await (await request.get("/api/records/amc-opportunities")).json()
  ).rows;
  expect(
    opportunities.some(
      (o: { equipmentId: string; estimatedValue: unknown }) =>
        o.equipmentId === equipment.id && o.estimatedValue == null,
    ),
  ).toBe(true);
  const manifest = await (await request.get("/manifest.webmanifest")).json();
  expect(manifest.display).toBe("standalone");
  expect(manifest.start_url).toBe("/engineer");
  const timeline = await (
    await request.get(`/api/equipment/${equipment.id}/timeline`)
  ).json();
  expect(
    timeline.parts.some((t: { quantity: number }) => t.quantity === 2),
  ).toBe(true);
  await page.goto("/equipment?record=" + equipment.id);
  await expect(
    page.getByRole("heading", { name: "Equipment timeline", exact: true }),
  ).toBeVisible();
});
