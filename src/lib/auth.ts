import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

const SESSION_COOKIE = "knowledge_hub_owner_session";
const SESSION_SECONDS = 60 * 60 * 8;

function authConfig() {
  const identifier = process.env.OWNER_EMAIL ?? process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!identifier || !password || !secret || secret.length < 32) return null;
  return { identifier, password, secret };
}

export function isAuthConfigured() {
  return authConfig() !== null;
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function signature(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

export async function createOwnerSession(identifier: string, password: string) {
  const config = authConfig();
  if (!config || !safeEqual(identifier, config.identifier) || !safeEqual(password, config.password)) return false;
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
  const payload = `${config.identifier}.${expiresAt}`;
  (await cookies()).set(SESSION_COOKIE, `${payload}.${signature(payload, config.secret)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_SECONDS,
  });
  return true;
}

export async function getOwnerSession() {
  const value = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!value) return null;
  const config = authConfig();
  if (!config) return null;
  const parts = value.split(".");
  if (parts.length < 3) return null;
  const suppliedSignature = parts.pop() ?? "";
  const expiresAt = Number(parts.pop());
  const identifier = parts.join(".");
  const payload = `${identifier}.${expiresAt}`;
  if (!Number.isFinite(expiresAt) || expiresAt <= Math.floor(Date.now() / 1000)) return null;
  if (!safeEqual(identifier, config.identifier) || !safeEqual(suppliedSignature, signature(payload, config.secret))) return null;
  return process.env.OWNER_EMAIL
    ? prisma.user.findUnique({ where: { email: process.env.OWNER_EMAIL } })
    : prisma.user.findFirst({ where: { role: "OWNER" }, orderBy: { createdAt: "asc" } });
}

export async function requireOwner() {
  const owner = await getOwnerSession();
  if (!owner) redirect("/login");
  return owner;
}

export async function destroyOwnerSession() {
  (await cookies()).delete(SESSION_COOKIE);
}
