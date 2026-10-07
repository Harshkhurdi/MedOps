import { prepareCommercial } from "./commercial-service";
import { commercialResources } from "./commercial";
import { db } from "./db";
import { type Actor, MODULES, hashPassword } from "./auth";
import { AppError } from "./errors";
import {
  delegate,
  parseResource,
  type Collection,
  resources,
} from "./resources";
import {
  addDays,
  addMonths,
  cents,
  money,
  orderTotal,
  validateDelivery,
} from "./business";
import { type Prisma } from "@/generated/prisma/client";
export async function save(
  name: Collection,
  input: unknown,
  user: Actor,
  id?: string,
  expectedUpdatedAt?: string,
) {
  const values = parseResource(name, input);
  if (["payments", "invoices", "equipment", "warranties"].includes(name) && id)
    throw new AppError(
      405,
      "This historical record is immutable. Create a new contractual record or use an audited correction process.",
    );
  return db.$transaction(
    async (tx) => {
      const d = delegate(name, tx),
        old = id
          ? await d.findUnique({
              where: { id },
              include: resources[name].include,
            })
          : null;
      if (id && !old) throw new AppError(404, "Record not found");
      if (
        expectedUpdatedAt &&
        old &&
        (old.updatedAt instanceof Date
          ? old.updatedAt.toISOString()
          : new Date(String(old.updatedAt)).toISOString()) !== expectedUpdatedAt
      )
        throw new AppError(
          409,
          "This record changed since you opened it. Close the form and reload before editing.",
        );
      if (
        name === "tasks" &&
        old &&
        user.role !== "ADMIN" &&
        old.createdById !== user.id &&
        old.assignedToId !== user.id
      )
        throw new AppError(404, "Task not found");
      const data: Record<string, unknown> = { ...values };
      if (data.historical && user.role !== "ADMIN")
        throw new AppError(403, "Historical entry requires an administrator");
      if (Object.hasOwn(commercialResources, name))
        await prepareCommercial(tx, name, data, user, old, id);
      if (name === "tasks") {
        if (!id) data.createdById = user.id;
        if (
          data.assignedToId &&
          !(await tx.user.findFirst({
            where: { id: String(data.assignedToId), active: true },
          }))
        )
          throw new AppError(400, "Choose an active employee");
        data.completedAt =
          data.status === "DONE" ? (old?.completedAt ?? new Date()) : null;
      }
      const existingId = id;
      if (name === "users") {
        if (user.role !== "ADMIN")
          throw new AppError(403, "Administrator access required");
        const permissions = data.permissions as {
          module: string;
          read: boolean;
          write: boolean;
        }[];
        if (
          permissions.some(
            (p) =>
              !MODULES.includes(p.module as (typeof MODULES)[number]) ||
              (p.write && !p.read),
          )
        )
          throw new AppError(
            400,
            "Each write permission also requires read access",
          );
        if (
          new Set(permissions.map((p) => p.module)).size !== permissions.length
        )
          throw new AppError(400, "Duplicate permission");
        if (id === user.id && (data.role !== "ADMIN" || !data.active))
          throw new AppError(
            400,
            "You cannot disable or demote your own administrator account",
          );
        if (
          old?.role === "ADMIN" &&
          (data.role !== "ADMIN" || !data.active) &&
          (await tx.user.count({ where: { role: "ADMIN", active: true } })) <= 1
        )
          throw new AppError(400, "Keep at least one active administrator");
        const password = data.password as string | undefined;
        delete data.password;
        if (!id && !password) throw new AppError(400, "Password is required");
        if (password) data.passwordHash = hashPassword(password);
        data.permissions = {
          ...(id ? { deleteMany: {} } : {}),
          create: permissions,
        };
        if (id) await tx.session.deleteMany({ where: { userId: id } });
      }
      if (name === "company") {
        for (const field of ["logoFileId", "letterheadFileId"])
          if (data[field]) {
            const file = await tx.storedFile.findUnique({
              where: { id: String(data[field]) },
            });
            if (!file || file.module !== "documents")
              throw new AppError(400, "Choose an uploaded company document");
          }
        data.declarations = data.declarations ?? "";
      }
      if (name === "documents") {
        if (
          data.issueDate &&
          data.expiryDate &&
          data.expiryDate < data.issueDate
        )
          throw new AppError(400, "Expiry must follow issue date");
      }
      if (name === "tenders") {
        const items = data.items as object[];
        if (data.items)
          data.items = { ...(id ? { deleteMany: {} } : {}), create: items };
        if (id && (await tx.purchaseOrder.count({ where: { tenderId: id } })))
          throw new AppError(
            400,
            "A tender linked to an order cannot be rewritten",
          );
        if (
          data.status === "READY_FOR_SUBMISSION" ||
          data.status === "SUBMITTED"
        ) {
          if (!id || !old?.reviewedAt)
            throw new AppError(
              400,
              "Review the bid package before marking it ready",
            );
          const generated = await tx.generatedDocument.findMany({
            where: { tenderId: id },
          });
          if (!generated.length || generated.some((g) => !g.reviewedAt))
            throw new AppError(400, "Review every generated draft first");
          if (
            await tx.tenderRequirement.count({
              where: { tenderId: id, compliance: "REQUIRES_REVIEW" },
            })
          )
            throw new AppError(400, "Review all compliance requirements");
        }
        // Any business content change invalidates the previous package approval.
        if (id) {
          const keys = Object.keys(values).filter(
            (k) => k !== "status" && k !== "items",
          );
          const changed = keys.some(
            (k) =>
              JSON.stringify(old?.[k]) !== JSON.stringify(data[k]) &&
              String(old?.[k] ?? "") !== String(data[k] ?? ""),
          );
          const oldItems = old?.items as Record<string, unknown>[];
          const itemChanged =
            JSON.stringify(
              oldItems?.map((i) => ({
                equipment: i.equipment,
                model: i.model,
                quantity: i.quantity,
                manufacturerId: i.manufacturerId,
              })),
            ) !== JSON.stringify(items);
          if (changed || itemChanged) {
            data.reviewedAt = null;
            data.reviewedBy = null;
            if (
              ["READY_FOR_SUBMISSION", "SUBMITTED"].includes(
                String(data.status),
              )
            )
              throw new AppError(
                400,
                "Save corrections in Documents In Progress, then review the package again",
              );
            await tx.generatedDocument.updateMany({
              where: { tenderId: id },
              data: { reviewedAt: null, reviewedBy: null },
            });
          }
        }
      }
      if (name === "requirements") {
        data.specification = data.specification ?? "";
        if (id && old?.tenderId !== data.tenderId)
          throw new AppError(
            400,
            "Requirement cannot be moved to another tender",
          );
        if (
          data.compliance === "COMPLIES" &&
          !(data.specification as string)?.trim()
        )
          throw new AppError(
            400,
            "Enter the actual manufacturer specification before confirming compliance",
          );
        await tx.tender.update({
          where: { id: String(data.tenderId) },
          data: { reviewedAt: null, reviewedBy: null },
        });
        await tx.generatedDocument.updateMany({
          where: { tenderId: String(data.tenderId) },
          data: { reviewedAt: null, reviewedBy: null },
        });
      }
      if (name === "templates") {
        if (user.role !== "ADMIN")
          throw new AppError(403, "Only administrators can approve templates");
        if (id) data.version = Number(old?.version) + 1;
      }
      if (name === "orders") {
        if (data.tenderId) {
          const tender = await tx.tender.findUnique({
            where: { id: String(data.tenderId) },
          });
          if (!tender || tender.status !== "WON")
            throw new AppError(
              400,
              "Only won tenders can be converted into orders",
            );
          if (tender.customerId !== data.customerId)
            throw new AppError(400, "Order customer must match the tender");
        }
        if (
          id &&
          old &&
          ((await tx.delivery.count({ where: { orderId: id } })) ||
            (await tx.invoice.count({ where: { orderId: id } })))
        ) {
          const normalized = (v: unknown) =>
            v instanceof Date ? v.toISOString() : String(v ?? "");
          const locked = [
            "number",
            "tenderId",
            "customerId",
            "poDate",
            "deliveryDeadline",
            "paymentTerms",
          ];
          if (locked.some((k) => normalized(values[k]) !== normalized(old[k])))
            throw new AppError(
              400,
              "Commercial order details are locked after dispatch or invoicing",
            );
          const inputItems = values.items as Record<string, unknown>[];
          const oldItems = old.items as Record<string, unknown>[];
          const itemKeys = [
            "equipment",
            "model",
            "manufacturerId",
            "quantity",
            "unitPrice",
            "taxRate",
          ];
          if (
            inputItems.length !== oldItems.length ||
            inputItems.some((item, i) =>
              itemKeys.some((k) =>
                ["unitPrice", "taxRate"].includes(k)
                  ? cents(String(item[k])) !== cents(String(oldItems[i][k]))
                  : normalized(item[k]) !== normalized(oldItems[i][k]),
              ),
            )
          )
            throw new AppError(
              400,
              "Order line items are locked after dispatch or invoicing",
            );
          delete data.items;
        }
        if (data.confirmed) {
          if (
            !id ||
            !(await tx.storedFile.count({
              where: { orderId: id, generated: null },
            }))
          )
            throw new AppError(
              400,
              "Upload the official purchase order before confirming details",
            );
        }
        const items = values.items as {
          quantity: number;
          unitPrice: string;
          taxRate: string;
        }[];
        data.total = orderTotal(items);
        if (data.items)
          data.items = { ...(id ? { deleteMany: {} } : {}), create: items };
      }
      if (name === "deliveries") {
        const order = await tx.purchaseOrder.findUnique({
          where: { id: String(data.orderId) },
          include: { items: true },
        });
        if (!order || !order.confirmed || order.status === "CANCELLED")
          throw new AppError(
            400,
            "Confirm the official purchase order before dispatch",
          );
        if (id && old?.orderId !== data.orderId)
          throw new AppError(400, "Delivery cannot be moved to another order");
        const items = values.items as {
          orderItemId: string;
          quantity: number;
        }[];
        if (new Set(items.map((x) => x.orderItemId)).size !== items.length)
          throw new AppError(400, "Choose each order item once");
        for (const item of items) {
          const line = order.items.find((i) => i.id === item.orderItemId);
          if (!line)
            throw new AppError(
              400,
              "Delivery item does not belong to this order",
            );
          const sum = await tx.deliveryItem.aggregate({
            where: {
              orderItemId: line.id,
              ...(id ? { deliveryId: { not: id } } : {}),
            },
            _sum: { quantity: true },
          });
          validateDelivery(
            line.quantity,
            sum._sum.quantity ?? 0,
            item.quantity,
          );
          if (
            id &&
            (await tx.equipment.count({
              where: { deliveryId: id, orderItemId: line.id },
            })) > item.quantity
          )
            throw new AppError(
              400,
              "Quantity cannot be less than registered serial numbers",
            );
        }
        if (id) {
          const registered = await tx.equipment.findMany({
            where: { deliveryId: id },
          });
          if (
            registered.some(
              (e) => !items.some((i) => i.orderItemId === e.orderItemId),
            )
          )
            throw new AppError(
              400,
              "Cannot remove an item with registered equipment",
            );
        }
        if (data.confirmed && !data.actualDate)
          throw new AppError(
            400,
            "Confirmed delivery requires its actual delivery date",
          );
        if (
          data.actualDate &&
          data.dispatchDate &&
          data.actualDate < data.dispatchDate
        )
          throw new AppError(400, "Delivery cannot precede dispatch");
        if (
          id &&
          (await tx.warranty.count({
            where: { equipment: { deliveryId: id } },
          }))
        )
          throw new AppError(
            400,
            "Delivery is locked after warranty registration",
          );
        if (data.items)
          data.items = { ...(id ? { deleteMany: {} } : {}), create: items };
      }
      if (name === "equipment") {
        const delivery = await tx.delivery.findUnique({
          where: { id: String(data.deliveryId) },
          include: { items: true, order: true },
        });
        const item = delivery?.items.find(
          (i) => i.orderItemId === data.orderItemId,
        );
        if (
          !delivery ||
          !delivery.confirmed ||
          !item ||
          delivery.orderId !== data.orderId ||
          delivery.order.customerId !== data.customerId
        )
          throw new AppError(
            400,
            "Equipment must match a confirmed delivery, order item and customer",
          );
        if (
          (await tx.equipment.count({
            where: { deliveryId: delivery.id, orderItemId: item.orderItemId },
          })) >= item.quantity
        )
          throw new AppError(
            400,
            "All delivered units already have serial numbers",
          );
      }
      if (name === "installations") {
        const equipment = await tx.equipment.findUnique({
          where: { id: String(data.equipmentId) },
          include: { delivery: true },
        });
        if (!equipment) throw new AppError(400, "Equipment not found");
        if (id && old?.equipmentId !== data.equipmentId)
          throw new AppError(400, "Installation cannot be reassigned");
        if (
          await tx.warranty.count({
            where: { equipmentId: String(data.equipmentId) },
          })
        )
          throw new AppError(
            400,
            "Contract dates are locked after warranty registration",
          );
        const dates = [
          equipment.delivery.actualDate,
          data.installationDate,
          data.commissioningDate,
          data.acceptanceDate,
        ].filter(Boolean) as Date[];
        if (dates.some((v, i) => i > 0 && v < dates[i - 1]))
          throw new AppError(
            400,
            "Installation, commissioning and acceptance dates must follow delivery in order",
          );
        if (
          ["INSTALLED", "COMMISSIONED", "ACCEPTED"].includes(
            String(data.status),
          ) &&
          !data.installationDate
        )
          throw new AppError(400, "Installation date is required");
        if (
          ["COMMISSIONED", "ACCEPTED"].includes(String(data.status)) &&
          !data.commissioningDate
        )
          throw new AppError(400, "Commissioning date is required");
        if (data.status === "ACCEPTED" && !data.acceptanceDate)
          throw new AppError(400, "Acceptance date is required");
      }
      if (name === "warranties") {
        const equipment = await tx.equipment.findUnique({
          where: { id: String(data.equipmentId) },
          include: { delivery: true, installation: true },
        });
        if (!equipment) throw new AppError(400, "Equipment not found");
        const basis = String(data.commencement);
        const start =
          basis === "DELIVERY"
            ? equipment.delivery.actualDate
            : basis === "INSTALLATION"
              ? equipment.installation?.installationDate
              : basis === "COMMISSIONING"
                ? equipment.installation?.commissioningDate
                : equipment.installation?.acceptanceDate;
        if (!start)
          throw new AppError(
            400,
            "Confirm the contractual commencement event first",
          );
        data.startDate = start;
        data.endDate = addMonths(start, Number(data.durationMonths));
        if (
          await tx.warranty.count({
            where: { equipmentId: equipment.id, endDate: { gte: start } },
          })
        )
          throw new AppError(
            400,
            "An overlapping warranty already exists for this equipment",
          );
      }
      if (name === "amcs") {
        if ((data.endDate as Date) <= (data.startDate as Date))
          throw new AppError(400, "Contract end must follow its start");
        if (
          data.nextServiceDate &&
          ((data.nextServiceDate as Date) < (data.startDate as Date) ||
            (data.nextServiceDate as Date) > (data.endDate as Date))
        )
          throw new AppError(400, "Next service must fall within the contract");
        const ids = data.equipmentIds as string[];
        delete data.equipmentIds;
        if (
          new Set(ids).size !== ids.length ||
          (await tx.equipment.count({
            where: { id: { in: ids }, customerId: String(data.customerId) },
          })) !== ids.length
        )
          throw new AppError(
            400,
            "All covered devices must belong to the contract customer",
          );
        if (data.renewedFromId) {
          const prev = await tx.amcContract.findUnique({
            where: { id: String(data.renewedFromId) },
          });
          if (
            !prev ||
            prev.customerId !== data.customerId ||
            (data.startDate as Date) <= prev.endDate
          )
            throw new AppError(
              400,
              "Renewal must follow the previous contract for the same customer",
            );
        }
        data.equipment = {
          ...(id ? { deleteMany: {} } : {}),
          create: ids.map((equipmentId) => ({ equipmentId })),
        };
      }
      if (name === "visits") {
        const contract = await tx.amcContract.findUnique({
          where: { id: String(data.amcId) },
        });
        if (
          !contract ||
          (data.scheduledDate as Date) < contract.startDate ||
          (data.scheduledDate as Date) > contract.endDate
        )
          throw new AppError(400, "Service date must be within its contract");
        if (data.status === "COMPLETED" && !data.completedDate)
          throw new AppError(400, "Completed date is required");
        if (
          data.completedDate &&
          (data.completedDate as Date) < (data.scheduledDate as Date)
        )
          throw new AppError(
            400,
            "Completion cannot precede the scheduled visit",
          );
        if (data.status === "COMPLETED") {
          const next = addMonths(
            data.completedDate as Date,
            contract.serviceFrequencyMonths,
          );
          await tx.amcContract.update({
            where: { id: contract.id },
            data: { nextServiceDate: next <= contract.endDate ? next : null },
          });
        }
      }
      if (name === "invoices") {
        const order = await tx.purchaseOrder.findUnique({
          where: { id: String(data.orderId) },
        });
        if (
          !order ||
          order.customerId !== data.customerId ||
          !order.confirmed ||
          order.status === "CANCELLED"
        )
          throw new AppError(
            400,
            "Invoice must match a confirmed order and customer",
          );
        const total =
          cents(String(data.amount)) + cents(String(data.taxAmount));
        if (total <= 0n)
          throw new AppError(400, "Invoice total must be positive");
        const sum = await tx.invoice.aggregate({
          where: { orderId: order.id },
          _sum: { total: true },
        });
        if (
          cents(String(sum._sum.total ?? 0)) + total >
          cents(String(order.total))
        )
          throw new AppError(
            400,
            "Invoicing exceeds the official purchase order total",
          );
        data.total = money(total);
        data.dueDate = addDays(
          data.invoiceDate as Date,
          Number(data.paymentTermDays),
        );
      }
      if (name === "payments") {
        const invoice = await tx.invoice.findUnique({
          where: { id: String(data.invoiceId) },
          include: { payments: true },
        });
        if (!invoice) throw new AppError(400, "Invoice not found");
        const paid = invoice.payments.reduce(
          (s, p) => s + cents(String(p.amount)),
          0n,
        );
        if (paid + cents(String(data.amount)) > cents(String(invoice.total)))
          throw new AppError(
            400,
            "Receipt exceeds the outstanding invoice balance",
          );
        if ((data.paymentDate as Date) < invoice.invoiceDate)
          throw new AppError(400, "Payment date cannot precede its invoice");
      }
      let record: Record<string, unknown>;
      if (name === "company") {
        const company = await tx.companyProfile.findFirst();
        record = company
          ? await d.update({ where: { id: company.id }, data })
          : await d.create({ data });
        await tx.tender.updateMany({
          where: { reviewedAt: { not: null } },
          data: { reviewedAt: null, reviewedBy: null },
        });
        await tx.generatedDocument.updateMany({
          data: { reviewedAt: null, reviewedBy: null },
        });
      } else
        record = existingId
          ? await d.update({
              where: { id: existingId },
              data,
              include: resources[name].include,
            })
          : await d.create({ data, include: resources[name].include });
      const recordId = String(record.id);
      if (name === "tenders" && old?.status !== record.status)
        await tx.tenderStatusHistory.create({
          data: {
            tenderId: recordId,
            fromStatus: (old?.status ??
              null) as Prisma.TenderStatusHistoryCreateInput["fromStatus"],
            toStatus:
              record.status as Prisma.TenderStatusHistoryCreateInput["toStatus"],
            changedBy: user.id,
          },
        });
      if (name === "warranties")
        await tx.warrantyHistory.create({
          data: {
            warrantyId: recordId,
            changedBy: user.id,
            snapshot: JSON.parse(JSON.stringify(record)),
          },
        });
      if (name === "deliveries") {
        const order = await tx.purchaseOrder.findUniqueOrThrow({
          where: { id: String(values.orderId) },
          include: {
            items: {
              include: { deliveryItems: { include: { delivery: true } } },
            },
          },
        });
        const delivered = order.items.reduce(
          (s, i) =>
            s +
            i.deliveryItems
              .filter((d) => d.delivery.confirmed)
              .reduce((q, d) => q + d.quantity, 0),
          0,
        );
        const ordered = order.items.reduce((s, i) => s + i.quantity, 0);
        await tx.purchaseOrder.update({
          where: { id: order.id },
          data: {
            status:
              delivered >= ordered
                ? "DELIVERED"
                : delivered > 0
                  ? "PARTIALLY_DELIVERED"
                  : "PROCESSING",
          },
        });
      }
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: existingId ? "UPDATE" : "CREATE",
          module: name,
          recordId,
          details: {},
        },
      });
      if (name === "users") {
        const { passwordHash: _, ...safe } = record;
        void _;
        return safe;
      }
      return record;
    },
    { isolationLevel: "Serializable", timeout: 15000 },
  );
}
