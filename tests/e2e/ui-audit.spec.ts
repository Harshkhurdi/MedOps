import { test, expect, type Page } from "@playwright/test";

test.use({ timezoneId: "Asia/Kolkata" });

async function signIn(page: Page) {
  const response = await page.request.post("/api/auth/login", {
    headers: { Origin: "http://localhost:3000" },
    data: { email: "admin@example.test", password: "synthetic-test-password" },
  });
  expect(response.ok()).toBe(true);
}

const customer = { id: "ui-customer", name: "UI audit hospital" };
const product = {
  id: "ui-product",
  name: "Saved ultrasound",
  model: "UI-MODEL",
  manufacturerId: "ui-manufacturer",
};
const tender = {
  id: "ui-tender",
  number: "UI-TENDER",
  title: "UI tender",
  status: "WON",
  customerId: customer.id,
  deadline: "2030-01-15T14:30:00.000Z",
  deliveryTerms: "Deliver within 30 days",
  warrantyTerms: "24 months",
  items: [
    {
      productId: product.id,
      equipment: "Ultrasound",
      model: product.model,
      manufacturerId: product.manufacturerId,
      quantity: 2,
    },
  ],
};

async function mockLookups(page: Page) {
  await page.route("**/api/lookups/**", async (route) => {
    const source = new URL(route.request().url()).pathname.split("/").pop();
    const rows =
      source === "tenders"
        ? [tender]
        : source === "products"
          ? [product]
          : source === "customers"
            ? [customer]
            : source === "manufacturers"
              ? [{ id: product.manufacturerId, name: "UI manufacturer" }]
              : [];
    await route.fulfill({ json: { rows } });
  });
}

async function emptyRegister(page: Page, module: string) {
  await page.route(`**/api/records/${module}?*`, (route) =>
    route.fulfill({ json: { rows: [], total: 0 } }),
  );
}

test("global search opens another record within the same register", async ({
  page,
}) => {
  await signIn(page);
  const first = { id: "ui-first", name: "First UI hospital" };
  const second = { id: "ui-second", name: "Second UI hospital" };
  await emptyRegister(page, "customers");
  await page.route("**/api/records/customers/ui-*", (route) =>
    route.fulfill({
      json: route.request().url().endsWith(first.id) ? first : second,
    }),
  );
  await page.route("**/api/customers/*/timeline", (route) =>
    route.fulfill({ json: {} }),
  );
  await page.route("**/api/search?*", (route) =>
    route.fulfill({
      json: {
        groups: [
          {
            entity: "customers",
            results: [
              {
                id: second.id,
                label: second.name,
                href: `/customers?record=${second.id}`,
              },
            ],
          },
        ],
      },
    }),
  );
  await page.goto(`/customers?record=${first.id}`);
  await expect(
    page.getByRole("dialog", { name: "Customers record" }),
  ).toContainText(first.name);
  await page.getByRole("button", { name: "Close record", exact: true }).click();
  await page.getByRole("button", { name: /Search ·/ }).click();
  await page
    .getByRole("textbox", {
      name: "Search records, contacts or serial numbers",
    })
    .fill("Second");
  await page.getByRole("link", { name: second.name, exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`record=${second.id}`));
  await expect(
    page.getByRole("dialog", { name: "Customers record" }),
  ).toContainText(second.name);
  await expect(
    page.getByRole("dialog", { name: "Customers record" }),
  ).not.toContainText(first.name);
});

test("won tender prefill preserves saved product and does not invent payment terms", async ({
  page,
}) => {
  await signIn(page);
  await mockLookups(page);
  await emptyRegister(page, "orders");
  let saved: Record<string, unknown> | undefined;
  await page.route("**/api/records/orders", async (route) => {
    saved = route.request().postDataJSON();
    await route.fulfill({ json: { id: "ui-order" } });
  });
  await page.goto("/orders");
  await page.getByRole("button", { name: "Add record", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog
    .getByLabel("Payment terms", { exact: true })
    .fill("Actual official PO terms");
  await dialog
    .getByRole("combobox", { name: "Won tender (optional)" })
    .fill("UI");
  await page.getByRole("option", { name: tender.title, exact: true }).click();
  await expect(
    dialog.getByRole("combobox", { name: "Saved product (optional)" }),
  ).toHaveValue(product.name);
  await expect(dialog.getByLabel("Payment terms", { exact: true })).toHaveValue(
    "Actual official PO terms",
  );
  await dialog
    .getByRole("textbox", { name: "Official PO number", exact: true })
    .fill("UI-PO");
  await dialog
    .getByRole("textbox", { name: "PO date", exact: true })
    .fill("2030-01-15");
  await dialog
    .getByRole("spinbutton", { name: "Unit price (INR)" })
    .fill("100");
  await dialog
    .getByRole("button", { name: "Save record", exact: true })
    .click();
  await expect(dialog).toBeHidden();
  expect((saved?.items as Record<string, unknown>[])[0].productId).toBe(
    product.id,
  );
  expect(saved?.paymentTerms).toBe("Actual official PO terms");
});

test("RFQ tender deadline retains the actual instant in India timezone", async ({
  page,
}) => {
  await signIn(page);
  await mockLookups(page);
  await emptyRegister(page, "rfqs");
  let saved: Record<string, unknown> | undefined;
  await page.route("**/api/records/rfqs", async (route) => {
    saved = route.request().postDataJSON();
    await route.fulfill({ json: { id: "ui-rfq" } });
  });
  await page.goto("/rfqs");
  await page.getByRole("button", { name: "New RFQ", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("combobox", { name: "Tender (optional)" }).fill("UI");
  await page.getByRole("option", { name: tender.title, exact: true }).click();
  await expect(
    dialog.getByLabel("Tender deadline", { exact: true }),
  ).toHaveValue("2030-01-15T20:00");
  await dialog
    .getByRole("textbox", { name: "RFQ number", exact: true })
    .fill("UI-RFQ");
  await expect(
    dialog.getByRole("combobox", { name: "Manufacturer", exact: true }),
  ).toHaveValue("UI manufacturer");
  await dialog
    .getByRole("button", { name: "Save record", exact: true })
    .click();
  await expect(dialog).toBeHidden();
  expect(saved?.tenderDeadline).toBe(tender.deadline);
});

test("late tender prefill cannot replace a newer tender selection", async ({
  page,
}) => {
  await signIn(page);
  await mockLookups(page);
  await emptyRegister(page, "orders");
  const second = {
    ...tender,
    id: "ui-second-tender",
    title: "Second tender",
    customerId: "second-customer",
    items: [{ ...tender.items[0], equipment: "Second equipment" }],
  };
  let releaseFirst!: () => void;
  const firstResponse = new Promise<void>((resolve) => {
    releaseFirst = resolve;
  });
  let firstRequested = false;
  await page.route("**/api/lookups/tenders?*", async (route) => {
    const params = new URL(route.request().url()).searchParams;
    if (params.get("ids") === tender.id && !params.get("q")) {
      firstRequested = true;
      await firstResponse;
      await route.fulfill({ json: { rows: [tender] } });
    } else if (params.get("ids") === second.id && !params.get("q")) {
      await route.fulfill({ json: { rows: [second] } });
    } else {
      await route.fulfill({ json: { rows: [tender, second] } });
    }
  });
  await page.goto("/orders");
  await page.getByRole("button", { name: "Add record", exact: true }).click();
  const dialog = page.getByRole("dialog");
  const selection = dialog.getByRole("combobox", {
    name: "Won tender (optional)",
  });
  await selection.fill("UI");
  await page.getByRole("option", { name: tender.title, exact: true }).click();
  await expect.poll(() => firstRequested).toBe(true);
  await selection.fill("Second");
  await page.getByRole("option", { name: second.title, exact: true }).click();
  await expect(
    dialog.getByRole("textbox", { name: "Equipment name", exact: true }),
  ).toHaveValue("Second equipment");
  const lateResponse = page.waitForResponse(
    (r) =>
      new URL(r.url()).pathname === "/api/lookups/tenders" &&
      new URL(r.url()).searchParams.get("ids") === tender.id &&
      !new URL(r.url()).searchParams.get("q"),
  );
  releaseFirst();
  await lateResponse;
  await expect(
    dialog.getByRole("textbox", { name: "Equipment name", exact: true }),
  ).toHaveValue("Second equipment");
  await expect(selection).toHaveValue(second.title);
});

test("changing generator source clears the previous preview and download", async ({
  page,
}) => {
  await signIn(page);
  await mockLookups(page);
  const second = { ...tender, id: "ui-second-source", title: "Second source" };
  await page.route("**/api/lookups/tenders?*", (route) =>
    route.fulfill({ json: { rows: [tender, second] } }),
  );
  await page.route("**/api/records/templates?*", (route) =>
    route.fulfill({
      json: {
        rows: [
          {
            id: "ui-template",
            name: "UI template",
            approved: true,
            body: "Tender {{tender_number}}",
          },
        ],
      },
    }),
  );
  await page.route("**/api/generate", (route) =>
    route.fulfill({
      json: route.request().postDataJSON().preview
        ? {
            preview: "Tender UI-TENDER",
            values: { tender_number: tender.number },
            body: "Tender {{tender_number}}",
          }
        : { preview: "Tender UI-TENDER", fileId: "ui-draft" },
    }),
  );
  await page.goto("/generator");
  await page.getByRole("combobox", { name: "Approved template" }).click();
  await page.getByRole("option", { name: "UI template", exact: true }).click();
  const source = page.getByRole("combobox", {
    name: "Source record",
    exact: true,
  });
  await source.fill("UI");
  await page.getByRole("option", { name: tender.title, exact: true }).click();
  await page
    .getByRole("button", { name: "Load saved information & preview" })
    .click();
  await expect(page.getByText("Draft preview", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Generate reviewed information as a draft" })
    .click();
  await expect(
    page.getByRole("link", { name: "Download generated draft" }),
  ).toBeVisible();
  await source.fill("Second");
  await page.getByRole("option", { name: second.title, exact: true }).click();
  await expect(page.getByText("Draft preview", { exact: true })).toBeHidden();
  await expect(
    page.getByRole("link", { name: "Download generated draft" }),
  ).toBeHidden();
  await expect(
    page.getByRole("button", {
      name: "Generate reviewed information as a draft",
    }),
  ).toBeDisabled();
});

test("uncertain email retry reuses its ID and requires a new review", async ({
  page,
}) => {
  await signIn(page);
  const requests: Record<string, unknown>[] = [];
  await page.route("**/api/communication", async (route) => {
    if (route.request().method() === "GET")
      return route.fulfill({ json: { emailConfigured: true } });
    requests.push(route.request().postDataJSON());
    await route.fulfill({
      status: 503,
      json: {
        error: "Delivery unconfirmed. Review email history before retrying.",
      },
    });
  });
  await page.goto("/communication");
  await page
    .getByLabel("Email recipient", { exact: true })
    .fill("nobody@example.test");
  await page.getByLabel("Subject", { exact: true }).fill("Synthetic review");
  await page
    .getByLabel("Message text", { exact: true })
    .fill("Only a mocked synthetic message.");
  const consent = page.getByRole("checkbox", {
    name: "I reviewed this recipient and text and want to send this email",
  });
  const send = page.getByRole("button", { name: "Send email", exact: true });
  await consent.check();
  await send.click();
  await expect(
    page.getByText(
      "Delivery unconfirmed. Review email history before retrying.",
    ),
  ).toBeVisible();
  await expect(consent).not.toBeChecked();
  await expect(send).toBeDisabled();
  await consent.check();
  await send.click();
  await expect.poll(() => requests.length).toBe(2);
  expect(requests[1].requestId).toBe(requests[0].requestId);
  await expect(send).toBeDisabled();
  await page
    .getByLabel("Message text", { exact: true })
    .fill("Changed explicitly reviewed text.");
  await consent.check();
  await send.click();
  await expect.poll(() => requests.length).toBe(3);
  expect(requests[2].requestId).not.toBe(requests[0].requestId);
});

test("failed sign-out remains visible and preserves local drafts for retry", async ({
  page,
}) => {
  await signIn(page);
  await page.route("**/api/auth/logout", (route) =>
    route.fulfill({ status: 503, json: { error: "Unavailable" } }),
  );
  await page.goto("/account");
  await page.evaluate(() =>
    sessionStorage.setItem("medops-draft:ui-test", "synthetic temporary draft"),
  );
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(
    page.getByText("Could not sign out. Check your connection and try again."),
  ).toBeVisible();
  await expect(page).toHaveURL(/account/);
  expect(
    await page.evaluate(() => sessionStorage.getItem("medops-draft:ui-test")),
  ).toBe("synthetic temporary draft");
});
