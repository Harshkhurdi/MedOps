import { beforeAll, afterAll, it, expect } from "vitest";
import { db } from "@/lib/db";
import { save } from "@/lib/service";
import { hashPassword, type Actor } from "@/lib/auth";
import { canResource } from "@/lib/record-access";
let admin: Actor,
  manufacturerId: string,
  tenderId: string,
  rfqId: string,
  quoteId: string;
const suffix = Date.now().toString();
beforeAll(async () => {
  admin = await db.user.create({
    data: {
      email: `commercial-${suffix}@example.test`,
      name: "Synthetic commercial administrator",
      role: "ADMIN",
      passwordHash: hashPassword("synthetic-test-password"),
    },
    include: { permissions: true },
  });
  manufacturerId = (
    await save(
      "manufacturers",
      { name: `Synthetic manufacturer ${suffix}` },
      admin,
    )
  ).id as string;
});
afterAll(async () => db.$disconnect());
it("allows incomplete manual tenders and keeps confirmed Go/No-Go decisions in history", async () => {
  const tender = await save(
    "tenders",
    { number: `A-${suffix}`, title: "Synthetic opportunity" },
    admin,
  );
  tenderId = tender.id as string;
  expect(tender.customerId).toBeNull();
  expect(tender.items).toEqual([]);
  await expect(
    save("decisions", { tenderId, decision: "REJECT" }, admin),
  ).rejects.toThrow("Confirm rejection");
  const decision = await save(
    "decisions",
    {
      tenderId,
      decision: "PURSUE",
      reason: "Human review",
      notes: "Synthetic decision",
    },
    admin,
  );
  expect(decision.decisionBy).toBe(admin.id);
  await expect(
    save(
      "decisions",
      { tenderId, decision: "REJECT", confirmed: true },
      admin,
      String(decision.id),
    ),
  ).rejects.toThrow("immutable");
  await save("decisions", { tenderId, decision: "REVIEW_LATER" }, admin);
  expect(await db.tenderDecision.count({ where: { tenderId } })).toBe(2);
});
it("supports manual and tender-based RFQs and rejects contact/product/transition mismatches", async () => {
  const contact = await save(
    "manufacturer-contacts",
    {
      manufacturerId,
      name: "Synthetic quotation contact",
      email: "synthetic@example.test",
    },
    admin,
  );
  const product = await save(
    "products",
    { manufacturerId, name: "Synthetic device", model: "A1" },
    admin,
  );
  const input = {
    number: `RFQ-${suffix}`,
    tenderId,
    manufacturerId,
    contactId: contact.id,
    productId: product.id,
    productName: "Synthetic device",
    quantity: 2,
  };
  const rfq = await save("rfqs", input, admin);
  rfqId = rfq.id as string;
  await expect(
    save("rfqs", { ...input, status: "CLOSED" }, admin, rfqId),
  ).rejects.toThrow("cannot move");
  await save("rfqs", { ...input, status: "READY_TO_SEND" }, admin, rfqId);
  await expect(
    save("rfqs", { ...input, status: "SENT" }, admin, rfqId),
  ).rejects.toThrow("sent date");
  await save(
    "rfqs",
    { ...input, status: "SENT", sentAt: new Date() },
    admin,
    rfqId,
  );
  const other = await save("manufacturers", { name: `Other ${suffix}` }, admin);
  await expect(
    save(
      "rfqs",
      { ...input, number: `BAD-${suffix}`, manufacturerId: other.id },
      admin,
    ),
  ).rejects.toThrow("Contact must belong");
  const manual = await save(
    "rfqs",
    {
      number: `DIRECT-${suffix}`,
      manufacturerId,
      productName: "Synthetic standalone",
      quantity: 1,
    },
    admin,
  );
  expect(manual.tenderId).toBeNull();
  await save(
    "rfq-followups",
    {
      rfqId,
      contactDate: new Date(),
      nextDate: new Date(Date.now() + 86400000),
      notes: "Synthetic manual follow-up",
    },
    admin,
  );
});
it("retains quote revisions, calculates actual costs and prevents stale revision forks", async () => {
  const input = {
    number: `Q-${suffix}`,
    manufacturerId,
    rfqId,
    tenderId,
    quotationDate: "2026-10-07",
    validityDate: "2026-11-07",
    productName: "Synthetic device",
    quantity: 2,
    unitPrice: "100",
    taxAmount: "36",
    freight: "10",
    discount: "6",
  };
  const quote = await save("quotes", input, admin);
  quoteId = quote.id as string;
  expect(String(quote.total)).toBe("240");
  expect(quote.revision).toBe(1);
  expect(
    (await db.rfq.findUniqueOrThrow({ where: { id: rfqId } })).status,
  ).toBe("QUOTE_RECEIVED");
  await expect(save("quotes", input, admin, quoteId)).rejects.toThrow(
    "immutable",
  );
  const revision = await save(
    "quotes",
    { ...input, previousQuoteId: quoteId, unitPrice: "90", isFinal: true },
    admin,
  );
  expect(revision.revision).toBe(2);
  expect(String(revision.total)).toBe("220");
  expect(
    String(
      (await db.quotationRevision.findUniqueOrThrow({ where: { id: quoteId } }))
        .total,
    ),
  ).toBe("240");
  await expect(
    save("quotes", { ...input, previousQuoteId: quoteId }, admin),
  ).rejects.toThrow("latest quotation");
  expect(
    (await db.rfq.findUniqueOrThrow({ where: { id: rfqId } })).status,
  ).toBe("FINAL_QUOTE_RECEIVED");
});
it("supports manual comparison assumptions and does not mix currencies or fabricate margins", async () => {
  const comparison = await save(
    "comparisons",
    {
      name: "Synthetic option",
      quoteId,
      tenderId,
      sellingPrice: "300",
      additionalCosts: "10",
    },
    admin,
  );
  expect(String(comparison.totalCost)).toBe("250");
  expect(String(comparison.contribution)).toBe("50");
  const loss = await save(
    "comparisons",
    { name: "Synthetic loss", procurementCost: "10", sellingPrice: "0" },
    admin,
  );
  expect(String(loss.contribution)).toBe("-10");
  expect(loss.marginPercent).toBeNull();
  await expect(
    save(
      "comparisons",
      {
        name: "Currency mismatch",
        quoteId,
        currency: "USD",
        sellingPrice: "10",
      },
      admin,
    ),
  ).rejects.toThrow("currency");
});
it("records human win/loss results and restricts historical entry and pricing", async () => {
  await save(
    "results",
    {
      tenderId,
      outcome: "WON",
      resultDate: "2026-10-07",
      notes: "Known synthetic result",
    },
    admin,
  );
  expect(
    (await db.tender.findUniqueOrThrow({ where: { id: tenderId } })).status,
  ).toBe("WON");
  const employee = {
    ...admin,
    role: "EMPLOYEE",
    permissions: [{ module: "quotes", read: true, write: true }],
  } as Actor;
  expect(canResource(employee, "quotes")).toBe(false);
  await expect(
    save(
      "rfqs",
      {
        number: `H-${suffix}`,
        manufacturerId,
        productName: "Historical",
        quantity: 1,
        historical: true,
      },
      employee,
    ),
  ).rejects.toThrow("administrator");
  expect(
    await db.auditLog.count({
      where: {
        module: {
          in: ["rfqs", "quotes", "comparisons", "results", "decisions"],
        },
      },
    }),
  ).toBeGreaterThan(10);
});
