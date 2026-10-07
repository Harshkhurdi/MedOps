import { reportDates } from "./management-dates";
import { db } from "./db";
import { type Actor } from "./auth";
import { canResource } from "./record-access";
import { AppError } from "./errors";
import { cents, money, addDays, daysOverdue } from "./business";
import { operationalContribution } from "./revenue";
import { signedMoney } from "./commercial";
import { recordWhere } from "./record-query";
import { receivables } from "./reports";

export async function managementReport(
  user: Actor,
  params: URLSearchParams,
  now = new Date(),
) {
  const { start, end } = reportDates(params),
    dateRange = {
      ...(start ? { gte: start } : {}),
      ...(end ? { lte: end } : {}),
    };
  const customerId = params.get("customerId") || undefined,
    manufacturerId = params.get("manufacturerId") || undefined,
    productId = params.get("productId") || undefined,
    employeeId = params.get("employeeId") || undefined;
  const date = (key: string) =>
    Object.keys(dateRange).length ? { [key]: dateRange } : {};
  const bound = 10000;
  async function bounded<T>(rows: Promise<T[]>) {
    const r = await rows;
    if (r.length > bound)
      throw new AppError(
        413,
        "Narrow the report filters to 10,000 records per register",
      );
    return r;
  }
  const invoices = canResource(user, "invoices")
    ? await bounded(
        db.invoice.findMany({
          where: { customerId, ...date("invoiceDate") },
          include: {
            customer: true,
            payments: true,
            adjustments: true,
            order: {
              include: {
                items: { include: { manufacturer: true, product: true } },
                equipment: { include: { product: true } },
              },
            },
          },
          take: bound + 1,
        }),
      )
    : [];
  const costs = canResource(user, "costs")
    ? await bounded(
        db.operationalCost.findMany({
          where: {
            customerId,
            manufacturerId,
            productId,
            employeeId,
            ...date("incurredDate"),
          },
          include: {
            customer: true,
            manufacturer: true,
            product: true,
            order: true,
          },
          take: bound + 1,
        }),
      )
    : [];
  // Revenue is attributed only when recorded links identify one manufacturer/product.
  // Mixed or missing links remain explicitly unallocated, rather than estimating splits.
  const revenues = invoices
    .map((i) => {
      const manufacturers = [
        ...new Map(
          (i.order?.items ?? [])
            .filter((x) => x.manufacturer)
            .map((x) => [x.manufacturerId!, x.manufacturer!]),
        ).values(),
      ];
      const products = [
        ...new Map(
          [...(i.order?.items ?? []), ...(i.order?.equipment ?? [])]
            .filter((x) => x.product)
            .map((x) => [x.productId!, x.product!]),
        ).values(),
      ];
      const net =
        cents(String(i.amount)) +
        i.adjustments
          .filter((a) => a.type !== "PAYMENT_REVERSAL")
          .reduce(
            (s, a) =>
              s +
              (a.type === "INVOICE_DEBIT" ? 1n : -1n) * cents(String(a.amount)),
            0n,
          );
      return {
        invoice: i,
        net,
        manufacturer: manufacturers.length === 1 ? manufacturers[0] : null,
        product: products.length === 1 ? products[0] : null,
      };
    })
    .filter(
      (r) =>
        (!manufacturerId || r.manufacturer?.id === manufacturerId) &&
        (!productId || r.product?.id === productId),
    );
  const groups = new Map<
    string,
    {
      dimension: string;
      key: string;
      recordId: string | null;
      revenue: bigint;
      costs: bigint;
      service: bigint;
      postSale: bigint;
    }
  >();
  const group = (dimension: string, key: string, recordId: string | null) => {
    const token = JSON.stringify([
      dimension,
      recordId === null ? "label" : "id",
      recordId ?? key,
    ]);
    let r = groups.get(token);
    if (!r) {
      r = {
        dimension,
        key,
        recordId,
        revenue: 0n,
        costs: 0n,
        service: 0n,
        postSale: 0n,
      };
      groups.set(token, r);
    }
    return r;
  };
  for (const r of revenues) {
    const dimensions: [string, string, string | null][] = [
      [
        "order",
        r.invoice.order?.number ?? "Unlinked historical invoices",
        r.invoice.orderId,
      ],
      ["customer", r.invoice.customer.name, r.invoice.customerId],
      [
        "manufacturer",
        r.manufacturer?.name ?? "Unallocated",
        r.manufacturer?.id ?? null,
      ],
      ["product", r.product?.name ?? "Unallocated", r.product?.id ?? null],
      ["category", "Recorded revenue", null],
      ["period", r.invoice.invoiceDate.toISOString().slice(0, 7), null],
    ];
    for (const [dimension, key, id] of dimensions)
      group(dimension, key, id).revenue += r.net;
  }
  for (const c of costs) {
    const dimensions: [string, string, string | null][] = [
      ["order", c.order?.number ?? "Unlinked costs", c.orderId],
      ["customer", c.customer.name, c.customerId],
      ["manufacturer", c.manufacturer?.name ?? "Unallocated", c.manufacturerId],
      ["product", c.product?.name ?? "Unallocated", c.productId],
      ["category", c.category, null],
      ["period", c.incurredDate.toISOString().slice(0, 7), null],
    ];
    for (const [dimension, key, id] of dimensions) {
      const g = group(dimension, key, id);
      g.costs += cents(String(c.amount));
      if (c.serviceCost) g.service += cents(String(c.amount));
      if (c.postSale) g.postSale += cents(String(c.amount));
    }
  }
  const profitability = {
    ...operationalContribution(
      revenues.reduce((s, r) => s + r.net, 0n),
      costs.reduce((s, c) => s + cents(String(c.amount)), 0n),
    ),
    serviceCost: money(
      costs
        .filter((c) => c.serviceCost)
        .reduce((s, c) => s + cents(String(c.amount)), 0n),
    ),
    postSaleCost: money(
      costs
        .filter((c) => c.postSale)
        .reduce((s, c) => s + cents(String(c.amount)), 0n),
    ),
    groups: [...groups.values()].map((g) => ({
      dimension: g.dimension,
      key: g.key,
      recordId: g.recordId,
      ...operationalContribution(g.revenue, g.costs),
      serviceCost: money(g.service),
      postSaleCost: money(g.postSale),
    })),
    policy:
      "Operational contribution uses net invoice amounts and base credit/debit corrections, excluding invoice tax. Costs use entered amounts; enter recoverable-tax-exclusive costs for a comparable margin. Receipt reversals change receivables, not revenue. Mixed/missing manufacturer or product links are unallocated. Category rows separate revenue from cost categories. This is not a statutory accounting statement.",
  };
  const tenders = canResource(user, "tenders")
    ? await bounded(
        db.tender.findMany({
          where: {
            customerId,
            ...date("createdAt"),
            ...(manufacturerId ? { items: { some: { manufacturerId } } } : {}),
          },
          include: {
            items: true,
            results: { orderBy: { resultDate: "desc" }, take: 1 },
            decisions: { orderBy: { decisionAt: "asc" } },
            customer: true,
          },
          take: bound + 1,
        }),
      )
    : [];
  const rfqs = canResource(user, "rfqs")
    ? await bounded(
        db.rfq.findMany({
          where: {
            customerId,
            manufacturerId,
            productId,
            ...date("createdAt"),
          },
          include: { manufacturer: true },
          take: bound + 1,
        }),
      )
    : [];
  const quotes = canResource(user, "quotes")
    ? await bounded(
        db.quotationRevision.findMany({
          where: {
            ...date("quotationDate"),
            series: {
              manufacturerId,
              productId,
              ...(customerId ? { rfq: { customerId } } : {}),
            },
          },
          include: { series: { include: { rfq: true, manufacturer: true } } },
          take: bound + 1,
        }),
      )
    : [];
  const orders = canResource(user, "orders")
    ? await bounded(
        db.purchaseOrder.findMany({
          where: {
            customerId,
            ...date("poDate"),
            ...(manufacturerId ? { items: { some: { manufacturerId } } } : {}),
          },
          include: {
            items: { include: { manufacturer: true, product: true } },
            customer: true,
          },
          take: bound + 1,
        }),
      )
    : [];
  const equipment = canResource(user, "equipment")
    ? await bounded(
        db.equipment.findMany({
          where: {
            customerId,
            manufacturerId,
            productId,
            ...date("createdAt"),
          },
          take: bound + 1,
        }),
      )
    : [];
  const tickets = canResource(user, "tickets")
    ? await bounded(
        db.serviceTicket.findMany({
          where: {
            customerId,
            manufacturerId,
            assignedToId: employeeId,
            ...date("reportedAt"),
            ...(productId ? { equipment: { productId } } : {}),
          },
          take: bound + 1,
        }),
      )
    : [];
  const pipeline = canResource(user, "pipeline")
    ? await bounded(
        db.salesOpportunity.findMany({
          where: {
            customerId,
            manufacturerId,
            productId,
            assignedToId: employeeId,
            ...date("createdAt"),
          },
          take: bound + 1,
        }),
      )
    : [];
  const amcs = canResource(user, "amcs")
    ? await bounded(
        db.amcContract.findMany({
          where: { customerId, ...date("startDate") },
          take: bound + 1,
        }),
      )
    : [];
  const opportunities = canResource(user, "amc-opportunities")
    ? await bounded(
        db.amcOpportunity.findMany({
          where: {
            customerId,
            assignedToId: employeeId,
            ...date("createdAt"),
            ...(manufacturerId || productId
              ? { equipment: { manufacturerId, productId } }
              : {}),
          },
          take: bound + 1,
        }),
      )
    : [];
  const consumables = canResource(user, "consumable-opportunities")
    ? await bounded(
        db.consumableOpportunity.findMany({
          where: { customerId, assignedToId: employeeId, ...date("createdAt") },
          take: bound + 1,
        }),
      )
    : [];
  const isOpen = (status: string) =>
    ![
      "CLOSED",
      "CANCELLED",
      "RESOLVED",
      "WON",
      "LOST",
      "NOT_APPLICABLE",
    ].includes(status);
  const submitted = tenders.filter((t) =>
      ["SUBMITTED", "WON", "LOST"].includes(t.status),
    ),
    wins = tenders.filter((t) => t.results[0]?.outcome === "WON"),
    losses = tenders.filter((t) => t.results[0]?.outcome === "LOST");
  const lossReasons: Record<string, number> = {};
  for (const t of losses) {
    const key = t.results[0]?.reason ?? "UNKNOWN";
    lossReasons[key] = (lossReasons[key] ?? 0) + 1;
  }
  const cards: Record<string, string | number | null> = {};
  if (canResource(user, "tenders"))
    Object.assign(cards, {
      underReview: tenders.filter((t) => t.status === "UNDER_REVIEW").length,
      pursuedTenders: tenders.filter(
        (t) => t.decisions.at(-1)?.decision === "PURSUE",
      ).length,
      submittedTenders: submitted.length,
      wins: wins.length,
      losses: losses.length,
      submissionRate: tenders.length
        ? +((submitted.length * 100) / tenders.length).toFixed(2)
        : null,
      winRate:
        wins.length + losses.length
          ? +((wins.length * 100) / (wins.length + losses.length)).toFixed(2)
          : null,
    });
  if (canResource(user, "pipeline"))
    cards.pipelineValue = money(
      pipeline
        .filter((p) => isOpen(p.stage))
        .reduce((s, p) => s + cents(String(p.estimatedValue ?? 0)), 0n),
    );
  if (canResource(user, "rfqs"))
    cards.rfqsAwaitingResponse = rfqs.filter((r) =>
      ["SENT", "AWAITING_RESPONSE", "REVISION_REQUESTED"].includes(r.status),
    ).length;
  if (canResource(user, "quotes"))
    cards.quoteValidityExpiring = [
      ...new Map(
        [...quotes]
          .sort((a, b) => a.revision - b.revision)
          .map((q) => [q.seriesId, q]),
      ).values(),
    ].filter(
      (q) =>
        q.validityDate &&
        q.validityDate >= now &&
        q.validityDate <= addDays(now, 30),
    ).length;
  if (canResource(user, "orders"))
    cards.activeOrders = orders.filter(
      (o) => !["COMPLETED", "CANCELLED"].includes(o.status),
    ).length;
  if (canResource(user, "tickets"))
    Object.assign(cards, {
      openTickets: tickets.filter((t) => isOpen(t.status)).length,
      criticalTickets: tickets.filter(
        (t) => t.priority === "CRITICAL" && isOpen(t.status),
      ).length,
      awaitingParts: tickets.filter((t) => t.status === "WAITING_FOR_PARTS")
        .length,
    });
  if (canResource(user, "equipment")) cards.installedUnits = equipment.length;
  if (canResource(user, "amc-opportunities"))
    cards.amcOpportunities = opportunities.filter((o) =>
      isOpen(o.status),
    ).length;
  if (canResource(user, "consumable-opportunities"))
    cards.consumableOpportunities = consumables.filter((o) =>
      isOpen(o.status),
    ).length;
  if (canResource(user, "invoices")) {
    const ledger = receivables(
      revenues.map((r) => r.invoice),
      now,
    );
    Object.assign(cards, {
      receivables: ledger.outstanding,
      overdueReceivables: ledger.overdue,
    });
  }
  const customerDirectory = canResource(user, "customers")
    ? await bounded(
        db.customer.findMany({
          where: customerId ? { id: customerId } : {},
          take: bound + 1,
        }),
      )
    : [];
  const customerMetrics = [
    ...new Map(
      [
        ...invoices.map((i) => i.customer),
        ...orders.map((o) => o.customer),
        ...customerDirectory,
      ].map((c) => [c.id, c]),
    ).values(),
  ].map((c) => {
    const rows = revenues.filter((r) => r.invoice.customerId === c.id);
    const ledger = receivables(
      rows.map((r) => r.invoice),
      now,
    );
    const payments = rows.flatMap((r) =>
      r.invoice.payments
        .filter(
          (p) =>
            !r.invoice.adjustments.some(
              (a) => a.type === "PAYMENT_REVERSAL" && a.paymentId === p.id,
            ),
        )
        .map((p) => daysOverdue(r.invoice.dueDate, p.paymentDate)),
    );
    return {
      customer: c.name,
      revenue: money(rows.reduce((s, r) => s + r.net, 0n)),
      outstanding: ledger.outstanding,
      averagePaymentDelayDays: payments.length
        ? +(payments.reduce((s, n) => s + n, 0) / payments.length).toFixed(2)
        : null,
      purchaseOrders: orders.filter((o) => o.customerId === c.id).length,
      installedDevices: equipment.filter((e) => e.customerId === c.id).length,
      serviceTickets: tickets.filter((t) => t.customerId === c.id).length,
      amcContracts: amcs.filter((a) => a.customerId === c.id).length,
      opportunities: pipeline.filter((p) => p.customerId === c.id).length,
      opportunityValue: money(
        pipeline
          .filter((p) => p.customerId === c.id && isOpen(p.stage))
          .reduce((s, p) => s + cents(String(p.estimatedValue ?? 0)), 0n),
      ),
      tenders: tenders.filter((t) => t.customerId === c.id).length,
    };
  });
  const manufacturerDirectory = canResource(user, "manufacturers")
    ? await bounded(
        db.manufacturer.findMany({
          where: manufacturerId ? { id: manufacturerId } : {},
          take: bound + 1,
        }),
      )
    : [];
  const manufacturers = [
    ...new Map(
      [
        ...manufacturerDirectory,
        ...rfqs.map((r) => r.manufacturer),
        ...orders.flatMap((o) =>
          o.items
            .filter((i) => i.manufacturerId)
            .map((i) => ({
              id: i.manufacturerId!,
              name: i.manufacturer?.name ?? i.manufacturerId!,
            })),
        ),
      ].map((m) => [m.id, m]),
    ).values(),
  ].map((m) => {
    const ts = tenders.filter((t) =>
      t.items.some((i) => i.manufacturerId === m.id),
    );
    const qs = quotes.filter(
      (q) =>
        q.series.manufacturerId === m.id &&
        q.series.rfq?.sentAt &&
        q.quotationDate >= q.series.rfq.sentAt!,
    );
    const profit = profitability.groups.find(
      (g) => g.dimension === "manufacturer" && g.recordId === m.id,
    );
    return {
      manufacturer: m.name,
      opportunities: pipeline.filter((p) => p.manufacturerId === m.id).length,
      pursuedTenders: ts.filter(
        (t) => t.decisions.at(-1)?.decision === "PURSUE",
      ).length,
      submitted: ts.filter((t) =>
        ["SUBMITTED", "WON", "LOST"].includes(t.status),
      ).length,
      wins: ts.filter((t) => t.results[0]?.outcome === "WON").length,
      losses: ts.filter((t) => t.results[0]?.outcome === "LOST").length,
      orderValue: money(
        orders
          .flatMap((o) => o.items.filter((i) => i.manufacturerId === m.id))
          .reduce(
            (s, i) => s + cents(String(i.unitPrice)) * BigInt(i.quantity),
            0n,
          ),
      ),
      operationalRevenue: profit?.revenue ?? "0.00",
      recordedContribution: profit?.grossContribution ?? "0.00",
      openRfqs: rfqs.filter(
        (r) =>
          r.manufacturerId === m.id &&
          ![
            "CLOSED",
            "CANCELLED",
            "QUOTE_RECEIVED",
            "FINAL_QUOTE_RECEIVED",
          ].includes(r.status),
      ).length,
      quoteResponseDays: qs.length
        ? +(
            qs.reduce(
              (s, q) =>
                s + (+q.quotationDate - +q.series.rfq!.sentAt!) / 86400000,
              0,
            ) / qs.length
          ).toFixed(2)
        : null,
      installedUnits: equipment.filter((e) => e.manufacturerId === m.id).length,
      openServiceTickets: tickets.filter(
        (t) => t.manufacturerId === m.id && isOpen(t.status),
      ).length,
      amcOpportunities: opportunities.filter((o) =>
        equipment.some(
          (e) => e.id === o.equipmentId && e.manufacturerId === m.id,
        ),
      ).length,
    };
  });
  if (canResource(user, "deliveries"))
    cards.deliveriesDue = await db.delivery.count({
      where: {
        confirmed: false,
        expectedDate: { lte: addDays(now, 7) },
        order: { customerId },
      },
    });
  if (canResource(user, "installations") && canResource(user, "equipment"))
    cards.installationsPending = await db.equipment.count({
      where: {
        customerId,
        manufacturerId,
        productId,
        OR: [
          { installation: null },
          { installation: { status: { in: ["PENDING", "PARTIAL"] } } },
        ],
      },
    });
  if (canResource(user, "warranties"))
    cards.warrantyExpiry = await db.warranty.count({
      where: {
        endDate: { gte: now, lte: addDays(now, 90) },
        equipment: { customerId, manufacturerId, productId },
      },
    });
  if (canResource(user, "amcs"))
    cards.amcRenewals = amcs.filter(
      (a) =>
        a.status === "ACTIVE" &&
        a.endDate >= now &&
        a.endDate <= addDays(now, 90),
    ).length;
  if (canResource(user, "approvals")) {
    const rows = await bounded(
      db.approval.findMany({
        where: {
          ...(await recordWhere("approvals", user, new URLSearchParams())),
          status: "SUBMITTED",
        },
        take: bound + 1,
      }),
    );
    cards.pendingApprovals = rows.filter((r) =>
      canResource(user, r.relatedModule),
    ).length;
  }
  if (canResource(user, "securities")) {
    const rows = await bounded(
      db.security.findMany({
        where: {
          customerId,
          status: {
            in: [
              "ISSUED",
              "SUBMITTED",
              "ACTIVE",
              "REFUND_REQUESTED",
              "REFUND_PENDING",
              "EXPIRED",
            ],
          },
        },
        take: bound + 1,
      }),
    );
    cards.activeEmdPbg = money(
      rows
        .filter((r) => ["EMD", "PBG"].includes(r.type))
        .reduce((sum, r) => sum + cents(String(r.amount)), 0n),
    );
    cards.securityRefundsPending = money(
      rows
        .filter((r) =>
          ["REFUND_REQUESTED", "REFUND_PENDING"].includes(r.status),
        )
        .reduce((sum, r) => sum + cents(String(r.amount)), 0n),
    );
  }
  if (canResource(user, "payments")) {
    const monthStart = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
      ),
      nextMonth = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1),
      );
    const payments = await bounded(
      db.payment.findMany({
        where: {
          paymentDate: { gte: monthStart, lt: nextMonth },
          invoice: { customerId },
        },
        take: bound + 1,
      }),
    );
    const reversals = await bounded(
      db.financialAdjustment.findMany({
        where: {
          type: "PAYMENT_REVERSAL",
          adjustmentDate: { gte: monthStart, lt: nextMonth },
          invoice: { customerId },
        },
        take: bound + 1,
      }),
    );
    cards.paymentsReceivedThisMonth = signedMoney(
      payments.reduce((sum, r) => sum + cents(String(r.amount)), 0n) -
        reversals.reduce((sum, r) => sum + cents(String(r.amount)), 0n),
    );
  }
  const products = canResource(user, "products")
    ? await bounded(
        db.product.findMany({
          where: { manufacturerId, ...(productId ? { id: productId } : {}) },
          take: bound + 1,
        }),
      )
    : [];
  const productMetrics = products.map((p) => {
    const ts = tenders.filter((t) => t.items.some((i) => i.productId === p.id)),
      lines = orders.flatMap((o) =>
        o.items.filter((i) => i.productId === p.id),
      ),
      profit = profitability.groups.find(
        (g) => g.dimension === "product" && g.recordId === p.id,
      );
    return {
      product: p.name,
      model: p.model,
      manufacturerId: p.manufacturerId,
      opportunities: pipeline.filter((o) => o.productId === p.id).length,
      pursuedTenders: ts.filter(
        (t) => t.decisions.at(-1)?.decision === "PURSUE",
      ).length,
      wins: ts.filter((t) => t.results[0]?.outcome === "WON").length,
      losses: ts.filter((t) => t.results[0]?.outcome === "LOST").length,
      orderValue: money(
        lines.reduce(
          (s, i) => s + cents(String(i.unitPrice)) * BigInt(i.quantity),
          0n,
        ),
      ),
      unitsSold: lines.reduce((s, i) => s + i.quantity, 0),
      installedUnits: equipment.filter((e) => e.productId === p.id).length,
      serviceTickets: tickets.filter((t) =>
        equipment.some((e) => e.id === t.equipmentId && e.productId === p.id),
      ).length,
      amcOpportunities: opportunities.filter((o) =>
        equipment.some((e) => e.id === o.equipmentId && e.productId === p.id),
      ).length,
      operationalRevenue: profit?.revenue ?? "0.00",
      recordedContribution: profit?.grossContribution ?? "0.00",
      operationalMargin: profit?.contributionMarginPercent ?? null,
    };
  });
  const protectMetrics = (
    rows: Record<string, unknown>[],
    mapping: Record<string, string | string[]>,
  ) =>
    rows.map((row) =>
      Object.fromEntries(
        Object.entries(row).map(([key, value]) => [
          key,
          mapping[key] &&
          !(Array.isArray(mapping[key]) ? mapping[key] : [mapping[key]]).every(
            (module) => canResource(user, module),
          )
            ? null
            : value,
        ]),
      ),
    );
  return {
    cards,
    productMetrics: protectMetrics(productMetrics, {
      opportunities: "pipeline",
      pursuedTenders: "decisions",
      wins: "tenders",
      losses: "tenders",
      orderValue: "orders",
      unitsSold: "orders",
      installedUnits: "equipment",
      serviceTickets: "tickets",
      amcOpportunities: "amc-opportunities",
      operationalRevenue: "invoices",
      recordedContribution: ["costs", "invoices"],
      operationalMargin: ["costs", "invoices"],
    }),
    profitability:
      canResource(user, "costs") && canResource(user, "invoices")
        ? profitability
        : null,
    customerMetrics: protectMetrics(customerMetrics, {
      revenue: "invoices",
      outstanding: "invoices",
      averagePaymentDelayDays: "payments",
      purchaseOrders: "orders",
      installedDevices: "equipment",
      serviceTickets: "tickets",
      amcContracts: "amcs",
      opportunities: "pipeline",
      opportunityValue: "pipeline",
      tenders: "tenders",
    }),
    manufacturers: protectMetrics(manufacturers, {
      opportunities: "pipeline",
      pursuedTenders: "decisions",
      submitted: "tenders",
      wins: "tenders",
      losses: "tenders",
      orderValue: "orders",
      operationalRevenue: "invoices",
      recordedContribution: ["costs", "invoices"],
      openRfqs: "rfqs",
      quoteResponseDays: "quotes",
      installedUnits: "equipment",
      openServiceTickets: "tickets",
      amcOpportunities: "amc-opportunities",
    }),
    lossReasons,
    evaluatedAt: now.toISOString(),
    datePolicy:
      "Dates filter each register by its event date. Customer balances show lifetime corrections and receipts for selected invoices. Average delay excludes reversed receipts.",
  };
}
