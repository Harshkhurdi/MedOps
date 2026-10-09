# Backup and restoration

The database contains structured records and private object keys; both PostgreSQL and document objects must be recovered together. Vercel's deployment history is not a business-data backup.

## Database

Configure managed database point-in-time recovery where available. Free hosting plans may not include the retention your company needs. Arrange scheduled encrypted dumps to a separate restricted storage destination, define retention and monitor backup completion. Use a protected PGPASSFILE/secret manager instead of putting passwords in command arguments.

```sh
# In a trusted shell, set the protected connection securely.
pg_dump --format=custom --no-owner --no-acl --file=medops-backup.dump "$DIRECT_URL"
# Encrypt and move the dump to an approved private backup destination.
```

Backups contain confidential data: never store dumps in Git, public storage, shared chat attachments or third-party AI tools. Back up before schema releases. Record timestamp, schema migration version, object inventory snapshot and checksum.

## Document objects

Use a separate private backup store/account with restricted administrator access. The `scripts/backup-files.ts` command exports an inventory and each versioned object into a private local backup directory. Run only on trusted infrastructure, encrypt the resulting directory/archive, upload it to the approved backup destination, then remove the plaintext working copy per company policy. It never prints object tokens or document contents.

```sh
# DATABASE_URL and BLOB_READ_WRITE_TOKEN must be set securely; STORAGE_DRIVER=blob.
npx tsx scripts/backup-files.ts /approved/private/backup-directory
```

All file versions should be backed up, including generated history. The export checks each object's size and SHA-256 against its database record before writing it. Compare StoredFile counts and retain the database dump from the matching snapshot. A same-account Blob store is not an independent disaster-recovery copy. Schedule this export outside Vercel functions on trusted infrastructure; Vercel's local filesystem is not durable.

## Recovery drill

1. Create isolated PostgreSQL and a separate private document store. Restrict users during restoration.
2. Decrypt the approved backup, verify checksums and run `pg_restore --no-owner --no-acl --dbname="$RESTORE_DATABASE_URL" medops-backup.dump`.
3. Restore objects using `scripts/restore-files.ts`, which verifies the complete inventory against the restored database and checks every object's SHA-256 before writing. After all objects upload successfully, it updates the restored database's keys in one transaction. It requires `MEDOPS_RESTORE_CONFIRM=isolated-restore` to avoid accidental execution. Use the restored database connection, never the live database. A failed upload or database transaction keeps the original keys and can leave unreferenced objects in the isolated recovery store; remove those only after comparing its inventory with database references.
4. Run migration status; do not reset a restored database. Validate login, file download/history, order/invoice balances and record counts.
5. Compare inventories and validate representative DOCX/PDF/XLSX files. Record recovery time and missing data, then correct backup procedures.
6. Switch application configuration only after the company administrator approves the completed recovery. Revoke old sessions as part of incident recovery.

Backup scheduling, encryption-key custody, off-site retention and restoration drills are operator responsibilities. No claim of an active backup job should be made from these procedures alone.
