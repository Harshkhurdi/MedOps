import { createHmac } from "node:crypto";
import { test, expect } from "@playwright/test";
import { PDFDocument, StandardFonts } from "pdf-lib";
const headers = { Origin: "http://localhost:3000" };
test("complete imported A–E lifecycle with source trace and external AI disabled", async ({
  page,
  browser,
}) => {
  test.setTimeout(240000);
  await page.goto("/login");
  await page.getByLabel(/Email/).fill("admin@example.test");
  await page.getByLabel(/Password/).fill("synthetic-test-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/dashboard/);
  const request = page.request,
    suffix = Date.now();
  async function post(name: string, data: unknown) {
    const r = await request.post(`/api/records/${name}`, { headers, data }),
      d = await r.json();
    expect(r.ok(), JSON.stringify(d)).toBe(true);
    return d;
  }
  async function patch(name: string, id: string, data: unknown) {
    const prior = await (
      await request.get(`/api/records/${name}/${id}`)
    ).json();
    const r = await request.patch(`/api/records/${name}/${id}`, {
        headers: { ...headers, "If-Match": JSON.stringify(prior.updatedAt) },
        data,
      }),
      d = await r.json();
    expect(r.ok(), JSON.stringify(d)).toBe(true);
    return d;
  }
  async function get(url: string) {
    const r = await request.get(url),
      d = await r.json();
    expect(r.ok(), JSON.stringify(d)).toBe(true);
    return d;
  }
  const customer = await post("customers", {
    name: `Acceptance Hospital ${suffix}`,
    address: "Synthetic local only",
  });
  const manufacturer = await post("manufacturers", {
    name: `Acceptance Manufacturer ${suffix}`,
  });
  const product = await post("products", {
    name: `Acceptance Equipment ${suffix}`,
    model: "AC-1",
    manufacturerId: manufacturer.id,
  });
  const contact = await post("customer-contacts", {
    name: "Synthetic biomedical contact",
    customerId: customer.id,
    department: "Biomedical",
  });
  const t = {
    number: `Acceptance Tender ${suffix}`,
    title: "Manual equipment tender",
    recordSource: "TENDER_TRACKER",
    customerId: customer.id,
    deadline: "2026-10-20T12:00:00Z",
    items: [
      {
        productId: product.id,
        equipment: product.name,
        model: product.model,
        manufacturerId: manufacturer.id,
        quantity: 2,
      },
    ],
  };
  async function integration(path: string, data: unknown) {
    const body = JSON.stringify(data),
      timestamp = String(Date.now()),
      environment = "development";
    const signature = createHmac(
      "sha256",
      "isolated-synthetic-integration-secret-48-characters",
    )
      .update(`${timestamp}\n${environment}\nPOST\n${path}\n${body}`)
      .digest("hex");
    const response = await request.post(path, {
      headers: {
        "Content-Type": "application/json",
        "x-medops-timestamp": timestamp,
        "x-medops-environment": environment,
        "x-medops-signature": signature,
      },
      data: body,
    });
    const result = await response.json();
    expect(response.ok(), JSON.stringify(result)).toBe(true);
    return result;
  }
  const connect = await request.post(
    "/api/integrations/tender-tracker/connect",
    { headers, data: { state: "s".repeat(43) } },
  );
  expect(connect.ok(), await connect.text()).toBe(true);
  const code = new URL((await connect.json()).callback).searchParams.get(
    "code",
  );
  const { grant } = await integration(
    "/api/integrations/tender-tracker/session",
    { code },
  );
  const imported = await integration(
    "/api/integrations/tender-tracker/import",
    {
      grant,
      tender: {
        externalTenderId: `synthetic-full-${suffix}`,
        number: t.number,
        title: "Public discovery title",
        institution: customer.name,
        sourceUrl: `https://hospital.example/official-tender-${suffix}`,
        sourceName: "Synthetic local discovery",
        discoveredAt: new Date().toISOString(),
        deadline: t.deadline,
        items: [{ id: "line-one", equipment: product.name, quantity: 2 }],
        documents: [],
        revisions: [],
        references: [],
      },
      selectedItemIds: ["line-one"],
    },
  );
  const initial = await get(`/api/records/tenders/${imported.tenderId}`);
  expect(initial.status).toBe("UNDER_REVIEW");
  expect(initial.items[0].manufacturerId).toBeNull();
  expect(
    (await get(`/api/records/decisions?tenderId=${imported.tenderId}`)).rows[0]
      .decision,
  ).toBe("PENDING_REVIEW");
  const tender = await patch("tenders", imported.tenderId, {
    ...t,
    recordSource: "TENDER_TRACKER",
  });
  await page.goto(`/tenders?record=${tender.id}`);
  await expect(
    page.getByText("Imported from Tender Tracker", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Original tender / source" }),
  ).toHaveAttribute(
    "href",
    `https://hospital.example/official-tender-${suffix}`,
  );
  await expect(page.getByRole("dialog")).toContainText("Pending Review");
  await expect(page.getByRole("dialog")).not.toContainText(
    "Source Update Available",
  );
  const firstSource = await get(`/api/tenders/${tender.id}/source`);
  const originalVersionId = firstSource.imports[0].originalVersionId;
  expect(originalVersionId).toBe(firstSource.imports[0].versions[0].id);
  // A revised source must preserve an employee's quantity until explicit review.
  await patch("tenders", tender.id, {
    ...t,
    items: t.items.map((item) => ({ ...item, quantity: 9 })),
  });
  const revisedSource = await integration(
    "/api/integrations/tender-tracker/import",
    {
      grant,
      tender: {
        externalTenderId: `synthetic-full-${suffix}`,
        number: t.number,
        title: "Public discovery title",
        institution: customer.name,
        sourceUrl: `https://hospital.example/official-tender-${suffix}`,
        sourceName: "Synthetic local discovery",
        discoveredAt: new Date().toISOString(),
        deadline: t.deadline,
        items: [{ id: "line-one", equipment: product.name, quantity: 4 }],
        documents: [],
        revisions: [
          {
            title: "Quantity revision",
            url: `https://hospital.example/revised-${suffix}.pdf`,
          },
        ],
        references: [],
      },
      selectedItemIds: ["line-one"],
    },
  );
  expect(revisedSource.status).toBe("SOURCE_UPDATE_AVAILABLE");
  const revisedTrace = await get(`/api/tenders/${tender.id}/source`);
  expect(revisedTrace.imports[0].originalVersionId).toBe(originalVersionId);
  expect(revisedTrace.imports[0].versions[0].id).not.toBe(originalVersionId);
  await page.goto(`/tenders?record=${tender.id}`);
  await expect(page.getByRole("dialog")).toContainText(
    "Source Update Available",
  );
  await expect(page.getByRole("dialog")).toContainText("MedOps quantity: 9");
  await expect(page.getByRole("dialog")).toContainText("Source quantity: 4");
  const latestItem = page.locator('[data-source-item-id="line-one"]').first();
  await latestItem.getByRole("checkbox").check();
  await latestItem.getByLabel("Reviewed quantity").fill("2");
  await page
    .getByLabel(
      "Replace equipment lines with my selected source items and reviewed quantities",
    )
    .check();
  await page
    .getByRole("button", { name: "Accept selected source values", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeHidden();
  const reviewedItem = (await get(`/api/records/tenders/${tender.id}`))
    .items[0];
  expect(reviewedItem.quantity).toBe(2);
  expect(reviewedItem.manufacturerId).toBe(manufacturer.id);
  expect(reviewedItem.productId).toBe(product.id);
  await post("decisions", {
    tenderId: tender.id,
    decision: "PURSUE",
    reason: "Human reviewed actual requirements",
  });
  const r = {
    number: `Acceptance RFQ ${suffix}`,
    manufacturerId: manufacturer.id,
    productId: product.id,
    tenderId: tender.id,
    customerId: customer.id,
    productName: product.name,
    model: product.model,
    quantity: 2,
    quoteRequiredBy: "2026-10-10T09:00:00Z",
  };
  let rfq = await post("rfqs", r);
  rfq = await patch("rfqs", rfq.id, { ...r, status: "READY_TO_SEND" });
  rfq = await patch("rfqs", rfq.id, {
    ...r,
    status: "SENT",
    sentAt: "2026-10-07T09:00:00Z",
  });
  const q = {
    number: `Acceptance Quote ${suffix}`,
    manufacturerId: manufacturer.id,
    productId: product.id,
    rfqId: rfq.id,
    tenderId: tender.id,
    productName: product.name,
    model: product.model,
    quantity: 2,
    unitPrice: "100",
    quotationDate: "2026-10-07",
    validityDate: "2026-11-01",
    currency: "INR",
  };
  const quote = await post("quotes", q);
  const revised = await post("quotes", {
    ...q,
    previousQuoteId: quote.id,
    unitPrice: "95",
    freight: "10",
    isFinal: true,
  });
  expect(revised.revision).toBe(2);
  const comparison = await post("comparisons", {
    name: "Human bid costing",
    tenderId: tender.id,
    rfqId: rfq.id,
    quoteId: revised.id,
    sellingPrice: "300",
    additionalCosts: "20",
  });
  expect(comparison.procurementCost).toBe("200");
  const checklist = await post("checklist", {
    tenderId: tender.id,
    section: "COMMERCIAL",
    title: "Actual bid documents reviewed",
    status: "COMPLETE",
  });
  expect(checklist.status).toBe("COMPLETE");
  const security = await post("securities", {
    customerId: customer.id,
    tenderId: tender.id,
    type: "EMD",
    reference: `Acceptance EMD ${suffix}`,
    amount: "10",
    issueDate: "2026-10-07",
    validityDate: "2026-12-01",
    expectedRefundDate: "2026-12-15",
    status: "ISSUED",
  });
  const approver = await post("users", {
    name: "Synthetic independent approver",
    email: `approver-${suffix}@example.test`,
    role: "ADMIN",
    active: true,
    password: "synthetic-test-password",
    permissions: [],
  });
  const approvalInput = {
    title: "Pursue approval",
    workflow: "TENDER_PURSUE",
    relatedModule: "tenders",
    recordId: tender.id,
    approverId: approver.id,
  };
  const approval = await post("approvals", approvalInput);
  await patch("approvals", approval.id, {
    ...approvalInput,
    status: "SUBMITTED",
  });
  const other = await browser.newContext(),
    otherRequest = other.request;
  expect(
    (
      await otherRequest.post("http://localhost:3000/api/auth/login", {
        headers,
        data: { email: approver.email, password: "synthetic-test-password" },
      })
    ).ok(),
  ).toBe(true);
  const prior = await (
    await otherRequest.get(
      `http://localhost:3000/api/records/approvals/${approval.id}`,
    )
  ).json();
  expect(
    (
      await otherRequest.patch(
        `http://localhost:3000/api/records/approvals/${approval.id}`,
        {
          headers: { ...headers, "If-Match": JSON.stringify(prior.updatedAt) },
          data: {
            ...approvalInput,
            status: "APPROVED",
            comments: "Independent human decision",
          },
        },
      )
    ).ok(),
  ).toBe(true);
  await other.close();
  const pdf = await PDFDocument.create(),
    font = await pdf.embedFont(StandardFonts.Helvetica);
  pdf.addPage().drawText("Synthetic acceptance source", { font });
  const bytes = Buffer.from(await pdf.save());
  async function upload(name: string, id: string) {
    const res = await request.post("/api/files", {
      headers,
      multipart: {
        module: name,
        recordId: id,
        file: {
          name: "synthetic-acceptance.pdf",
          mimeType: "application/pdf",
          buffer: bytes,
        },
      },
    });
    expect(res.ok(), await res.text()).toBe(true);
    return res.json();
  }
  await upload("tenders", tender.id);
  if (!(await get("/api/records/company")).rows.length)
    await post("company", {
      legalName: "Synthetic Acceptance Company",
      address: "Synthetic local only",
    });
  const template = await post("templates", {
    name: `Acceptance Cover ${suffix}`,
    kind: "COVERING_LETTER",
    body: "{{company_name}} {{tender_number}} {{hospital_name}}",
    approved: true,
  });
  const gen = await request.post("/api/generate", {
    headers,
    data: {
      templateId: template.id,
      sourceModule: "tenders",
      sourceId: tender.id,
      values: {},
      format: "DOCX",
    },
  });
  const document = await gen.json();
  expect(gen.ok(), JSON.stringify(document)).toBe(true);
  expect(
    (
      await request.post(`/api/review/generated/${document.id}`, { headers })
    ).ok(),
  ).toBe(true);
  expect(
    (await request.post(`/api/review/tenders/${tender.id}`, { headers })).ok(),
  ).toBe(true);
  await patch("tenders", tender.id, { ...t, status: "READY_FOR_SUBMISSION" });
  await patch("tenders", tender.id, { ...t, status: "SUBMITTED" });
  await post("results", {
    tenderId: tender.id,
    outcome: "WON",
    resultDate: "2026-10-07",
  });
  const o = {
    number: `Acceptance PO ${suffix}`,
    tenderId: tender.id,
    customerId: customer.id,
    poDate: "2026-01-01",
    items: [
      {
        productId: product.id,
        equipment: product.name,
        model: product.model,
        manufacturerId: manufacturer.id,
        quantity: 2,
        unitPrice: "150",
        taxRate: "0",
      },
    ],
  };
  const order = await post("orders", o);
  await upload("orders", order.id);
  const confirmed = await patch("orders", order.id, { ...o, confirmed: true });
  const d = {
    orderId: order.id,
    dispatchDate: "2026-01-02",
    actualDate: "2026-01-03",
    location: "Synthetic site",
    confirmed: true,
    items: [{ orderItemId: confirmed.items[0].id, quantity: 1 }],
  };
  const first = await post("deliveries", d);
  expect((await get(`/api/records/orders/${order.id}`)).status).toBe(
    "PARTIALLY_DELIVERED",
  );
  const second = await post("deliveries", d);
  expect((await get(`/api/records/orders/${order.id}`)).status).toBe(
    "DELIVERED",
  );
  const units: { id: string; serialNumber: string; productId: string }[] = [];
  for (const [delivery, index] of [
    [first, 1],
    [second, 2],
  ] as const)
    units.push(
      await post("equipment", {
        serialNumber: `Acceptance Serial ${suffix}-${index}`,
        customerId: customer.id,
        orderId: order.id,
        orderItemId: confirmed.items[0].id,
        deliveryId: delivery.id,
      }),
    );
  expect(units[0].productId).toBe(product.id);
  await post("installations", {
    equipmentId: units[0].id,
    status: "INSTALLED",
    installationDate: "2026-01-05",
  });
  const warranty = await post("warranties", {
    equipmentId: units[0].id,
    commencement: "INSTALLATION",
    durationMonths: 12,
    terms: "Actual contractual terms",
  });
  expect(warranty.endDate.slice(0, 10)).toBe("2027-01-05");
  const invoice = await post("invoices", {
    number: `Acceptance Invoice ${suffix}`,
    customerId: customer.id,
    orderId: order.id,
    invoiceDate: "2026-01-10",
    amount: "300",
    taxAmount: "0",
    paymentTermDays: 30,
  });
  await post("payments", {
    invoiceId: invoice.id,
    amount: "100",
    paymentDate: "2026-01-20",
    reference: `Acceptance Partial ${suffix}`,
    method: "BANK_TRANSFER",
  });
  expect((await get(`/api/records/invoices/${invoice.id}`)).outstanding).toBe(
    "200.00",
  );
  const engineer = (await get("/api/auth/me")).id;
  const ti = {
    number: `Acceptance Ticket ${suffix}`,
    customerId: customer.id,
    equipmentId: units[0].id,
    productName: product.name,
    manufacturerId: manufacturer.id,
    issue: "Synthetic service complaint",
    reportedAt: "2026-10-07T09:00:00Z",
    priority: "CRITICAL",
    assignedToId: engineer,
    status: "ASSIGNED",
  };
  const ticket = await post("tickets", ti);
  const part = await post("parts", {
    sku: `Acceptance Part ${suffix}`,
    name: "Synthetic part",
    unitCost: "5",
    reorderLevel: 1,
  });
  await post("inventory", {
    partId: part.id,
    type: "IN",
    quantity: 2,
    transactionDate: "2026-10-07",
    requestId: crypto.randomUUID(),
  });
  await post("inventory", {
    partId: part.id,
    type: "USED_IN_SERVICE",
    ticketId: ticket.id,
    engineerId: engineer,
    quantity: 1,
    transactionDate: "2026-10-07",
    requestId: crypto.randomUUID(),
  });
  expect((await get(`/api/records/parts/${part.id}`)).onHand).toBe(1);
  await post("ticket-visits", {
    ticketId: ticket.id,
    engineerId: engineer,
    scheduledAt: "2026-10-07T10:00:00Z",
    startedAt: "2026-10-07T10:00:00Z",
    completedAt: "2026-10-07T11:00:00Z",
    status: "COMPLETED",
    workDone: "Synthetic repaired part",
    representative: "Synthetic hospital representative",
    acknowledgement: "Work acknowledged",
  });
  await patch("tickets", ticket.id, {
    ...ti,
    status: "RESOLVED",
    resolution: "Replaced recorded part",
    resolvedAt: "2026-10-07T11:00:00Z",
  });
  await patch("tickets", ticket.id, {
    ...ti,
    status: "CLOSED",
    resolution: "Replaced recorded part",
    resolvedAt: "2026-10-07T11:00:00Z",
  });
  expect(
    (await request.post("/api/opportunities/refresh", { headers })).ok(),
  ).toBe(true);
  const opportunity = (
    await get(`/api/records/amc-opportunities?customerId=${customer.id}`)
  ).rows.find((r: { equipmentId: string }) => r.equipmentId === units[0].id);
  expect(opportunity).toBeTruthy();
  await patch("amc-opportunities", opportunity.id, {
    customerId: customer.id,
    equipmentId: units[0].id,
    reason: opportunity.reason,
    triggerDate: opportunity.triggerDate,
    status: "WON",
    estimatedValue: "20",
  });
  const amc = await post("amcs", {
    number: `Acceptance AMC ${suffix}`,
    customerId: customer.id,
    startDate: "2026-10-07",
    endDate: "2027-10-07",
    amount: "20",
    serviceFrequencyMonths: 3,
    equipmentIds: [units[0].id],
  });
  await post("visits", {
    amcId: amc.id,
    employeeId: engineer,
    scheduledDate: "2026-10-07",
    completedDate: "2026-10-07",
    status: "COMPLETED",
    notes: "Synthetic maintenance",
  });
  await post("payments", {
    invoiceId: invoice.id,
    amount: "200",
    paymentDate: "2026-10-07",
    reference: `Acceptance Final ${suffix}`,
    method: "BANK_TRANSFER",
  });
  expect((await get(`/api/records/invoices/${invoice.id}`)).outstanding).toBe(
    "0.00",
  );
  await post("costs", {
    customerId: customer.id,
    orderId: order.id,
    manufacturerId: manufacturer.id,
    productId: product.id,
    title: "Actual entered purchase and service costs",
    category: "MANUFACTURER_PURCHASE",
    amount: "220",
    incurredDate: "2026-10-07",
  });
  await post("interactions", {
    customerId: customer.id,
    contactId: contact.id,
    employeeId: engineer,
    type: "SERVICE",
    occurredAt: "2026-10-07T11:00:00Z",
    notes: "Synthetic CRM follow-up",
    relatedModule: "tickets",
    recordId: ticket.id,
  });
  const management = await get(
    `/api/management?view=analytics&customerId=${customer.id}`,
  );
  expect(management.profitability).toMatchObject({
    revenue: "300.00",
    recordedCosts: "220.00",
    grossContribution: "80.00",
  });
  expect(
    management.manufacturers.find(
      (m: { manufacturer: string }) => m.manufacturer === manufacturer.name,
    ).wins,
  ).toBe(1);
  expect(
    management.productMetrics.find(
      (p: { product: string }) => p.product === product.name,
    ).unitsSold,
  ).toBe(2);
  expect(
    management.customerMetrics.find(
      (c: { customer: string }) => c.customer === customer.name,
    ).outstanding,
  ).toBe("0.00");
  const timeline = await get(`/api/customers/${customer.id}/timeline`);
  expect(timeline.interactions).toHaveLength(1);
  expect(timeline.equipment).toHaveLength(2);
  expect(
    (await get(`/api/search?q=${encodeURIComponent(units[0].serialNumber)}`))
      .groups[0].results[0].id,
  ).toBe(units[0].id);
  for (const [module, row, query] of [
    ["tenders", tender, tender.number],
    ["orders", order, order.number],
    ["invoices", invoice, invoice.number],
    ["rfqs", rfq, rfq.number],
    ["equipment", units[0], units[0].serialNumber],
    ["customers", customer, customer.name],
    ["manufacturers", manufacturer, manufacturer.name],
    ["tickets", ticket, ticket.number],
    ["amcs", amc, amc.number],
    ["securities", security, security.reference],
  ] as const) {
    const groups = (await get(`/api/search?q=${encodeURIComponent(query)}`))
      .groups;
    expect(
      groups
        .find((g: { entity: string }) => g.entity === module)
        ?.results.some((r: { id: string }) => r.id === row.id),
      module,
    ).toBe(true);
  }
  expect(
    (await get("/api/brief?module=parts")).actions.some(
      (a: { id: string }) => a.id === part.id,
    ),
  ).toBe(true);
  for (const path of [
    "/brief",
    "/executive",
    "/profitability",
    "/analytics",
    "/customers?record=" + customer.id,
    "/reports",
    "/accounting",
    "/imports",
    "/ocr",
  ]) {
    await page.goto(path);
    await expect(page.locator("main")).not.toContainText("Application error");
  }
  await page.goto("/dashboard");
  await page.keyboard.press("Control+k");
  await page
    .getByRole("textbox", {
      name: "Search records, contacts or serial numbers",
    })
    .fill(units[0].serialNumber);
  await page
    .getByRole("link", { name: units[0].serialNumber, exact: true })
    .click();
  await expect(page).toHaveURL(new RegExp(`equipment.*${units[0].id}`));
  await expect(page.getByRole("dialog")).toBeVisible();
  const provenance = await get(`/api/tenders/${tender.id}/source`);
  expect(provenance.imports[0].externalTenderId).toBe(
    `synthetic-full-${suffix}`,
  );
  expect((await get("/api/settings")).aiStatus).toBe("Disabled");
  expect((await get("/api/ocr")).available).toBe(false);
  expect(
    (
      await request.get(
        "/api/accounting?module=invoices&format=xlsx&customerId=" + customer.id,
      )
    ).status(),
  ).toBe(200);
});
