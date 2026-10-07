import type { Prisma } from "@/generated/prisma/client";
import { type Actor, can } from "./auth";
import { AppError } from "./errors";
import { cents, money } from "./business";
import { commercialCalculation, rfqTransition } from "./commercial";

export async function prepareCommercial(
  tx: Prisma.TransactionClient,
  name: string,
  data: Record<string, unknown>,
  user: Actor,
  old: Record<string, unknown> | null,
  id?: string,
) {
  if (data.historical && user.role !== "ADMIN")
    throw new AppError(403, "Historical entry requires an administrator");
  if (["quotes", "decisions", "results"].includes(name) && id)
    throw new AppError(
      405,
      "History is immutable. Add a new revision or decision instead",
    );
  if (
    ["quotes", "comparisons", "results"].includes(name) &&
    !can(user, "pricing")
  )
    throw new AppError(403, "Pricing access is required");
  for (const field of ["assignedToId", "employeeId"])
    if (
      data[field] &&
      !(await tx.user.findFirst({
        where: { id: String(data[field]), active: true },
      }))
    )
      throw new AppError(400, "Choose an active employee");
  if (name === "decisions") {
    if (data.decision === "REJECT" && data.confirmed !== true)
      throw new AppError(
        400,
        "Confirm rejection before recording this decision",
      );
    delete data.confirmed;
    data.decisionBy = user.id;
    data.decisionAt = new Date();
  }
  if (name === "rfqs") {
    if (old && (await tx.quoteSeries.count({ where: { rfqId: id } }))) {
      for (const field of [
        "manufacturerId",
        "customerId",
        "tenderId",
        "productId",
      ])
        if ((old[field] ?? null) !== (data[field] ?? null))
          throw new AppError(
            409,
            "RFQ relationships are locked after a quotation is recorded",
          );
    }
    if (data.contactId) {
      const contact = await tx.manufacturerContact.findUnique({
        where: { id: String(data.contactId) },
      });
      if (!contact?.active || contact.manufacturerId !== data.manufacturerId)
        throw new AppError(
          400,
          "Contact must belong to the selected manufacturer and be active",
        );
    }
    if (data.productId) {
      const product = await tx.product.findUnique({
        where: { id: String(data.productId) },
      });
      if (!product || product.manufacturerId !== data.manufacturerId)
        throw new AppError(
          400,
          "Product must belong to the selected manufacturer",
        );
    }
    if (data.tenderId) {
      const tender = await tx.tender.findUnique({
        where: { id: String(data.tenderId) },
      });
      if (
        !tender ||
        (data.customerId &&
          tender.customerId &&
          tender.customerId !== data.customerId)
      )
        throw new AppError(400, "RFQ customer must match its tender");
      data.customerId ||= tender.customerId;
    }
    if (old) rfqTransition(String(old.status), String(data.status));
    else if (!data.historical && data.status !== "DRAFT")
      throw new AppError(400, "New RFQs start in Draft");
    if (
      ["SENT", "AWAITING_RESPONSE"].includes(String(data.status)) &&
      !data.sentAt
    )
      throw new AppError(400, "Record the actual sent date");
  }
  if (
    name === "rfq-followups" &&
    data.nextDate &&
    data.nextDate < data.contactDate!
  )
    throw new AppError(400, "Follow-up cannot precede contact");
  if (name === "quotes") {
    const metadata = {
      number: String(data.number),
      manufacturerId: String(data.manufacturerId),
      rfqId: data.rfqId as string | null | undefined,
      tenderId: data.tenderId as string | null | undefined,
      productId: data.productId as string | null | undefined,
    };
    if (metadata.productId) {
      const product = await tx.product.findUnique({
        where: { id: metadata.productId },
      });
      if (product?.manufacturerId !== metadata.manufacturerId)
        throw new AppError(400, "Quote product must match manufacturer");
    }
    if (metadata.rfqId) {
      const rfq = await tx.rfq.findUnique({ where: { id: metadata.rfqId } });
      if (
        !rfq ||
        rfq.manufacturerId !== metadata.manufacturerId ||
        (metadata.tenderId && rfq.tenderId !== metadata.tenderId) ||
        ["CANCELLED", "CLOSED"].includes(rfq.status)
      )
        throw new AppError(
          400,
          "Quote must match an open RFQ and manufacturer",
        );
      metadata.tenderId ||= rfq.tenderId;
    }
    const previous = data.previousQuoteId
      ? await tx.quotationRevision.findUnique({
          where: { id: String(data.previousQuoteId) },
          include: { series: true },
        })
      : null;
    if (data.previousQuoteId && !previous)
      throw new AppError(400, "Previous quotation revision not found");
    if (previous) {
      for (const field of [
        "number",
        "manufacturerId",
        "rfqId",
        "tenderId",
        "productId",
      ] as const)
        if ((previous.series[field] ?? null) !== (metadata[field] ?? null))
          throw new AppError(
            400,
            "Revision must retain the quotation's original relationships",
          );
      const latest = await tx.quotationRevision.findFirst({
        where: { seriesId: previous.seriesId },
        orderBy: { revision: "desc" },
      });
      if (latest?.id !== previous.id)
        throw new AppError(409, "Revise the latest quotation version");
      data.seriesId = previous.seriesId;
      data.revision = previous.revision + 1;
    } else {
      const series = await tx.quoteSeries.create({ data: metadata });
      data.seriesId = series.id;
      data.revision = 1;
    }
    delete data.previousQuoteId;
    for (const field of ["manufacturerId", "rfqId", "tenderId", "productId"])
      delete data[field];
    if (data.validityDate && data.validityDate < data.quotationDate!)
      throw new AppError(400, "Quote validity must follow quotation date");
    const base = cents(String(data.unitPrice)) * BigInt(Number(data.quantity));
    const costs = [
      "taxAmount",
      "accessoriesCost",
      "freight",
      "installation",
      "warrantyCost",
      "extendedWarrantyCost",
      "otherCosts",
    ].reduce((sum, field) => sum + cents(String(data[field])), base);
    if (costs > 999999999999999999n)
      throw new AppError(400, "Quotation exceeds the supported amount range");
    const discount = cents(String(data.discount));
    if (discount > costs)
      throw new AppError(400, "Discount exceeds quotation value");
    data.baseTotal = money(base);
    data.total = money(costs - discount);
    if (metadata.rfqId) {
      const rfq = await tx.rfq.findUniqueOrThrow({
        where: { id: metadata.rfqId },
      });
      if (!data.historical && ["DRAFT", "READY_TO_SEND"].includes(rfq.status))
        throw new AppError(
          400,
          "Record the RFQ as sent before recording receipt",
        );
      await tx.rfq.update({
        where: { id: metadata.rfqId },
        data: {
          status: data.isFinal ? "FINAL_QUOTE_RECEIVED" : "QUOTE_RECEIVED",
          receivedAt: new Date(),
        },
      });
    }
  }
  if (name === "comparisons") {
    if (data.quoteId) {
      const quote = await tx.quotationRevision.findUnique({
        where: { id: String(data.quoteId) },
        include: { series: true },
      });
      if (
        !quote ||
        quote.currency !== data.currency ||
        (data.tenderId && data.tenderId !== quote.series.tenderId) ||
        (data.rfqId && data.rfqId !== quote.series.rfqId)
      )
        throw new AppError(
          400,
          "Comparison must match quote currency and relationships",
        );
      data.tenderId ||= quote.series.tenderId;
      data.rfqId ||= quote.series.rfqId;
      data.procurementCost ??= String(
        quote.finalManufacturerPrice ?? quote.total,
      );
      data.leadTimeDays ??= quote.leadTimeDays;
    }
    if (data.procurementCost == null)
      throw new AppError(400, "Enter a procurement cost or select a quotation");
    Object.assign(
      data,
      commercialCalculation(
        String(data.procurementCost),
        String(data.additionalCosts),
        String(data.sellingPrice),
      ),
    );
  }
  if (name === "results") {
    data.recordedBy = user.id;
    const tender = await tx.tender.findUnique({
      where: { id: String(data.tenderId) },
    });
    if (!tender) throw new AppError(400, "Tender not found");
    if (
      (await tx.purchaseOrder.count({ where: { tenderId: tender.id } })) &&
      data.outcome !== "WON"
    )
      throw new AppError(
        400,
        "A tender with orders cannot be changed to a lost or cancelled result",
      );
    const status =
      data.outcome === "NO_BID"
        ? "CANCELLED"
        : (String(data.outcome) as "WON" | "LOST" | "CANCELLED");
    await tx.tender.update({ where: { id: tender.id }, data: { status } });
    await tx.tenderStatusHistory.create({
      data: {
        tenderId: tender.id,
        fromStatus: tender.status,
        toStatus: status,
        changedBy: user.id,
        notes: "Result recorded",
      },
    });
  }
  return data;
}
