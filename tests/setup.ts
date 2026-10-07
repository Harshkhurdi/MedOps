import "dotenv/config";
const url = new URL(
  process.env.DATABASE_URL ?? "postgresql://localhost/medops_test",
);
if (!["localhost", "127.0.0.1"].includes(url.hostname))
  throw new Error("Tests require isolated local PostgreSQL");
url.pathname = "/medops_test";
process.env.DATABASE_URL = url.toString();
process.env.DIRECT_URL = url.toString();
process.env.STORAGE_DRIVER = "local";
process.env.LOCAL_STORAGE_PATH = ".local-storage/test";
process.env.APP_URL = "http://localhost:3000";
