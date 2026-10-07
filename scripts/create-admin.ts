import "dotenv/config";
import { createInterface } from "node:readline/promises";
import { db } from "../src/lib/db";
import { hashPassword } from "../src/lib/auth";
import { z } from "zod";
// Password comes from stdin, never from command arguments or source code.
const rl = createInterface({ input: process.stdin, output: process.stdout });
const email = z
  .email()
  .parse(await rl.question("Administrator email: "))
  .toLowerCase();
const name = z
  .string()
  .min(1)
  .parse(await rl.question("Administrator name: "));
const password = z
  .string()
  .min(12)
  .max(256)
  .parse(
    await rl.question("Password (12+ characters; use a private terminal): "),
  );
rl.close();
if (await db.user.findUnique({ where: { email } }))
  throw new Error("Account already exists; use authenticated user management.");
await db.user.create({
  data: { email, name, passwordHash: hashPassword(password), role: "ADMIN" },
});
console.log("Administrator created.");
await db.$disconnect();
