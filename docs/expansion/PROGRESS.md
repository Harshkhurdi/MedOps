# Expansion implementation and verification

Baseline: main `33c2a7445deedaf6dcead1c595e30d166b3456ee`, clean checkout, 7 October 2026. Unit/document tests 27 passed; PostgreSQL integration 3 passed; browser/API 3 passed; typecheck, ESLint, Prisma validation and production build passed. Production data and the separate Tender Tracker are excluded from test operations.

Implementation proceeds A → B → C → D → E. Each phase must pass existing and new tests, quality checks, build and smoke verification before the next phase. Stable phases are pushed normally and deployed after an encrypted backup and safe migration validation. AI stays disabled by default; no automatic LLM processing is added.

| Phase                          | Status      |
| ------------------------------ | ----------- |
| A: Commercial tender workflow  | In progress |
| B: Tender controls             | Pending     |
| C: Service and installed base  | Pending     |
| D: CRM and revenue             | Pending     |
| E: Productivity and management | Pending     |

Historical entry will be explicit, restricted to administrators, retain original dates/provenance and preserve relationship checks and financial safeguards. Optional integrations must fail clearly and leave manual entry available.

Phase A: 29 unit/document, 8 PostgreSQL integration and 4 browser/API tests passed (41 total, baseline 33 + 8). TypeScript, ESLint, Prisma validation and production build passed. Manual RFQ UI, immutable revisions, neutral comparison, DOCX/PDF downloads and pricing permission denial were exercised. Production verification pending.
