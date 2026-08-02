"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";
import { createOwnerSession, destroyOwnerSession } from "@/lib/auth";
import { consumeRateLimit, requestClientAddress } from "@/lib/rate-limit";

const loginSchema = z.object({ identifier: z.string().min(1).max(200), password: z.string().min(1).max(200) });

export async function loginAction(formData: FormData) {
  const parsed = loginSchema.safeParse({ identifier: formData.get("identifier"), password: formData.get("password") });
  if (!parsed.success) redirect("/login?error=invalid");
  const requestHeaders = await headers();
  const rateLimit = await consumeRateLimit("login", `${requestClientAddress(requestHeaders)}:${parsed.data.identifier.toLowerCase()}`, 5, 15 * 60);
  if (!rateLimit.allowed) redirect("/login?error=rate_limited");
  if (!(await createOwnerSession(parsed.data.identifier, parsed.data.password))) redirect("/login?error=invalid");
  redirect("/admin");
}

export async function logoutAction() {
  await destroyOwnerSession();
  redirect("/login");
}
