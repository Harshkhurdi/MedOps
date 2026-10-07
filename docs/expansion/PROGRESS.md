# Expansion implementation and verification

Baseline: main `33c2a7445deedaf6dcead1c595e30d166b3456ee`, clean checkout, 7 October 2026. Unit/document tests 27 passed; PostgreSQL integration 3 passed; browser/API 3 passed; typecheck, ESLint, Prisma validation and production build passed. Production data and the separate Tender Tracker are excluded from test operations.

Implementation proceeds A → B → C → D → E. Each phase must pass existing and new tests, quality checks, build and smoke verification before the next phase. Stable phases are pushed normally and deployed after an encrypted backup and safe migration validation. AI stays disabled by default; no automatic LLM processing is added.

| Phase                          | Status              |
| ------------------------------ | ------------------- |
| A: Commercial tender workflow  | Verified production |
| B: Tender controls             | Verified production |
| C: Service and installed base  | Verified production |
| D: CRM and revenue             | Verified production |
| E: Productivity and management | Verified production |

Historical entry will be explicit, restricted to administrators, retain original dates/provenance and preserve relationship checks and financial safeguards. Optional integrations must fail clearly and leave manual entry available.

Phase A: 29 unit/document, 8 PostgreSQL integration and 4 browser/API tests passed (41 total, baseline 33 + 8). TypeScript, ESLint, Prisma validation and production build passed. Manual RFQ UI, immutable revisions, neutral comparison, DOCX/PDF downloads and pricing permission denial were exercised. Production verification pending.

Phase A release: `626bef78219c5b7cfd8af39861fc3af96181ff6e`, production deployment `dpl_3sg4cx36Z8h5ci5a9foC1C8ro71r`. Live login, RFQ/quote/comparison screens, empty business datasets, exports, database/private storage, public access denial, session revocation and disabled AI verified. Only synthetic local records were used for write acceptance. Encrypted production backup created; commercial migration applied safely.

Phase B: 32 unit/document, 12 integration and 5 browser/API tests passed (49 total, baseline 33 + 16). Approval decisions preserve full millisecond record versions, block stale/self/unassigned decisions, and retain event history. Security refunds/date/relationship checks, blocked-amount totals, checklist progress, deterministic reminders and disabled-provider communication were tested. Production release pending.

Phase B release: `030761045a2293a60fa6d6827165ddfbbfe63ead`, deployment `dpl_CMP32K8zaFCvaBqhRcJeV5jfDbtD`. Live securities/checklist/approval/communication screens, data/storage, exports, anonymous access denial, email unavailable status, disabled AI and no external browser traffic passed. No fictional production business records created.

Phase C: 35 unit/document, 18 integration and 6 browser/API tests passed (59 total, baseline 33 + 26). Types, ESLint, production build and migration consistency passed. Acceptance covers manual legacy equipment, explicit warranty dates/month clamping, tickets, engineer visits, draft restore, actual SLA, stock reservations/consumption/negative-adjustment authorization/concurrent issues/duplicate rollback, compatibility rules and AMC opportunity retirement under actual coverage. DOCX/PDF reports are generated and downloaded privately. PWA manifest and icons are present; online access is required and business records are not cached offline.

Phase C release: `8dba7eac52ad52e56c44944e8639c5ba12715747`, deployment `dpl_AUW2puDsvPHy9sN77ah17RpKePc1`. Live service/engineer/parts/AMC/SLA screens, login/dashboard, database and private storage, exports, reminders, public access denial, session revocation and disabled AI passed. GitHub publication initially returned HTTP500, then the normal non-force push succeeded. No fictional production business records were created.

Phases D/E: CRM, historical finance, immutable financial corrections, contribution/performance reports, executive metrics, search, daily brief, controlled imports, accounting interchange, optional private OCR, grouped navigation, safe audits and action permissions implemented. The complete manual A–E browser acceptance scenario passed locally, including product/manufacturer/customer reporting, CRM, search and daily actions. Local regression, build, migration and live deployment checks passed.

Final local expansion validation: 44 unit/document + 34 PostgreSQL integration + 8 browser/API = 86 passed, 0 failed (original baseline 33; 53 additional tests). Full lifecycle, searches for all ten required record types and due/completed daily actions were exercised. TypeScript, ESLint and Prisma validation passed. Production build passed; all ten migrations replayed successfully in a fresh isolated local database with no schema differences. Live deployment verification passed. Phases D/E share financial corrections, permission-filtered reports and import validation, and were finalized as a combined release after the earlier individually verified A/B/C releases.

D/E application release: `08d79b1b6fa47923ecbf70886517edc8d19c7d20`, production deployment `dpl_9wQN9yt6SFchmQHJHm75LNcpo65n`, READY at the stable production URL. Live login/dashboard, CRM/pipeline/competitor/cost/correction/analytics/executive/brief/import/accounting/OCR screens and protected APIs, Excel/CSV exports, actual zero balances, PostgreSQL/private Blob, anonymous/cross-origin denial, reminders and session revocation passed. Temporary private-object write/read/public-denial/delete passed. No external browser domains or fictional production business records. AI is disabled; OCR/email/direct accounting connectors are explicitly unavailable pending operator setup. Final additional acceptance verifies persisted competitor/result links, notification completion and restricted finance/profitability/export access.

Final date hardening: shared validation rejects impossible calendar dates instead of JavaScript date normalization. CSV/import preview rejects invalid historical dates without creating records; valid leap days, Date objects and explicit ISO timestamp offsets are preserved. Unit/database/browser regression passed (85 total). The original business flows continue to pass. No additional database migration is needed.

Contribution reporting hardening: customer/product/manufacturer/order grouping now uses saved record IDs, while retaining display labels and unallocated groups. Separate customers/products with identical names retain distinct revenue, costs and margins. Contribution/margin requires access to both invoices and costs. A persisted duplicate-name regression and finance-source permission checks pass; full browser lifecycle passes. Final acceptance totals 86 tests (44 unit/document, 34 database, 8 browser/API), zero failures. No database migration is needed for these reporting corrections.
