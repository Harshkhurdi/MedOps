import { createHash } from "node:crypto";
import { z } from "zod";

export const backupInventory = z.object({
  files: z
    .array(
      z.object({
        id: z.string().regex(/^[a-zA-Z0-9]+$/),
        name: z.string().min(1),
        sha256: z.string().regex(/^[a-f0-9]{64}$/),
        mime: z.string().min(1),
        size: z.number().int().nonnegative(),
      }),
    )
    .refine(
      (files) => new Set(files.map((file) => file.id)).size === files.length,
      {
        message: "Backup contains duplicate file IDs",
      },
    ),
});

type BackupFile = z.infer<typeof backupInventory>["files"][number];

export function verifyBackupBytes(
  file: Pick<BackupFile, "size" | "sha256">,
  bytes: Buffer,
) {
  if (
    bytes.length !== file.size ||
    createHash("sha256").update(bytes).digest("hex") !== file.sha256
  )
    throw new Error("Backup checksum mismatch");
}

export function verifyBackupRecords(
  files: BackupFile[],
  records: BackupFile[],
) {
  const byId = new Map(records.map((file) => [file.id, file]));
  if (files.length !== records.length) {
    throw new Error("Backup inventory does not match the restored database");
  }
  for (const file of files) {
    const record = byId.get(file.id);
    if (
      !record ||
      record.sha256 !== file.sha256 ||
      record.size !== file.size ||
      record.name !== file.name ||
      record.mime !== file.mime
    ) {
      throw new Error("Backup inventory does not match the restored database");
    }
  }
}

export async function restoreBackupFiles(
  files: BackupFile[],
  operations: {
    read: (file: BackupFile) => Promise<Buffer>;
    store: (file: BackupFile, bytes: Buffer) => Promise<{ key: string }>;
    commit: (saved: { id: string; key: string }[]) => Promise<void>;
  },
) {
  // Verify the complete snapshot before writing any objects or database keys.
  for (const file of files)
    verifyBackupBytes(file, await operations.read(file));
  const saved: { id: string; key: string }[] = [];
  for (const file of files) {
    const bytes = await operations.read(file);
    verifyBackupBytes(file, bytes);
    const object = await operations.store(file, bytes);
    saved.push({ id: file.id, key: object.key });
  }
  // Storage has no multi-object transaction; keep keys unchanged until every
  // upload succeeds. A failed attempt can leave unreferenced recovery objects.
  await operations.commit(saved);
}
