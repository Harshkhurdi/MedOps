import { test, expect } from "@playwright/test";
test("Phase B securities, approvals, checklist and explicit communication screens", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByLabel(/Email/).fill("admin@example.test");
  await page.getByLabel(/Password/).fill("synthetic-test-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/dashboard/);
  const headers = { Origin: "http://localhost:3000" },
    suffix = Date.now();
  async function create(m: string, data: object) {
    const r = await page.request.post("/api/records/" + m, { headers, data });
    const d = await r.json();
    expect(r.ok(), JSON.stringify(d)).toBe(true);
    return d;
  }
  const customer = await create("customers", {
      name: `Security customer ${suffix}`,
    }),
    tender = await create("tenders", {
      number: `Control ${suffix}`,
      customerId: customer.id,
    });
  await page.goto("/securities");
  await page.getByRole("button", { name: "New Security", exact: true }).click();
  await page
    .getByRole("combobox", { name: "Security type", exact: true })
    .click();
  await page.getByRole("option", { name: "EMD", exact: true }).click();
  await page
    .getByRole("combobox", { name: "Customer", exact: true })
    .fill(customer.name);
  await page.getByRole("option", { name: customer.name, exact: true }).click();
  await page
    .getByRole("textbox", { name: "Reference", exact: true })
    .fill(`SEC-${suffix}`);
  await page
    .getByRole("spinbutton", { name: "Amount (INR)", exact: true })
    .fill("1000.01");
  await page.getByRole("button", { name: "Save record", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(page.getByText(`SEC-${suffix}`, { exact: true })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Security totals", exact: true }),
  ).toBeVisible();
  const security = (
    await (
      await page.request.get(`/api/records/securities?q=SEC-${suffix}`)
    ).json()
  ).rows[0];
  const invalid = await page.request.patch(
    `/api/records/securities/${security.id}`,
    {
      headers: { ...headers, "If-Match": JSON.stringify(security.updatedAt) },
      data: {
        type: "EMD",
        customerId: customer.id,
        reference: security.reference,
        amount: "1000.01",
        status: "REFUNDED",
      },
    },
  );
  expect(invalid.status()).toBe(400);
  const checklist = await page.request.post("/api/controls/checklist", {
    headers,
    data: { tenderId: tender.id },
  });
  expect(checklist.ok()).toBe(true);
  const summary = await (
    await page.request.get("/api/controls/summary?tenderId=" + tender.id)
  ).json();
  expect(summary.percent).toBe(0);
  expect(summary.total).toBe(21);
  await page.goto("/checklist?parent=" + tender.id);
  await expect(
    page.getByRole("cell", { name: "Price finalized", exact: true }),
  ).toBeVisible();
  const approver = await create("users", {
    email: `approver-${suffix}@example.test`,
    name: "Synthetic approver",
    role: "ADMIN",
    password: "synthetic-test-password",
  });
  const approvalInput = {
    title: `Approval ${suffix}`,
    workflow: "TENDER_PURSUE",
    relatedModule: "tenders",
    recordId: tender.id,
    approverId: approver.id,
  };
  const approval = await create("approvals", approvalInput);
  const submit = await page.request.patch(
    "/api/records/approvals/" + approval.id,
    {
      headers: { ...headers, "If-Match": JSON.stringify(approval.updatedAt) },
      data: { ...approvalInput, status: "SUBMITTED" },
    },
  );
  expect(submit.ok()).toBe(true);
  const submitted = await submit.json();
  const denied = await page.request.patch(
    "/api/records/approvals/" + approval.id,
    {
      headers: { ...headers, "If-Match": JSON.stringify(submitted.updatedAt) },
      data: { ...approvalInput, status: "APPROVED", comments: "Wrong person" },
    },
  );
  expect(denied.status()).toBe(403);
  await page.goto("/approvals");
  await expect(
    page.getByRole("cell", { name: `Approval ${suffix}`, exact: true }),
  ).toBeVisible();
  await page.goto("/communication");
  await expect(
    page.getByRole("heading", { name: "Email & WhatsApp", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Send email", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("textbox", { name: "Message text", exact: true })
    .fill("Explicit synthetic message");
  await page
    .getByRole("textbox", {
      name: "WhatsApp phone with country code",
      exact: true,
    })
    .fill("+919999999999");
  await expect(
    page.getByRole("link", { name: "Share via WhatsApp", exact: true }),
  ).toHaveAttribute(
    "href",
    "https://wa.me/919999999999?text=Explicit%20synthetic%20message",
  );
  const mail = await page.request.post("/api/communication", {
    headers,
    data: {
      recipient: "synthetic@example.test",
      subject: "Synthetic",
      text: "Explicit",
      relatedModule: "tenders",
      recordId: tender.id,
      confirmed: true,
      requestId: crypto.randomUUID(),
    },
  });
  expect(mail.status()).toBe(503);
});
