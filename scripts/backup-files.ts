import "dotenv/config";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { db } from "../src/lib/db";
import { retrieve } from "../src/lib/storage";
const directory = process.argv[2];
if (!directory || !path.isAbsolute(directory))
  throw new Error("Provide an absolute private backup directory");
await mkdir(directory, { recursive: true, mode: 0o700 });
const files = await db.storedFile.findMany();
const inventory = [];
for (const file of files) {
  const bytes = await retrieve(file.key);
  await writeFile(path.join(directory, file.id + ".bin"), bytes, {
    flag: "wx",
    mode: 0o600,
  });
  inventory.push({
    id: file.id,
    name: file.name,
    key: file.key,
    sha256: file.sha256,
    mime: file.mime,
    size: file.size,
  });
}
await writeFile(
  path.join(directory, "inventory.json"),
  JSON.stringify(
    { createdAt: new Date().toISOString(), files: inventory },
    null,
    2,
  ),
  { flag: "wx", mode: 0o600 },
);
console.log(
  `Exported ${files.length} private file versions. Encrypt and store the backup securely.`,
);
await db.$disconnect();
