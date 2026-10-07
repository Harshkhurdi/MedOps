import { serviceConfigs } from "./service-operations";
import { controlConfigs } from "./controls";
import { commercialConfigs, historicalFields } from "./commercial-config";
export type Field = {
  key: string;
  label: string;
  type?:
    | "text"
    | "email"
    | "number"
    | "date"
    | "datetime-local"
    | "textarea"
    | "select"
    | "relation"
    | "multi"
    | "boolean"
    | "items"
    | "permissions"
    | "custom";
  required?: boolean;
  options?: readonly string[];
  source?: string;
  fields?: Field[];
  default?: unknown;
};
export type ModuleConfig = {
  title: string;
  description: string;
  fields: Field[];
  columns: string[];
  readOnly?: boolean;
  immutable?: boolean;
  createLabel?: string;
  files?: boolean;
};
const f = (
  key: string,
  label: string,
  type: Field["type"] = "text",
  required = false,
  options?: readonly string[],
  source?: string,
): Field => ({ key, label, type, required, options, source });
const rel = (key: string, label: string, source: string, required = true) =>
  f(key, label, "relation", required, undefined, source);
const notes = f("notes", "Notes", "textarea");
const tenderItems: Field[] = [
  f("equipment", "Equipment name", "text", true),
  f("model", "Model"),
  f("quantity", "Quantity", "number", true),
  rel("manufacturerId", "Manufacturer", "manufacturers", false),
];
const orderItems: Field[] = [
  ...tenderItems,
  f("unitPrice", "Unit price (INR)", "number", true),
  { ...f("taxRate", "Tax %", "number", true), default: "0" },
];
export const configs: Record<string, ModuleConfig> = {
  ...commercialConfigs,
  ...controlConfigs,
  ...serviceConfigs,
  company: {
    title: "Company profile",
    description:
      "One source for your company details and approved declarations.",
    columns: ["legalName", "gstin", "email"],
    fields: [
      f("legalName", "Legal company name", "text", true),
      f("address", "Business address", "textarea", true),
      f("gstin", "GSTIN"),
      f("pan", "PAN"),
      f("email", "Email", "email"),
      f("phone", "Phone"),
      f("signatory", "Authorized signatory"),
      f("designation", "Designation"),
      f("declarations", "Standard declarations", "textarea"),
      {
        ...f(
          "reminderDays",
          "Default reminder lead time (days)",
          "number",
          true,
        ),
        default: 30,
      },
      f("additionalFields", "Additional company fields", "custom"),
      rel("logoFileId", "Company logo file", "files", false),
      rel("letterheadFileId", "Approved letterhead file", "files", false),
    ],
  },
  customers: {
    title: "Customers",
    description:
      "Institutions, contacts and addresses shared across your workflow.",
    columns: ["name", "institutionType", "state", "email"],
    fields: [
      f("name", "Institution name", "text", true),
      f("institutionType", "Institution type"),
      f("address", "Address", "textarea"),
      f("state", "State"),
      f("contactName", "Contact person"),
      f("email", "Email", "email"),
      f("phone", "Phone"),
      notes,
    ],
  },
  manufacturers: {
    title: "Manufacturers",
    description: "Manufacturer contacts and approved product information.",
    columns: ["name", "contactName", "email", "phone"],
    fields: [
      f("name", "Manufacturer name", "text", true),
      f("contactName", "Contact person"),
      f("email", "Email", "email"),
      f("phone", "Phone"),
      notes,
    ],
  },
  products: {
    title: "Products",
    description: "Equipment models and source-backed specifications.",
    columns: ["name", "model", "manufacturer", "category"],
    fields: [
      f("name", "Product name", "text", true),
      f("model", "Model", "text", true),
      f("category", "Equipment category"),
      rel("manufacturerId", "Manufacturer", "manufacturers"),
      f("specifications", "Manufacturer specifications", "textarea"),
    ],
  },
  documents: {
    title: "Company documents",
    description:
      "Private certificates, datasheets and declarations. Every replacement is retained.",
    columns: ["name", "category", "expiryDate", "active"],
    files: true,
    fields: [
      f("name", "Document name", "text", true),
      f("category", "Category", "select", true, [
        "GST_CERTIFICATE",
        "PAN",
        "REGISTRATION",
        "MANUFACTURER_AUTHORIZATION",
        "PAST_PERFORMANCE",
        "PRODUCT_DATASHEET",
        "DECLARATION",
        "LOGO",
        "LETTERHEAD",
        "OTHER",
      ]),
      f("issueDate", "Issue date", "date"),
      f("expiryDate", "Expiry date", "date"),
      rel("manufacturerId", "Manufacturer", "manufacturers", false),
      notes,
      { ...f("active", "Active", "boolean"), default: true },
    ],
  },
  tenders: {
    title: "Tenders",
    createLabel: "New Tender",
    description:
      "Manage each opportunity from initial review to a submitted, reviewed bid.",
    columns: ["number", "customer", "status", "deadline"],
    files: true,
    fields: [
      f("bidNumber", "Bid number"),
      f("title", "Tender title"),
      f("state", "State"),
      f("source", "Tender source"),
      f("sourceUrl", "Source URL"),
      f("publicationDate", "Publication date", "date"),
      ...historicalFields,
      f("number", "Tender number", "text", true),
      f("gemUrl", "GeM tender URL"),
      rel("customerId", "Procuring institution", "customers", false),
      f("category", "Equipment category"),
      f("deadline", "Submission deadline", "datetime-local"),
      f("emd", "EMD (INR)", "number"),
      f("estimatedValue", "Estimated value (INR)", "number"),
      f("warrantyTerms", "Contractual warranty requirements", "textarea"),
      f("deliveryTerms", "Delivery requirements", "textarea"),
      notes,
      {
        ...f("status", "Status", "select", true, [
          "DRAFT",
          "UNDER_REVIEW",
          "DOCUMENTS_IN_PROGRESS",
          "READY_FOR_SUBMISSION",
          "SUBMITTED",
          "WON",
          "LOST",
          "CANCELLED",
        ]),
        default: "DRAFT",
      },
      {
        key: "items",
        label: "Equipment items",
        type: "items",
        required: true,
        fields: tenderItems,
      },
    ],
  },
  requirements: {
    title: "Technical compliance",
    description:
      "Enter requirements and source specifications; confirm each decision yourself.",
    columns: ["requirement", "specification", "compliance", "tender"],
    files: true,
    fields: [
      rel("tenderId", "Tender", "tenders"),
      f("requirement", "Tender requirement", "textarea", true),
      f("specification", "Manufacturer specification", "textarea"),
      {
        ...f("compliance", "Employee compliance decision", "select", true, [
          "REQUIRES_REVIEW",
          "COMPLIES",
          "DOES_NOT_COMPLY",
        ]),
        default: "REQUIRES_REVIEW",
      },
      f("evidenceNotes", "Evidence reference and notes", "textarea"),
    ],
  },
  templates: {
    title: "Document templates",
    description:
      "An administrator must approve a template before employees can generate drafts.",
    columns: ["name", "kind", "approved", "version"],
    fields: [
      f("name", "Template name", "text", true),
      f("kind", "Document type", "select", true, [
        "RFQ_LETTER",
        "COVERING_LETTER",
        "NON_BLACKLISTING",
        "WARRANTY_UNDERTAKING",
        "AUTHORIZATION_REQUEST",
        "COMPLIANCE_STATEMENT",
        "COMPLIANCE_COMPARISON",
        "CHECKLIST",
        "DELIVERY_CHALLAN",
        "PACKING_LIST",
        "SERVICE_REPORT",
        "INSTALLATION_REPORT",
        "COMMISSIONING_REPORT",
        "HANDOVER",
        "PAYMENT_REMINDER",
        "CUSTOM",
      ]),
      f(
        "body",
        "Template text (use {{company_name}}, {{tender_number}} and other placeholders)",
        "textarea",
        true,
      ),
      f("approved", "Approved for generation", "boolean"),
    ],
  },
  orders: {
    title: "Purchase orders",
    description:
      "Record the official customer order, upload it, then confirm its details.",
    columns: ["number", "customer", "status", "total", "deliveryDeadline"],
    files: true,
    fields: [
      f("number", "Official PO number", "text", true),
      rel("tenderId", "Won tender (optional)", "tenders", false),
      rel("customerId", "Customer", "customers"),
      f("poDate", "PO date", "date", true),
      f("deliveryDeadline", "Delivery deadline", "date"),
      f("paymentTerms", "Payment terms", "textarea"),
      notes,
      {
        ...f("status", "Status", "select", true, [
          "ORDER_RECEIVED",
          "MANUFACTURER_ORDER_PENDING",
          "MANUFACTURER_ORDER_PLACED",
          "PROCESSING",
          "READY_FOR_DISPATCH",
          "PARTIALLY_DELIVERED",
          "DELIVERED",
          "COMPLETED",
          "CANCELLED",
        ]),
        default: "ORDER_RECEIVED",
      },
      f("confirmed", "Official PO uploaded and details confirmed", "boolean"),
      {
        key: "items",
        label: "Order items",
        type: "items",
        required: true,
        fields: orderItems,
      },
    ],
  },
  deliveries: {
    title: "Deliveries & dispatch",
    description:
      "Track partial dispatches and confirmed receipts against specific order items.",
    columns: ["order", "location", "expectedDate", "actualDate", "confirmed"],
    files: true,
    fields: [
      rel("orderId", "Purchase order", "orders"),
      f("dispatchDate", "Dispatch date", "date"),
      f("transporter", "Transporter"),
      f("tracking", "Tracking or reference"),
      f("expectedDate", "Expected delivery date", "date"),
      f("actualDate", "Actual delivery date", "date"),
      f("location", "Delivery location", "text", true),
      f("confirmed", "Customer delivery confirmed", "boolean"),
      notes,
      {
        key: "items",
        label: "Dispatched items",
        type: "items",
        required: true,
        fields: [
          rel("orderItemId", "Order item", "orderItems"),
          f("quantity", "Quantity dispatched", "number", true),
        ],
      },
    ],
  },
  equipment: {
    title: "Installed base",
    createLabel: "Register Equipment",
    description:
      "Register each received unit before tracking installation, warranty or maintenance.",
    columns: ["serialNumber", "customer", "orderItem", "delivery"],
    fields: [
      f("serialNumber", "Serial number", "text", true),
      rel(
        "deliveryId",
        "Confirmed delivery (optional for historical)",
        "deliveries",
        false,
      ),
      rel(
        "orderId",
        "Purchase order (optional for historical)",
        "orders",
        false,
      ),
      rel(
        "orderItemId",
        "Order item (optional for historical)",
        "orderItems",
        false,
      ),
      rel("customerId", "Customer", "customers"),
      rel("manufacturerId", "Manufacturer", "manufacturers", false),
      rel("productId", "Saved product", "products", false),
      f("productName", "Equipment/product"),
      f("model", "Model"),
      f("location", "Hospital location"),
      f("department", "Department"),
      notes,
      ...historicalFields,
    ],
  },
  installations: {
    title: "Installations",
    description:
      "Confirm equipment installation, commissioning and customer acceptance.",
    columns: ["equipment", "status", "installationDate", "acceptanceDate"],
    fields: [
      rel("equipmentId", "Equipment serial number", "equipment"),
      {
        ...f("status", "Installation status", "select", true, [
          "PENDING",
          "PARTIAL",
          "INSTALLED",
          "COMMISSIONED",
          "ACCEPTED",
        ]),
        default: "PENDING",
      },
      f("installationDate", "Installation date", "date"),
      f("commissioningDate", "Commissioning date", "date"),
      f("acceptanceDate", "Customer acceptance date", "date"),
      notes,
      ...historicalFields,
    ],
  },
  warranties: {
    createLabel: "New Warranty",
    title: "Warranty management",
    description:
      "Expiry is calculated from the confirmed commencement event in the contract.",
    columns: [
      "equipment",
      "commencement",
      "startDate",
      "endDate",
      "durationMonths",
    ],
    files: true,
    fields: [
      { ...f("type", "Warranty type", "text", true), default: "STANDARD" },
      rel("equipmentId", "Equipment", "equipment"),
      f("commencement", "Contractual start event", "select", true, [
        "DELIVERY",
        "INSTALLATION",
        "COMMISSIONING",
        "ACCEPTANCE",
        "CONTRACT",
      ]),
      f("durationMonths", "Warranty duration (months)", "number", true),
      f("startDate", "Explicit contract / historical start date", "date"),
      f("endDate", "Historical end date (optional)", "date"),
      f("terms", "Warranty terms", "textarea", true),
      notes,
      ...historicalFields,
    ],
  },
  amcs: {
    createLabel: "New AMC",
    title: "AMC management",
    description:
      "Contracts, covered devices, preventive maintenance and renewals.",
    columns: [
      "number",
      "customer",
      "endDate",
      "nextServiceDate",
      "amount",
      "status",
    ],
    files: true,
    fields: [
      f("number", "AMC contract number", "text", true),
      rel("customerId", "Customer", "customers"),
      f("startDate", "Contract start", "date", true),
      f("endDate", "Contract end", "date", true),
      f("amount", "AMC amount (INR)", "number", true),
      f("serviceFrequencyMonths", "Service frequency (months)", "number", true),
      f("nextServiceDate", "Next scheduled service", "date"),
      f("responsibleName", "Responsible employee"),
      {
        ...f("status", "Status", "select", true, [
          "ACTIVE",
          "EXPIRED",
          "CANCELLED",
        ]),
        default: "ACTIVE",
      },
      rel("renewedFromId", "Previous AMC (renewal)", "amcs", false),
      {
        key: "equipmentIds",
        label: "Covered equipment",
        type: "multi",
        source: "equipment",
        required: true,
      },
      notes,
    ],
  },
  visits: {
    title: "Maintenance & service visits",
    description: "Plan visits, record complaints and retain service reports.",
    columns: ["amc", "scheduledDate", "completedDate", "status", "complaint"],
    files: true,
    fields: [
      rel("amcId", "AMC contract", "amcs"),
      rel("employeeId", "Assigned employee", "employees", false),
      f("scheduledDate", "Scheduled date", "date", true),
      f("completedDate", "Completed date", "date"),
      {
        ...f("status", "Service status", "select", true, [
          "SCHEDULED",
          "COMPLETED",
          "COMPLAINT",
          "CANCELLED",
        ]),
        default: "SCHEDULED",
      },
      f("complaint", "Service complaint", "textarea"),
      notes,
    ],
  },
  invoices: {
    title: "Invoices & receivables",
    description: "Track customer invoices, due dates and outstanding balances.",
    columns: ["number", "customer", "total", "dueDate", "outstanding"],
    files: true,
    fields: [
      f("number", "Invoice number", "text", true),
      rel("orderId", "Purchase order", "orders"),
      rel("customerId", "Customer", "customers"),
      f("invoiceDate", "Invoice date", "date", true),
      f("amount", "Invoice base amount (INR)", "number", true),
      { ...f("taxAmount", "Tax amount (INR)", "number", true), default: "0" },
      f("paymentTermDays", "Payment terms (days)", "number", true),
      notes,
    ],
  },
  payments: {
    title: "Payment receipts",
    description:
      "Each receipt is retained separately; overpayments are blocked.",
    columns: ["invoice", "amount", "paymentDate", "reference", "method"],
    fields: [
      rel("invoiceId", "Invoice", "invoices"),
      f("amount", "Amount received (INR)", "number", true),
      f("paymentDate", "Payment date", "date", true),
      f("reference", "Payment reference", "text", true),
      f("method", "Payment method", "select", true, [
        "BANK_TRANSFER",
        "CHEQUE",
        "CASH",
        "OTHER",
      ]),
      notes,
    ],
  },
  followups: {
    title: "Payment follow-ups",
    description:
      "Record contact history and schedule the next customer follow-up.",
    columns: ["invoice", "contactDate", "nextDate", "notes"],
    fields: [
      rel("invoiceId", "Invoice", "invoices"),
      rel("employeeId", "Responsible employee", "employees", false),
      f("contactDate", "Contact date", "date", true),
      f("nextDate", "Next follow-up date", "date"),
      f("notes", "Follow-up notes", "textarea", true),
    ],
  },
  users: {
    title: "User accounts & permissions",
    description:
      "Administrators control module access. Password changes revoke existing sessions.",
    columns: ["name", "email", "role", "active"],
    fields: [
      f("name", "Employee name", "text", true),
      f("email", "Email", "email", true),
      f("password", "New password (12+ characters)"),
      f("role", "Role", "select", true, ["EMPLOYEE", "ADMIN"]),
      { ...f("active", "Account active", "boolean"), default: true },
      f("permissions", "Module permissions", "permissions"),
    ],
  },
  tasks: {
    title: "Tasks & follow-ups",
    description:
      "Assign work, set deadlines and track completion. Employees see tasks they created or were assigned.",
    columns: ["title", "assignee", "status", "priority", "dueDate"],
    fields: [
      f("title", "Task title", "text", true),
      rel("assignedToId", "Assigned employee", "employees", false),
      f("dueDate", "Due date", "date"),
      {
        ...f("status", "Status", "select", true, [
          "OPEN",
          "IN_PROGRESS",
          "DONE",
          "CANCELLED",
        ]),
        default: "OPEN",
      },
      {
        ...f("priority", "Priority", "select", true, [
          "LOW",
          "NORMAL",
          "HIGH",
          "URGENT",
        ]),
        default: "NORMAL",
      },
      notes,
    ],
  },
  notifications: {
    title: "Notifications",
    description: "Deadlines and follow-ups assigned to you.",
    columns: ["title", "priority", "createdAt", "readAt"],
    fields: [],
    readOnly: true,
  },
  audit: {
    title: "Audit history",
    description: "Sensitive changes, file access and review decisions.",
    columns: ["action", "module", "user", "createdAt"],
    fields: [],
    readOnly: true,
  },
  generated: {
    title: "Generated document history",
    description:
      "Retained drafts and review decisions. Download and review each document.",
    columns: ["file", "format", "sourceModule", "createdAt", "reviewedAt"],
    fields: [],
    readOnly: true,
  },
};
export function label(value: unknown): string {
  if (value == null) return "—";
  if (typeof value === "object") {
    const r = value as Record<string, unknown>;
    return String(
      r.name ?? r.number ?? r.serialNumber ?? r.equipment ?? r.id ?? "—",
    );
  }
  return String(value);
}
export function pretty(value: unknown, key = ""): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (/Date$|At$|deadline|Deadline/.test(key) && typeof value === "string")
    return new Date(value).toLocaleDateString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  if (
    [
      "amount",
      "total",
      "outstanding",
      "unitPrice",
      "estimatedValue",
      "emd",
      "taxAmount",
    ].includes(key)
  )
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(Number(value));
  return label(value).replace(/_/g, " ");
}
