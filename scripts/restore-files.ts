import "dotenv/config";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { z } from "zod";
import { db } from "../src/lib/db";
import { store } from "../src/lib/storage";
if (process.env.MEDOPS_RESTORE_CONFIRM !== "isolated-restore")
  throw new Error(
    "Set MEDOPS_RESTORE_CONFIRM=isolated-restore only for an isolated recovery database",
  );
const directory = process.argv[2];
if (!directory || !path.isAbsolute(directory))
  throw new Error("Provide an absolute backup directory");
const inventory = z
  .object({
    files: z.array(
      z.object({
        id: z.string().regex(/^[a-zA-Z0-9]+$/),
        name: z.string(),
        sha256: z.string(),
        mime: z.string(),
        size: z.number(),
      }),
    ),
  })
  .parse(
    JSON.parse(await readFile(path.join(directory, "inventory.json"), "utf8")),
  );
for (const file of inventory.files) {
  const bytes = await readFile(path.join(directory, file.id + ".bin"));
  if (
    bytes.length !== file.size ||
    createHash("sha256").update(bytes).digest("hex") !== file.sha256
  )
    throw new Error("Backup checksum mismatch");
  const saved = await store(bytes, file.mime, path.extname(file.name));
  await db.storedFile.update({
    where: { id: file.id },
    data: { key: saved.key },
  });
}
console.log(
  `Restored ${inventory.files.length} file versions; verify before switching application configuration.`,
);
await db.$disconnect();
