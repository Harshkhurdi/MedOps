import "dotenv/config";
import { db } from "../src/lib/db";
// Approved directory names only; no fictional tenders, customers, or finances.
for (const name of [
  "Samsung Healthcare",
  "Hamilton Medical",
  "KARL STORZ",
  "LINET",
  "Medcaptain",
  "Spacelabs Healthcare",
  "Skanray",
])
  await db.manufacturer.upsert({
    where: { name },
    create: { name },
    update: {},
  });
console.log("Manufacturer directory initialized.");
await db.$disconnect();
