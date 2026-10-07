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
- Email/WhatsApp alerts, external accounting integration, financial adjustments and automatic OCR are intentionally outside Version 1. OpenRouter credentials are server-only environment secrets; the database stores only request metadata, never prompt or response text.
- Dependency audit may report an upstream development-only `braces`/lint-tool advisory without an available patched release. Production request processing does not run glob expansion from user input. Patched overrides are applied to the available transitive fixes; do not use `npm audit fix --force` to downgrade core frameworks.
- Backup retention/off-site copies and real-document production acceptance require the company's operator. A deployment alone does not prove backups or business-specific template compliance.
