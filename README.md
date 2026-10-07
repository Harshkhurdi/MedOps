# MedOps

Private medical equipment dealership operations: tender documentation → official purchase orders → partial deliveries and serials → installation and contractual warranties → AMC/service visits → invoices and partial receipts.

**Core workflows never depend on AI.** Optional OpenRouter assistance processes only text an employee explicitly enters and approves for each request. Stored documents and business records are never attached. AI starts disabled, with no key stored in the database or browser. No company-data telemetry, third-party analytics, external conversion service, or public document storage exists. GeM Tracker is a separate application and is neither modified nor integrated.

## Stack and organization

Next.js 16 App Router, TypeScript, Material UI, server-side Route Handlers, PostgreSQL, Prisma 7, Zod, database sessions, private Vercel Blob, DOCX, ExcelJS, native PDF rendering, Vitest and Playwright.

- `src/app`: protected pages and authenticated APIs
- `src/components`: reusable employee forms, tables, dashboard and generation preview
- `src/lib/service.ts`: transactional business rules
- `src/lib/auth.ts`: authentication, CSRF and server permissions
- `src/lib/storage.ts`: private local development / private Blob production adapter
- `src/lib/documents.ts`: deterministic document generation
- `src/lib/reminders.ts`: idempotent per-employee notifications
- `prisma`: relational schema and versioned SQL migrations
- `tests`: unit/document tests, real PostgreSQL integration and browser workflow
- `docs`: security, backup and deployment procedures

## Local setup

Use Node.js 24 LTS and PostgreSQL 18. Never reuse a production database for testing.

```sh
npm ci
cp .env.example .env
# Set DATABASE_URL and DIRECT_URL for your local database; APP_URL=http://localhost:3000.
npm run db:generate
npm run db:migrate
npm run admin:create
npm run db:seed
npm run dev
```

`admin:create` accepts email/name/password through stdin in a private terminal; no credentials are hardcoded or passed in command arguments. Passwords must contain at least 12 characters. There is no public registration or default account. The optional seed adds only the seven specified manufacturer names, never sample tenders, customers or financial records.

Alternatively use Docker Compose (development):

```sh
export LOCAL_DB_PASSWORD='choose-a-local-only-password'
docker compose up --build -d
docker compose exec app npm run admin:create
docker compose exec app npm run db:seed
```

PostgreSQL listens only on loopback port 5433; the app uses port 3000. Database and private files have separate persistent volumes. Do not run `docker compose down -v` against data you need. Docker is optional if PostgreSQL is installed locally.

## First employee workflow

1. Save Company profile, including actual signatory/declarations. Upload logo/letterhead as company documents and associate their file IDs through the profile form.
2. Add customers, manufacturers and products. Settings → initialize standard templates creates drafts only. An administrator reviews and approves each template.
3. Create a tender and one or more equipment items. Store a GeM URL, fetch public metadata where allowed, or upload a PDF and extract selectable text. All important details remain employee-confirmed.
4. Add technical requirements, actual manufacturer specifications and evidence. The default compliance decision is Requires Review; the application never invents compliance.
5. Select an approved template in Document generator. Load saved information, preview/edit placeholders, generate DOCX/PDF/XLSX or a per-template ZIP, download and mark each draft reviewed in Draft history.
6. Build a complete tender ZIP containing the latest reviewed individual drafts, tender sources, compliance evidence and selected company documents. Review the package, then approve the bid workspace before choosing Ready for Submission.
7. Mark a won tender Won. Select it when creating an order to reuse customer/equipment information. Enter the actual PO number/prices, upload the official PO, then confirm details. MedOps never fabricates an official purchase order.
8. Create partial dispatches against order line items; confirm actual receipts. Register one unique serial per delivered unit, then installation, commissioning and acceptance dates.
9. Register warranty commencement from the actual contractual delivery/installation/commissioning/acceptance event. Month-end anniversaries clamp to the last day of the target month. Each warranty is retained historically.
10. Create AMC contracts covering multiple customer devices. Record service visits, complaints and reports. Completing a visit calculates the next service; a renewed contract retains its predecessor reference.
11. Create invoices for the matching customer/order. Totals, due dates and outstanding balances are calculated server-side. Record separate partial receipts and follow-ups. Overpayments and excess invoicing are blocked.
12. View database-derived dashboard totals, deadlines and notifications. Empty databases show empty states without invented statistics.

All major record lists support search, status filtering where applicable, chronological sorting and pagination. Display currency is INR and dates use India formatting; timezone is Asia/Kolkata. Commercial order lines are locked after dispatch/invoicing, while status/notes can still be updated. Recorded invoices, receipts, serials and warranty periods are immutable historical records: an accounting correction/adjustment workflow is outside Version 1, rather than silently rewriting financial history.

## Environment variables

Never commit `.env`, `.env.local`, `.env.production`, `.env.admin`, Vercel tokens, passwords, backups or company documents. `.gitignore` and `.dockerignore` exclude them. None of the following may use a `NEXT_PUBLIC_` prefix.

| Variable                     | Purpose                                                                                          |
| ---------------------------- | ------------------------------------------------------------------------------------------------ |
| `DATABASE_URL`               | Runtime pooled PostgreSQL connection. Production TLS mode must be require/verify-ca/verify-full. |
| `DIRECT_URL`                 | Direct PostgreSQL URL for safe release migrations.                                               |
| `APP_URL`                    | Exact browser origin allowed for state-changing requests; production HTTPS URL.                  |
| `STORAGE_DRIVER`             | `local` only for local development; `blob` in Vercel.                                            |
| `BLOB_READ_WRITE_TOKEN`      | Server-only token for a **private** Blob store.                                                  |
| `LOCAL_STORAGE_PATH`         | Private local directory outside public assets; ignored. Not used in Vercel.                      |
| `CRON_SECRET`                | Strong bearer secret for scheduled reminder checks.                                              |
| `NEXT_TELEMETRY_DISABLED`    | Set to `1` for development, build and deployment.                                                |
| `CHECKPOINT_DISABLE`         | Set to `1` to disable Prisma CLI update checking.                                                |
| `PRISMA_HIDE_UPDATE_MESSAGE` | Set to `1` to suppress update messaging.                                                         |
| `SHADOW_DATABASE_URL`        | Optional isolated local DB for migration diff validation; never a production DB.                 |

## Validation

```sh
npm run typecheck
npm run lint
npm test
npm run db:validate
npm run build
```

For PostgreSQL integration and Playwright, create an isolated **local** database named `medops_test`, apply migrations to it, then run tests. `tests/setup.ts` derives the connection user/port from the local DATABASE_URL and forces the database name to medops_test; it refuses remote hosts. Integration setup truncates test tables. Never point these tests at real business data.

```sh
# Set DATABASE_URL and DIRECT_URL temporarily to your local medops_test connection.
npm run db:migrate
npm run test:integration
npx playwright install chromium
npm run test:e2e
```

The browser test signs in, creates a tender through the UI, then exercises order confirmation, private uploads/downloads, local PDF extraction, document generation/review, partial delivery, serials, installations, warranty, AMC, invoices/receipts and notifications through authenticated APIs. It checks denied unauthenticated and restricted-employee access, linked-price redaction, source permissions for generated history and cross-origin rejection. Synthetic records are confined to medops_test. Unit tests inspect actual DOCX XML, PDF pages, XLSX cells and ZIP members.

## Tasks, reports and exports

Tasks can be assigned to active employees, with priority, deadlines and completion tracking. Administrators see all tasks; employees see only tasks they created or were assigned. Due tasks generate scoped reminders, and obsolete reminders are cleared. View permission is sufficient to mark or dismiss your own authorized notifications.

Receivables reports require both Reports and Invoices access. Exact amounts are calculated in cents, grouped by customer ID, with five aging bands and unpaid-invoice follow-ups. No AI is used for financial calculations. Each record list exports the filtered results to Excel or CSV (maximum 5,000 rows); formula-like CSV values are neutralized and export actions audited.

Edits carry the record's `updatedAt` version in the `If-Match` header. A stale edit returns 409; a PATCH without a version returns 428. Close/reload the form before retrying. Read-only identification lookups allow permitted downstream workflows to select linked records without exposing prices or financial terms. Selected items are retained while searching. My account allows a rate-limited password change, which revokes every existing session.

## Optional OpenRouter AI

The user explicitly authorized this optional feature after the original AI-free release. It is restricted to **only text explicitly entered/pasted**, with no database/document context, uploads, autonomous actions or automatic business-record changes. The full app remains usable when AI is disabled, unconfigured, out of credit or unavailable.

Set `OPENROUTER_API_KEY` securely in Vercel's server-only environment settings. Optionally set `OPENROUTER_MODEL`; an administrator can also select the model ID in MedOps Settings. Never commit `.env.ai` or paste the key into chat. Configure a spending cap on the OpenRouter key. The administrator enables AI and grants separate View/Edit AI permissions; a key alone does not enable it.

Available assistance: letter drafts, checklists, wording improvements and explanations. Every request requires consent for the exact visible text. Editing the text or purpose clears approval. Responses are plain-text drafts for employee review, and cannot write business records or send messages. Only request hashes, character counts, status and returned usage/cost metadata are retained. No prompts/answers are saved. Daily limits follow India time, reservations are transactional, simultaneous requests are blocked, and failed attempts consume allowance conservatively. Requests are bounded to 8,000 characters, outputs to the configured token limit, and provider calls to 45 seconds, with no automatic retries.

The default provider request requires `data_collection: "deny"`, `zdr: true` and `allow_fallbacks: false`. Ineligible models/providers fail rather than silently relaxing privacy. This is external processing of the text the employee approves, not a promise that data stays in your network. Review [OpenRouter privacy controls](https://openrouter.ai/docs/guides/get-started/sovereign-ai).

The selected `nvidia/nemotron-3-ultra-550b-a55b:free` endpoint does **not** support this zero-retention mode: [NVIDIA's published notice](https://openrouter.ai/nvidia/nemotron-3-ultra-550b-a55b:free) says submitted text is logged for security/product improvement and prohibits confidential/personal information. Only after the account owner explicitly accepts that tradeoff may the operator set `OPENROUTER_ALLOW_PROVIDER_LOGGING=true`. This exception is restricted to that exact model and the Nvidia provider, with no fallback. MedOps displays the logging warning and requires a separate non-confidential confirmation on each request; both confirmations reset when text changes or after submission. The server rejects requests without it. This is a user attestation, not automatic confidential-data detection. Other models retain strict privacy routing. Keep this flag false unless approved. Free provider rate limits and availability still apply.

A normal logged-in Codex session is not used as a hosted-app credential. OpenAI's [ChatGPT plan usage documentation](https://developers.openai.com/siwc/token-sharing-open-source) covers local/open-source clients and directs remotely hosted applications to a separate approved integration. OpenRouter is the implemented provider for this hosted application.

## Vercel deployment

See [deployment procedure](docs/DEPLOYMENT.md). Use the `medops` project connected to `Harshkhurdi/MedOps`; production tracks `main`. Provision a separate managed PostgreSQL database and **private** Vercel Blob store. Do not reuse GeM Tracker resources. Set environment secrets using Vercel's environment management, apply committed production migrations in a controlled release step, and deploy only after local checks pass. No production sample-business seeding occurs.

`vercel.json` runs daily authenticated reminders at 03:30 UTC (09:00 Asia/Kolkata). Administrators can trigger the same check in Settings. Only employees with access to a reminder's business module receive it. Reminder keys prevent repeated duplicate notifications.

## Privacy, backups and known boundaries

See [security](docs/SECURITY.md) and [backup/recovery](docs/BACKUP.md).

- Uploads: allowlisted PDF/DOCX/XLSX/PNG/JPEG, signature/type validation, 4 MB per upload. ZIP output is bounded to 32 MB. Authentication and module authorization protect downloads; object-storage keys/tokens are never returned to the browser.
- Uploaded files are retained as versioned immutable objects. PDFs/images can be previewed through the authenticated download route. Files are never executed. This application is not an antivirus service; organizational malware scanning can be added within controlled infrastructure.
- PDF text extraction handles selectable text only and requires review; no OCR/AI or captcha bypass. Public GeM metadata retrieval is limited to official HTTPS hosts with no redirects/authentication and falls back to manual entry.
- DOCX templates are maintained as approved text with placeholders and rendered to real DOCX. Native PDFs are generated directly, not converted by a remote service. Native PDF currently supports Latin text; Unicode DOCX remains available. Uploaded logo/letterhead files are retained and selectable but not automatically reproduced as complex Word/PDF stationery layouts.
- A per-template ZIP contains DOCX/PDF/compliance XLSX. Complete tender packages include reviewed individual drafts and selected source evidence. Employee review remains necessary for portal-specific checklist completeness and signature/authorization validity.
- Email sending, scanned OCR and direct accounting connectors require the optional configuration described in the expansion guide. Financial corrections and CSV/Excel accounting interchange are implemented. OpenRouter credentials are server-only environment secrets; the database stores only request metadata, never prompt or response text.
- Dependency audit may report an upstream development-only `braces`/lint-tool advisory without an available patched release. Production request processing does not run glob expansion from user input. Patched overrides are applied to the available transitive fixes; do not use `npm audit fix --force` to downgrade core frameworks.
- Backup retention/off-site copies and real-document production acceptance require the company's operator. A deployment alone does not prove backups or business-specific template compliance.

### Commercial expansion (Phase A)

Manual incomplete tenders, confirmed Go/No-Go decisions with history, multiple manufacturer contacts, standalone or tender/customer RFQs, manual sending and follow-ups, private source quotation uploads, immutable quotation revisions, exact commercial assumptions and neutral comparisons, and actual win/loss results are available. RFQ letters use approved templates for real DOCX/PDF generation. Quote, comparison and result access additionally requires the Pricing permission. Historical RFQ/quote/result entry requires an administrator. No external AI processing or automatic messages are added. See `docs/expansion/PROGRESS.md` for verification and rollout status.

### Tender controls (Phase B)

Securities/EMD/PBG support manual records, private documents, date checks, retained issued identities, actual refunds and blocked-amount totals. Bid checklists support standard starting items and custom items with explicit status and completion. Reusable approvals retain related-record versions and immutable decision events, with administrator policies for approver role and self-approval. Email has a Resend provider abstraction configured only through `EMAIL_PROVIDER`, `EMAIL_API_KEY`, `EMAIL_FROM`; it is optional, requires explicit reviewed text and has no automatic attachments. Unconfirmed sends require provider-history review before retrying. User-clicked mailto/WhatsApp links work without that provider. New reminders cover RFQs, latest quote validity, securities and submitted approvals.

### Installed base and service (Phase C)

Administrators can register historical devices without recreating old orders or deliveries. Optional supplied links still match the actual customer; ordinary received-unit registration retains confirmed-delivery and quantity checks. Warranties support an explicit contract date and actual type; historical records may retain original start/end dates. Service tickets, engineer visits, photographs/files, customer acknowledgement, real service reports and optional SLA rules are available. Installed equipment shows its contracts, visits, service and parts history. Spare parts use an immutable transaction ledger with atomic balance updates, protected unit cost, reservations, service consumption, adjustment permission and explicit administrator confirmation for negative adjustments. AMC opportunities use actual warranty/contract dates and never invent value; generated opportunities are retired when actual coverage removes their trigger. Consumable compatibility is explicitly administered. Engineer home is responsive with a PWA manifest and tab-scoped temporary drafts, cleared at sign-out; there is no offline business-record caching or synchronization.

## Productivity, CRM and revenue expansion

The complete manual commercial/service lifecycle now includes CRM contacts and interactions, human sales pipeline, competitors, actual operational costs, audited invoice credit/debit notes and receipt reversals, product/manufacturer/customer performance, executive metrics, Today’s Brief, Cmd/Ctrl+K search, controlled historical CSV/Excel imports and accounting interchange. See the comprehensive [feature guide and operating limits](docs/expansion/FEATURES.md), [private OCR setup](docs/expansion/PRIVATE_OCR.md) and [verification progress](docs/expansion/PROGRESS.md).

Scanned OCR remains unavailable until a private worker is configured; selectable-PDF extraction and manual entry work independently. Tally/Zoho synchronization is unavailable; CSV/Excel interchange is real. Email remains optional and requires configured credentials/sender verification. The PWA is online; temporary tab drafts are explicit and are cleared on sign-out. AI remains disabled by default and no business record/document is sent automatically to any LLM.

New employees need explicit action permissions for tender submission, ticket assignment/resolution, stock reservation/issue, security refunds and exports, in addition to register permissions. Normal invoices remain tied to confirmed orders; administrators may enter actual historical standalone invoices and original due dates. Financial corrections preserve originals and affect all balance calculations.

Expansion acceptance on 7 October 2026: **86 tests passed (44 unit/document, 34 PostgreSQL integration, 8 browser/API); zero failed**. TypeScript, ESLint, schema validation, clean migration replay/diff and the production build passed. The live application passed login, protected screens/APIs, exports, database/private-storage, reminder and access-denial checks. Synthetic write acceptance uses only the isolated local test database; optional OCR/email/accounting services and off-site recovery procedures have the operating limits documented in the feature guide.

### Tender Tracker discovery handoff

This release preserves the independently usable manual tender and operations workflows. Tender Tracker is a separate application, repository, deployment and datastore. It sends only explicitly selected public discovery information to `POST /api/integrations/tender-tracker/import`; it cannot read MedOps business records. No document bytes, company documents, pricing decisions or AI calls are part of the integration.

Private server environment settings: `TENDER_TRACKER_INTEGRATION_SECRET` (at least 32 random characters, shared only with Tracker's server), `TENDER_TRACKER_URL` (origin), and `INTEGRATION_ENVIRONMENT` (`production`, `preview` or `development`). Existing `APP_URL` must be an origin. Production requires HTTPS; development requires local origins, and Vercel environments must match. Never configure production credentials in previews or use `NEXT_PUBLIC_` for secrets.

Employees connect through their existing MedOps login and tender-write permission. A 60-second single-use code is exchanged by Tracker's server for an opaque grant stored in an HttpOnly cookie. Grants expire with the original MedOps session; logout, account deactivation and permission removal revoke import access. Each server request has an HMAC-SHA256 signature over timestamp, environment, method, path and exact body. Signatures expire after 60 seconds; signed retries remain safe through database uniqueness and transactional idempotency. Database-backed per-minute limits apply to connection and import operations.

New tenders are **Pending Review** (existing `UNDER_REVIEW` stage plus a `PENDING_REVIEW` decision). Import chooses no product/manufacturer/model, prices, RFQs, approvals or orders. Known quantities on selected source lines become TenderItems. Unknown quantities remain in the complete source snapshot until the employee enters a reviewed quantity. Individual item categories and source references are preserved. Institution discovery text stays separate from the employee-selected customer account.

The database enforces source/external-ID uniqueness. Imports also check the existing tender number, bid number and source URL; ambiguous canonical matches require administrator review. Every source revision is retained with its observation timestamp, source update time, original references and a content fingerprint. A repeated observation creates no duplicate tender/version. Employee values are never silently overwritten. In a tender's details, review old and new values, explicitly accept selected fields/items or keep current MedOps values. Source review uses current-record version checks and existing business validation; it does not approve a bid package or mark Pursue. Any existing order restriction still applies.

Administrator Settings reports only configured status, environment, last successful/failed import and a fixed sanitized reason. Import, repeat, source update, employee review and authenticated failure events are audited without tokens, authorization headers or request text. Receipts returned to Tracker contain only MedOps ID, application link and import status. Discovery continues even if MedOps is unavailable. All original manual workflows remain available when this integration is unconfigured.

Migration `20261007230000_tender_tracker` is additive. Back up production before applying it. It adds provenance, grants, limits and health tables, plus optional tender institution and item source/category fields; it removes no existing data. Run the original regression suites plus discovery-contract, authorization, idempotency, concurrent import, employee-edit/corrigendum and full imported operations lifecycle tests before deployment. Deploy MedOps first, then configure and deploy Tracker. Use isolated local fixtures for lifecycle testing; never insert fictional commercial records into production.
