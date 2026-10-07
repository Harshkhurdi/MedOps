import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
const globalDb = globalThis as unknown as { medopsDb?: PrismaClient };
export function databaseUrl() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is required");
  if (
    process.env.VERCEL &&
    !["require", "verify-full", "verify-ca"].includes(
      new URL(url).searchParams.get("sslmode") ?? "",
    )
  )
    throw new Error(
      "Production PostgreSQL requires sslmode=verify-full or require",
    );
  return url;
}
export const db =
  globalDb.medopsDb ??
  new PrismaClient({
    adapter: new PrismaPg({ connectionString: databaseUrl(), max: 5 }),
  });
if (process.env.NODE_ENV !== "production") globalDb.medopsDb = db;
