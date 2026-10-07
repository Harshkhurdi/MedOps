# Security and privacy

This is a single-company employee application. Authorized employees share records only for modules explicitly granted by an administrator; this is not a multi-tenant SaaS.

- scrypt password hashes with random salts; no plaintext passwords in PostgreSQL.
- Database-backed random sessions stored as SHA-256 hashes, eight-hour expiry, HTTP-only SameSite=Strict cookies. Production uses Secure `__Host-` cookies with Path=/ and no Domain.
- No public registration. Administrators grant separate View/Edit permissions. Server authorization runs for every protected API, download and review action. Account/permission/password updates revoke existing sessions. The last administrator and current administrator cannot be disabled/demoted inadvertently.
- All state-changing browser routes require an exact APP_URL Origin and strict schemas. Login attempts have persistent account-key throttling and a 15-minute lockout. Cron uses constant-time bearer-secret validation.
- Production requires HTTPS, managed PostgreSQL TLS and private object storage. Files are served through authenticated routes with no-store caching, safe content disposition and nosniff. Public storage URLs are never exposed.
- Financial/dispatched quantity/serial transactions use Serializable isolation and database constraints. Concurrent conflicts return an actionable retry response. Receipts cannot exceed the invoice balance; no silent financial history edits.
- Important changes, logins, document uploads/replacements/downloads, generation and reviews are recorded in PostgreSQL AuditLog. Server errors avoid printing request contents, storage tokens, passwords or company records.
- No analytics or LLM SDK/provider exists. Next telemetry is disabled. Native document generation and PDF extraction process bytes in the app's own infrastructure.

Before onboarding employees: choose strong unique passwords, grant minimum module access, review approved template wording, configure encrypted backup retention, test restoration and confirm private object-store access. Restrict hosting/database dashboards to authorized administrators. Keep dependency updates and external infrastructure access reviewed. Do not commit confidential documents even to a private Git repository.
