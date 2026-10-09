import "dotenv/config";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { db } from "../src/lib/db";
import { store } from "../src/lib/storage";
import {
  backupInventory,
  restoreBackupFiles,
  verifyBackupRecords,
} from "./file-backup";
if (process.env.MEDOPS_RESTORE_CONFIRM !== "isolated-restore")
  throw new Error(
    "Set MEDOPS_RESTORE_CONFIRM=isolated-restore only for an isolated recovery database",
  );
const directory = process.argv[2];
if (!directory || !path.isAbsolute(directory))
  throw new Error("Provide an absolute backup directory");
const inventory = backupInventory.parse(
  JSON.parse(await readFile(path.join(directory, "inventory.json"), "utf8")),
);
verifyBackupRecords(inventory.files, await db.storedFile.findMany());
await restoreBackupFiles(inventory.files, {
  read: (file) => readFile(path.join(directory, file.id + ".bin")),
  store: (file, bytes) => store(bytes, file.mime, path.extname(file.name)),
  commit: async (saved) => {
    await db.$transaction(
      async (tx) => {
        verifyBackupRecords(inventory.files, await tx.storedFile.findMany());
        for (const file of saved) {
          await tx.storedFile.update({
            where: { id: file.id },
            data: { key: file.key },
          });
        }
      },
      { isolationLevel: "Serializable", timeout: 60000 },
    );
  },
});
console.log(
  `Restored ${inventory.files.length} file versions; verify before switching application configuration.`,
);
await db.$disconnect();
