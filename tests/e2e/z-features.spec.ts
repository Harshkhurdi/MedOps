import { test, expect } from "@playwright/test";
import ExcelJS from "exceljs";
const headers = { Origin: "http://localhost:3000" };
test("provider logging warning requires both confirmations and resets them on edits", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByLabel(/Email/).fill("admin@example.test");
  await page.getByLabel(/Password/).fill("synthetic-test-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/dashboard/);
  let submitted: Record<string, unknown> | undefined;
  await page.route("**/api/ai", async (route) => {
    if (route.request().method() === "GET")
      await route.fulfill({
        json: {
          available: true,
          configured: true,
          aiModel: "nvidia/nemotron-3-ultra-550b-a55b:free",
          remaining: 10,
          aiDailyLimit: 10,
          providerLoggingAllowed: true,
        },
      });
    else {
      submitted = route.request().postDataJSON();
      await route.fulfill({
        json: {
          text: "Synthetic reviewed draft",
          remaining: 9,
          truncated: false,
        },
      });
    }
  });
  await page.goto("/ai");
  await expect(page.getByText(/NVIDIA logs text sent/)).toBeVisible();
  const text = page.getByLabel("Text to send — review before approving"),
    consent = page.getByLabel(
      "I approve sending only the text above to OpenRouter and its AI provider.",
    ),
    nonConfidential = page.getByLabel(
      "This text contains no confidential or personal information. I understand NVIDIA logs it.",
    ),
    send = page.getByRole("button", {
      name: "Send approved text",
      exact: true,
    });
  await text.fill("Synthetic public greeting text");
  await consent.check();
  await expect(send).toBeDisabled();
  await nonConfidential.check();
  await expect(send).toBeEnabled();
  await text.fill("Synthetic public greeting text changed");
  await expect(consent).not.toBeChecked();
  await expect(nonConfidential).not.toBeChecked();
  await expect(send).toBeDisabled();
  await consent.check();
  await nonConfidential.check();
  await send.click();
  await expect(
    page.getByText("Synthetic reviewed draft", { exact: true }),
  ).toBeVisible();
  expect(submitted).toEqual({
    purpose: "DRAFT_LETTER",
    text: "Synthetic public greeting text changed",
    consent: true,
    nonConfidential: true,
  });
  await expect(consent).not.toBeChecked();
  await expect(nonConfidential).not.toBeChecked();
});
test("tasks, safe editing, reports, exports, optional AI and personal password changes", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByLabel(/Email/).fill("admin@example.test");
  await page.getByLabel(/Password/).fill("synthetic-test-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/dashboard/);
  const request = page.request,
    title = `Synthetic E2E follow-up ${Date.now()}`;
  await page.goto("/tasks");
  await page.getByRole("button", { name: "Add record", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Task title", exact: true })
    .fill(title);
  await page
    .getByLabel("Assigned employee", { exact: true })
    .fill("Restricted Test Employee");
  await page
    .getByRole("option", { name: "Restricted Test Employee", exact: true })
    .click();
  await page.getByLabel("Due date", { exact: true }).fill("2026-01-01");
  await page.getByRole("button", { name: "Save record", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(page.getByText(title, { exact: true })).toBeVisible();
  const task = (
    await (
      await request.get("/api/records/tasks?q=" + encodeURIComponent(title))
    ).json()
  ).rows[0];
  const privateResponse = await request.post("/api/records/tasks", {
    headers,
    data: { title: "Synthetic admin-only task" },
  });
  expect(privateResponse.status()).toBe(201);
  const privateTask = await privateResponse.json();
  const edit = await request.patch(`/api/records/tasks/${task.id}`, {
    headers: { ...headers, "If-Match": JSON.stringify(task.updatedAt) },
    data: {
      title,
      status: "IN_PROGRESS",
      dueDate: "2026-01-01",
      assignedToId: task.assignedToId,
    },
  });
  expect(edit.status()).toBe(200);
  expect(
    (
      await request.patch(`/api/records/tasks/${task.id}`, {
        headers: { ...headers, "If-Match": JSON.stringify(task.updatedAt) },
        data: { title: "stale" },
      })
    ).status(),
  ).toBe(409);
  expect(
    (
      await request.patch(`/api/records/tasks/${task.id}`, {
        headers,
        data: { title: "unversioned" },
      })
    ).status(),
  ).toBe(428);
  await page.goto("/reports");
  await expect(
    page.getByRole("heading", { name: "Receivables & aging", exact: true }),
  ).toBeVisible();
  const report = await request.get("/api/reports");
  expect(report.status()).toBe(200);
  expect((await report.json()).aging).toHaveLength(5);
  const excel = await request.get(
    "/api/export/tasks?format=xlsx&q=" + encodeURIComponent(title),
  );
  expect(excel.status()).toBe(200);
  const book = new ExcelJS.Workbook();
  await book.xlsx.load(new Uint8Array(await excel.body()).buffer);
  expect(book.getWorksheet("Records")!.getRow(2).getCell(1).value).toBe(title);
  const csv = await request.get("/api/export/tasks?format=csv");
  expect(csv.status()).toBe(200);
  expect(await csv.text()).toContain(title);
  expect(csv.headers()["cache-control"]).toContain("no-store");
  expect(
    (await request.get("/api/records/tasks?status=NOT_A_STATUS")).status(),
  ).toBe(400);
  await page.goto("/ai");
  await expect(
    page.getByRole("heading", { name: "AI writing assistant", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Send approved text" }),
  ).toBeDisabled();
  expect(
    (
      await request.post("/api/ai", {
        headers,
        data: {
          purpose: "REWRITE",
          text: "Synthetic explicit text",
          consent: false,
        },
      })
    ).status(),
  ).toBe(400);
  expect(
    (
      await request.post("/api/ai", {
        headers,
        data: {
          purpose: "REWRITE",
          text: "Synthetic explicit text",
          consent: true,
          fileId: "private",
        },
      })
    ).status(),
  ).toBe(400);
  expect(
    (
      await request.post("/api/ai", {
        headers,
        data: {
          purpose: "REWRITE",
          text: "Synthetic explicit text",
          consent: true,
        },
      })
    ).status(),
  ).toBe(503);
  expect(
    (
      await request.patch("/api/settings", {
        headers,
        data: {
          aiEnabled: true,
          aiModel: "synthetic/model",
          aiDailyLimit: 10,
          aiMaxOutputTokens: 1200,
        },
      })
    ).status(),
  ).toBe(400);
  expect((await request.post("/api/reminders", { headers })).status()).toBe(
    200,
  );
  await request.post("/api/auth/logout", { headers });
  const login = await request.post("/api/auth/login", {
    headers,
    data: {
      email: "employee@example.test",
      password: "synthetic-test-password",
    },
  });
  expect(login.status()).toBe(200);
  expect((await request.get(`/api/records/tasks/${task.id}`)).status()).toBe(
    200,
  );
  expect(
    (await request.get(`/api/records/tasks/${privateTask.id}`)).status(),
  ).toBe(404);
  expect((await request.get("/api/records/orders")).status()).toBe(403);
  const orders = await request.get("/api/lookups/orders?for=deliveries");
  expect(orders.status()).toBe(200);
  for (const row of (await orders.json()).rows) {
    expect(row.total).toBeUndefined();
    for (const item of row.items) expect(item.unitPrice).toBeUndefined();
  }
  expect((await request.get("/api/export/orders")).status()).toBe(403);
  expect((await request.get("/api/reports")).status()).toBe(403);
  expect(
    (
      await request.post("/api/ai", {
        headers,
        data: {
          purpose: "REWRITE",
          text: "Synthetic explicit text",
          consent: true,
        },
      })
    ).status(),
  ).toBe(403);
  const notifications = (
    await (await request.get("/api/records/notifications")).json()
  ).rows;
  const taskNotification = notifications.find(
    (n: { recordId: string }) => n.recordId === task.id,
  );
  expect(taskNotification).toBeTruthy();
  expect(
    (
      await request.patch(`/api/records/notifications/${taskNotification.id}`, {
        headers,
        data: { read: true },
      })
    ).status(),
  ).toBe(200);
  const completedNotification = await request.patch(
    `/api/records/notifications/${taskNotification.id}`,
    { headers, data: { complete: true } },
  );
  expect(completedNotification.status()).toBe(200);
  expect((await completedNotification.json()).completedAt).toBeTruthy();
  expect(
    (await (await request.get("/api/records/notifications")).json()).rows.some(
      (n: { id: string }) => n.id === taskNotification.id,
    ),
  ).toBe(false);
  await page.goto("/account");
  await page.getByLabel(/^Current password/).fill("synthetic-test-password");
  await page.getByLabel(/^New password/).fill("synthetic-new-password");
  await page.getByLabel(/^Confirm new password/).fill("synthetic-new-password");
  await page
    .getByRole("button", { name: "Change password and sign out" })
    .click();
  await expect(page).toHaveURL(/login/);
  expect((await request.get("/api/records/tasks")).status()).toBe(401);
  expect(
    (
      await request.post("/api/auth/login", {
        headers,
        data: {
          email: "employee@example.test",
          password: "synthetic-test-password",
        },
      })
    ).status(),
  ).toBe(401);
  expect(
    (
      await request.post("/api/auth/login", {
        headers,
        data: {
          email: "employee@example.test",
          password: "synthetic-new-password",
        },
      })
    ).status(),
  ).toBe(200);
});
