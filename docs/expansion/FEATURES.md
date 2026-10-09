# MedOps expansion features and operating limits

All business workflows remain manual and database-backed. Optional providers do not gate the business lifecycle. No external LLM processing was added to these features. The separate Tender Tracker supports an optional, employee-confirmed discovery import; it shares no business database or document store with MedOps.

## Commercial and controls

- Incomplete manual tenders, original dates and provenance; immutable Go/No-Go decision history.
- Manufacturer contacts, manual and tender-linked RFQs, actual sent/received dates, follow-ups and private RFQ letters.
- Immutable quotation revisions, latest-version revision safeguards, actual cost components and final manufacturer prices.
- Neutral comparisons using exact decimal money, explicit selling assumptions and recorded win/loss information.
- Securities/EMD/PBG dates, refund status, blocked totals and expiry/refund reminders.
- Standard and custom bid checklist items with actual completion status.
- Human approvals with configured role, assigned approver, self-approval prevention, source-version checks and event history.
- Explicit email abstraction and manual email/WhatsApp links. Email sending is unavailable until a verified sender and credentials are configured. No automatic messages or document transmission.

## Installed base, service and growth

- Standalone historical equipment registration for administrators; ordinary registrations retain confirmed-delivery quantity checks.
- Installation/commissioning/acceptance dates and contractual warranty calculation, month-end clamping, warranty type and non-overlap checks.
- Equipment history, actual coverage, tickets, assignment, visit scheduling, resolution and closure.
- Configurable SLA targets, actual response/resolution metrics and a protected SLA export.
- Mobile engineer home, actual work/acknowledgement and private service reports/photos.
- Installable online PWA and explicit temporary drafts in the current tab. Drafts expire after 24 hours and clear on sign-out; there is no offline caching of business registers or automatic offline synchronization.
- Exact stock balances from immutable atomic transactions: stock in/out, reserve/release, service use, returns and authorized adjustments. Explicit administrator confirmation is required for negative stock adjustments.
- Deterministic AMC opportunities from actual warranty/AMC dates; adequate current/future coverage retires generated open opportunities. No invented values/probabilities.
- Administrator-approved consumable compatibility and manually managed consumable opportunities.

## CRM and financial operations

- Customer contacts, actual employee interactions, linked-record checks, next follow-ups and a permission-aware customer history.
- Human-managed sales pipeline, nullable estimated values and probabilities, expected closing dates and employee assignments.
- Competitor directory and actual tender-result/customer/category associations. Unknown prices remain blank.
- Historical customer/manufacturer/product/order/AMC/invoice/payment/service records retain original dates. Historical standalone invoices do not require fictional purchase orders; normal invoices require a confirmed order.
- Immutable original invoices/payments plus confirmed, reasoned credit/debit notes and partial payment reversals. Corrections cannot create negative base/tax balances, overpayments or exceed original receipts/order caps.
- Corrected receivables in invoice details, dashboard, aging, reminders, document generation and accounting interchange.
- Manually entered actual operational costs by customer, manufacturer, product, tender, order, delivery, installation or ticket; service/post-sale flags.
- Operational contribution by order/customer/manufacturer/product/category/month. Entity groups use saved IDs, so separate customers/products sharing a name retain separate totals. Contribution and margin require permission to both cost and invoice sources. Revenue excludes invoice tax; enter recoverable-tax-exclusive costs for a comparable margin. Mixed or missing product/manufacturer links remain unallocated. This does not replace statutory accounting.
- Manufacturer/product/customer performance from saved links. Product identity can be linked on tender/order items and carried into equipment. No fuzzy guesses or invented allocations. Historic lines without product IDs remain unallocated until a permitted manual correction is possible.

## Productivity, reporting and privacy

- Executive dashboard with permission-filtered opportunity, commercial, operational, finance, service and growth metrics.
- Grouped global search with Cmd/Ctrl+K, record deep links, bounded results and underlying register authorization.
- Today’s Brief with real deadlines, missing decisions/checklist/compliance, RFQ follow-ups, quote expiry, security refunds, deliveries/installations, critical/parts-waiting tickets, visits, low stock, opportunities, unpaid invoices and tasks. Module/employee/priority filters; India calendar day for visits/tasks.
- Date/status/customer/manufacturer/product/employee filters where supported by each register; CSV/Excel export, linked IDs and spreadsheet-formula protection.
- Accounting interchange for customers, orders, invoices, payments and corrections. Tally/Zoho connector availability is explicitly false until a documented connector is implemented/configured.
- Controlled CSV/single-sheet XLSX historical imports for customers/manufacturers/products/equipment/warranty/AMC/invoices/payments/parts: mapping, rollback-only validation preview, explicit confirmation, duplicate rejection, revalidation and saved per-row success/error results. Partial success is reported; repeats return the saved report. A stopped run can resume after its processing lease expires, before the 24-hour preview expiry.
- Imports are administrator-only, limited to 100 rows/4 MB and existing linked IDs. Dates use valid `YYYY-MM-DD` values; timestamps require ISO format with `Z` or an explicit offset. Impossible dates are rejected before JavaScript can normalize them. Formula/hyperlink/error Excel cells are rejected; invalid rows are never silently discarded. Cross-row dependencies must be imported in separate reviewed batches. Expired previews are scrubbed during reminders.
- Private OCR abstraction and a self-hostable Tesseract/Poppler worker. Selectable-PDF extraction remains available. Scanned OCR is disabled on Vercel until an approved HTTPS private worker/token is configured. No OCR SaaS or LLM. Output is labelled **Unverified extracted text**, and never updates records automatically. The worker engine/container requires installation on operator infrastructure; live OCR is not claimed when unavailable.
- New action permissions for tender submission, ticket assignment/resolution, inventory reserve/issue, security refund and exports, alongside existing module/pricing/approval/financial-adjustment permissions. Server enforcement; safe audit summaries contain field names/statuses, never secrets, document contents or prompts.
- Reminders have deterministic identifiers, priority, reminder date, read/dismiss/completed states and obsolete-reminder retirement.
- Grouped collapsible navigation retains the existing design. Private file downloads, server-side sessions, CSRF checks, private object storage, TLS PostgreSQL, encrypted pre-release database backups and documented object backup/restore procedures remain in place.

## Boundaries

Registers are paginated. Search returns at most 8 matches per entity; customer history and daily actions are bounded to 500 records per section/register. Financial/performance reports reject more than 10,000 rows per source register; exports reject more than 5,000 and ask for narrower filters. Data volumes and deployment function budgets should be reviewed before enterprise-scale onboarding.

Average payment delay excludes reversed receipts and uses actual recorded payment dates. Contribution and aging use lifetime corrections/receipts for the selected invoices; date filters select each register by its event date, not a historical as-of accounting ledger. Month cash metrics include receipt reversals recorded in that month.

Configured human approvals retain their reviewed source version. They are a tracked workflow; configurable policies determine approver roles/self-approval behavior. They are not an undocumented substitute for the separate tender document-review gate.

Synthetic write acceptance runs only against local `medops_test`. Production verification uses live login/read screens, authorization denial, exports, reminders, session revocation and temporary private-object probes, without fictional business records. Email/OCR/accounting integrations, off-site backup scheduling/retention/key custody and a full restoration drill require operator configuration. A local backup file alone is not independent disaster recovery.
