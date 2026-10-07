import "../setup";
import { db } from "../../src/lib/db";
import { hashPassword } from "../../src/lib/auth";
export default async function setup() {
  await db.user.upsert({
    where: { email: "admin@example.test" },
    create: {
      email: "admin@example.test",
      name: "Synthetic Administrator",
      role: "ADMIN",
      passwordHash: hashPassword("synthetic-test-password"),
    },
    update: {
      active: true,
      role: "ADMIN",
      passwordHash: hashPassword("synthetic-test-password"),
    },
  });
  await db.user.upsert({
    where: { email: "employee@example.test" },
    create: {
      email: "employee@example.test",
      name: "Restricted Test Employee",
      role: "EMPLOYEE",
      passwordHash: hashPassword("synthetic-test-password"),
    },
    update: {
      active: true,
      role: "EMPLOYEE",
      passwordHash: hashPassword("synthetic-test-password"),
      permissions: { deleteMany: {} },
    },
  });
  await db.$disconnect();
}
