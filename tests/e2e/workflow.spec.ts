import { test, expect } from "@playwright/test";
import { PDFDocument, StandardFonts } from "pdf-lib";
import JSZip from "jszip";
const headers = { Origin: "http://localhost:3000" };
test("employee screens, tender-to-payment API workflow, review and private files", async ({
  page,
}) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/login/);
  await page.getByLabel(/Email/).fill("admin@example.test");
  await page.getByLabel(/Password/).fill("synthetic-test-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/dashboard/);
  await expect(
    page.getByRole("heading", { name: "Operations overview" }),
  ).toBeVisible();
  const request = page.request;
  const suffix = Date.now();
  async function post(module: string, data: unknown) {
    const r = await request.post("/api/records/" + module, { headers, data });
    const body = await r.json();
    expect(r.ok(), JSON.stringify(body)).toBeTruthy();
    return body;
  }
  async function patch(module: string, id: string, data: unknown) {
    const current = await (
      await request.get(`/api/records/${module}/${id}`)
    ).json();
    const r = await request.patch(`/api/records/${module}/${id}`, {
      headers: { ...headers, "If-Match": JSON.stringify(current.updatedAt) },
      data,
    });
    const body = await r.json();
    expect(r.ok(), JSON.stringify(body)).toBeTruthy();
    return body;
  }
  const customer = await post("customers", {
    name: `E2E Test Hospital ${suffix}`,
    address: "Synthetic local-only test",
  });
  await page.goto("/tenders");
  await page.getByRole("button", { name: "Add record", exact: true }).click();
  await page.getByLabel(/Tender\ number/).fill(`E2E-TENDER-${suffix}`);
  await page
    .getByLabel(/Procuring\ institution/)
    .fill(`E2E Test Hospital ${suffix}`);
  await page
    .getByRole("option", { name: `E2E Test Hospital ${suffix}` })
    .click();
  await page.getByRole("button", { name: "Add item", exact: true }).click();
  await page.getByLabel(/Equipment\ name/).fill("Synthetic local-only device");
  await page.getByLabel(/Quantity/).fill("2");
  await page.getByRole("button", { name: "Save record", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(
    page.getByText(`E2E-TENDER-${suffix}`, { exact: true }),
  ).toBeVisible();
  const found = await request.get(
    "/api/records/tenders?q=" + `E2E-TENDER-${suffix}`,
  );
  const tender = (await found.json()).rows[0];
  expect(tender.customerId).toBe(customer.id);
  const t = {
    number: tender.number,
    customerId: customer.id,
    status: "WON",
    items: [
      {
        equipment: "Synthetic local-only device",
        model: null,
        manufacturerId: null,
        quantity: 2,
      },
    ],
  };
  await patch("tenders", tender.id, t);
  const pdf = await PDFDocument.create();
  const pdfPage = pdf.addPage();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  pdfPage.drawText("Synthetic local test tender source", { font });
  const pdfBytes = Buffer.from(await pdf.save());
  async function upload(module: string, id: string) {
    const r = await request.post("/api/files", {
      headers,
      multipart: {
        module,
        recordId: id,
        file: {
          name: "synthetic-test.pdf",
          mimeType: "application/pdf",
          buffer: pdfBytes,
        },
      },
    });
    const data = await r.json();
    expect(r.ok(), JSON.stringify(data)).toBeTruthy();
    return data;
  }
  const tenderFile = await upload("tenders", tender.id);
  const extraction = await request.post("/api/tenders/extract", {
    headers,
    data: { fileId: tenderFile.id },
  });
  expect(extraction.ok(), await extraction.text()).toBeTruthy();
  expect((await extraction.json()).text).toContain("Synthetic local test");
  const companyResponse = await request.get("/api/records/company");
  const company = (await companyResponse.json()).rows[0];
  if (!company)
    await post("company", {
      legalName: "Synthetic Test Company",
      address: "Synthetic local test",
      signatory: "Test Signatory",
      reminderDays: 30,
    });
  const template = await post("templates", {
    name: `E2E covering ${suffix}`,
    kind: "COVERING_LETTER",
    body: "{{company_name}} submits tender {{tender_number}} to {{hospital_name}}",
    approved: true,
  });
  const generation = await request.post("/api/generate", {
    headers,
    data: {
      templateId: template.id,
      sourceModule: "tenders",
      sourceId: tender.id,
      values: {},
      format: "DOCX",
    },
  });
  const generated = await generation.json();
  expect(generation.ok(), JSON.stringify(generated)).toBeTruthy();
  const download = await request.get("/api/files/" + generated.fileId);
  expect(download.status()).toBe(200);
  expect((await download.body()).subarray(0, 2).toString()).toBe("PK");
  expect(download.headers()["cache-control"]).toContain("no-store");
  expect(
    (
      await request.post(`/api/review/generated/${generated.id}`, { headers })
    ).ok(),
  ).toBeTruthy();
  const packagedResponse = await request.post(
    `/api/tenders/${tender.id}/package`,
    { headers, data: { companyDocumentIds: [] } },
  );
  const packaged = await packagedResponse.json();
  expect(packagedResponse.ok(), JSON.stringify(packaged)).toBeTruthy();
  const packageDownload = await request.get("/api/files/" + packaged.fileId);
  const packageZip = await JSZip.loadAsync(await packageDownload.body());
  expect(
    Object.keys(packageZip.files).some((n) => n.startsWith("source-evidence/")),
  ).toBeTruthy();
  expect(
    Object.keys(packageZip.files).some((n) => n.startsWith("reviewed-drafts/")),
  ).toBeTruthy();
  expect(
    (
      await request.post(`/api/review/generated/${packaged.id}`, { headers })
    ).ok(),
  ).toBeTruthy();
  expect(
    (await request.post(`/api/review/tenders/${tender.id}`, { headers })).ok(),
  ).toBeTruthy();
  await patch("tenders", tender.id, { ...t, status: "READY_FOR_SUBMISSION" });
  await patch("tenders", tender.id, { ...t, status: "WON" });
  const orderInput = {
    number: `E2E-PO-${suffix}`,
    tenderId: tender.id,
    customerId: customer.id,
    poDate: "2026-01-01",
    items: [
      {
        equipment: "Synthetic local-only device",
        model: null,
        manufacturerId: null,
        quantity: 2,
        unitPrice: "100",
        taxRate: "18",
      },
    ],
  };
  const order = await post("orders", orderInput);
  await upload("orders", order.id);
  const confirmed = await patch("orders", order.id, {
    ...orderInput,
    confirmed: true,
  });
  const delivery = await post("deliveries", {
    orderId: order.id,
    dispatchDate: "2026-01-02",
    actualDate: "2026-01-03",
    location: "Synthetic local test",
    confirmed: true,
    items: [{ orderItemId: confirmed.items[0].id, quantity: 1 }],
  });
  const equipment = await post("equipment", {
    serialNumber: `E2E-SERIAL-${suffix}`,
    orderId: order.id,
    orderItemId: confirmed.items[0].id,
    deliveryId: delivery.id,
    customerId: customer.id,
  });
  await post("installations", {
    equipmentId: equipment.id,
    status: "INSTALLED",
    installationDate: "2026-01-05",
  });
  const warranty = await post("warranties", {
    equipmentId: equipment.id,
    commencement: "INSTALLATION",
    durationMonths: 12,
    terms: "Synthetic local test",
  });
  expect(warranty.endDate.slice(0, 10)).toBe("2027-01-05");
  const serviceNote = await request.post(
    `/api/warranties/${warranty.id}/notes`,
    { headers, data: { note: "Synthetic local service note" } },
  );
  expect(serviceNote.ok()).toBeTruthy();
  const warrantyRead = await request.get(
    `/api/records/warranties/${warranty.id}`,
  );
  expect((await warrantyRead.json()).notes).toContain(
    "Synthetic local service note",
  );
  await post("amcs", {
    number: `E2E-AMC-${suffix}`,
    customerId: customer.id,
    startDate: "2026-01-06",
    endDate: "2026-12-31",
    amount: "10",
    serviceFrequencyMonths: 3,
    equipmentIds: [equipment.id],
  });
  const invoice = await post("invoices", {
    number: `E2E-INV-${suffix}`,
    orderId: order.id,
    customerId: customer.id,
    invoiceDate: "2026-01-10",
    amount: "100",
    taxAmount: "18",
    paymentTermDays: 30,
  });
  await post("payments", {
    invoiceId: invoice.id,
    amount: "50",
    paymentDate: "2026-01-20",
    reference: `E2E-RECEIPT-${suffix}`,
    method: "BANK_TRANSFER",
  });
  expect(
    (
      await request.post("/api/records/payments", {
        headers,
        data: {
          invoiceId: invoice.id,
          amount: "100",
          paymentDate: "2026-01-20",
          reference: "E2E-excess",
          method: "BANK_TRANSFER",
        },
      })
    ).status(),
  ).toBe(400);
  expect((await request.post("/api/reminders", { headers })).ok()).toBeTruthy();
  await page.goto("/dashboard");
  await expect(
    page.getByRole("heading", { name: "Operations overview" }),
  ).toBeVisible();
  await page.screenshot({ path: "test-results/dashboard.png", fullPage: true });
  await request.post("/api/auth/logout", { headers });
  expect((await request.get("/api/files/" + tenderFile.id)).status()).toBe(401);
  expect((await request.get("/api/records/tenders")).status()).toBe(401);
  expect((await request.get("/api/cron/reminders")).status()).toBe(401);
  const employeeLogin = await request.post("/api/auth/login", {
    headers,
    data: {
      email: "employee@example.test",
      password: "synthetic-test-password",
    },
  });
  expect(employeeLogin.ok()).toBeTruthy();
  expect((await request.get("/api/records/tenders")).status()).toBe(403);
  const restrictedEquipmentResponse = await request.get(
    `/api/records/equipment/${equipment.id}`,
  );
  expect(restrictedEquipmentResponse.status()).toBe(200);
  const restrictedEquipment = await restrictedEquipmentResponse.json();
  expect(restrictedEquipment.orderItem.unitPrice).toBeUndefined();
  expect(restrictedEquipment.orderItem.taxRate).toBeUndefined();
  const restrictedDeliveriesResponse = await request.get(
    "/api/records/deliveries",
  );
  expect(restrictedDeliveriesResponse.status()).toBe(200);
  for (const row of (await restrictedDeliveriesResponse.json()).rows) {
    expect(row.order.total).toBeUndefined();
    expect(row.order.paymentTerms).toBeUndefined();
  }
  const restrictedGeneratedResponse = await request.get(
    "/api/records/generated",
  );
  expect(restrictedGeneratedResponse.status()).toBe(200);
  expect((await restrictedGeneratedResponse.json()).total).toBe(0);
  expect(
    (await request.get(`/api/records/generated/${generated.id}`)).status(),
  ).toBe(403);
  expect((await request.get("/api/files/" + tenderFile.id)).status()).toBe(403);
  expect(
    (
      await request.post("/api/records/customers", {
        headers: { Origin: "https://evil.test" },
        data: { name: "forbidden" },
      })
    ).status(),
  ).toBe(403);
});
