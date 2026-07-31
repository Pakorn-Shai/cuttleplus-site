"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createOwnerSession, destroyOwnerSession } from "@/lib/auth";

const loginSchema = z.object({ identifier: z.string().min(1).max(200), password: z.string().min(1).max(200) });

export async function loginAction(formData: FormData) {
  const parsed = loginSchema.safeParse({ identifier: formData.get("identifier"), password: formData.get("password") });
  if (!parsed.success || !(await createOwnerSession(parsed.data.identifier, parsed.data.password))) redirect("/login?error=invalid");
  redirect("/admin");
}

export async function logoutAction() {
  await destroyOwnerSession();
  redirect("/login");
}
