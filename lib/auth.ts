import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const ADMIN_SESSION_COOKIE = "cuttleplus_admin_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

function getAdminCredentials() {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  const secret = process.env.ADMIN_SESSION_SECRET;

  if (!username || !password || !secret) {
    throw new Error(
      "ADMIN_USERNAME, ADMIN_PASSWORD, and ADMIN_SESSION_SECRET must be set in .env.",
    );
  }

  return { username, password, secret };
}

function safeEqual(a: string, b: string) {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);

  if (aBuffer.length !== bBuffer.length) {
    return false;
  }

  return timingSafeEqual(aBuffer, bBuffer);
}

function signSession(username: string, secret: string) {
  return createHmac("sha256", secret).update(username).digest("hex");
}

function createSessionValue(username: string, secret: string) {
  return `${username}.${signSession(username, secret)}`;
}

function isValidSessionValue(sessionValue: string | undefined) {
  if (!sessionValue) {
    return false;
  }

  const separatorIndex = sessionValue.lastIndexOf(".");

  if (separatorIndex === -1) {
    return false;
  }

  const username = sessionValue.slice(0, separatorIndex);
  const signature = sessionValue.slice(separatorIndex + 1);
  const { username: adminUsername, secret } = getAdminCredentials();
  const expectedSignature = signSession(username, secret);

  return safeEqual(username, adminUsername) && safeEqual(signature, expectedSignature);
}

export async function isAdminLoggedIn() {
  const cookieStore = await cookies();
  const sessionValue = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

  return isValidSessionValue(sessionValue);
}

export async function requireAdmin() {
  if (!(await isAdminLoggedIn())) {
    redirect("/admin/login");
  }
}

export async function loginAdmin(username: string, password: string) {
  const credentials = getAdminCredentials();

  if (!safeEqual(username, credentials.username) || !safeEqual(password, credentials.password)) {
    return false;
  }

  const cookieStore = await cookies();

  cookieStore.set(ADMIN_SESSION_COOKIE, createSessionValue(username, credentials.secret), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  return true;
}

export async function logoutAdmin() {
  const cookieStore = await cookies();

  cookieStore.delete(ADMIN_SESSION_COOKIE);
}