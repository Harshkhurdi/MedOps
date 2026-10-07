# Implementation and verification checklist

- [x] Phase 1: PostgreSQL schema/migrations, sessions, permissions, profile, directory, private files
- [x] Phase 2: tender workspaces, local PDF extraction, templates, DOCX/PDF/XLSX/ZIP, review/history
- [x] Phase 3: orders, partial deliveries, serials, installations
- [x] Phase 4: contractual warranties, AMC devices, visits, renewals
- [x] Phase 5: exact financial totals, partial receipts, follow-ups
- [x] Phase 6: database dashboard, idempotent reminders, audit records
- [x] TypeScript, ESLint, unit/document tests, PostgreSQL integration, Playwright, production build
- [x] GitHub main push and remote verification
- [x] Private storage, managed PostgreSQL, migrations, Vercel deployment and live verification

No real company records are used in tests. Production has no synthetic business seeding.

Production login, dashboard, TLS database access, private Blob read/write and access denial verified on 07/10/2026. Synthetic end-to-end records remain in medops_test. Company-approved real-document acceptance and operator backup scheduling remain onboarding tasks.

Enhancement release: scoped task management, receivables aging, filtered Excel/CSV exports, optimistic edit concurrency, minimal workflow lookups, self-service password changes, current notification access checks and optional OpenRouter assistance for explicitly entered text. The provider remains disabled until a valid key/model is configured; business workflows require no AI.
