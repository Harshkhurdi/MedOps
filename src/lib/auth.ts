import {
  randomBytes,
  scryptSync,
  timingSafeEqual,
  createHash,
} from "node:crypto";
import { cookies } from "next/headers.js";
import { db } from "./db";
import { AppError } from "./errors";
export const COOKIE =
  process.env.NODE_ENV === "production"
    ? "__Host-medops-session"
    : "medops-session";
export const MODULES = [
  "dashboard",
  "tasks",
  "reports",
  "ai",
  "company",
  "customers",
  "manufacturers",
  "products",
  "documents",
  "tenders",
  "requirements",
  "templates",
  "generated",
  "orders",
  "deliveries",
  "equipment",
  "installations",
  "warranties",
  "amcs",
  "visits",
  "invoices",
  "payments",
  "followups",
  "notifications",
  "settings",
  "users",
  "audit",
] as const;
export type Module = (typeof MODULES)[number];
export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}
export function verifyPassword(password: string, hash: string) {
  const [salt, key] = hash.split(":");
  if (!salt || !key || key.length !== 128) return false;
  return timingSafeEqual(
    Buffer.from(key, "hex"),
    scryptSync(password, salt, 64),
  );
}
export function digest(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
export async function currentUser() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const session = await db.session.findUnique({
    where: { tokenHash: digest(token) },
    include: { user: { include: { permissions: true } } },
  });
  if (!session || session.expiresAt < new Date() || !session.user.active)
    return null;
  return session.user;
}
export type Actor = NonNullable<Awaited<ReturnType<typeof currentUser>>>;
export function can(user: Actor, module: string, write = false) {
  return (
    user.role === "ADMIN" ||
    Boolean(
      user.permissions.find(
        (p) => p.module === module && (write ? p.write : p.read),
      ),
    )
  );
}
export async function authorize(module: string, write = false) {
  const user = await currentUser();
  if (!user) throw new AppError(401, "Please sign in");
  if (!can(user, module, write))
    throw new AppError(403, "You do not have permission for this action");
  return user;
}
export function csrf(req: Request) {
  const expected = process.env.APP_URL;
  if (!expected) throw new AppError(503, "APP_URL is not configured");
  if (req.headers.get("origin") !== new URL(expected).origin)
    throw new AppError(403, "Request origin is not permitted");
}
export async function audit(
  userId: string | null,
  action: string,
  module: string,
  recordId?: string,
  details: Record<string, string | number | boolean> = {},
) {
  await db.auditLog.create({
    data: { userId, action, module, recordId, details },
  });
}
export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  await db.session.create({
    data: {
      tokenHash: digest(token),
      userId,
      expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000),
    },
  });
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 8 * 60 * 60,
  });
}
