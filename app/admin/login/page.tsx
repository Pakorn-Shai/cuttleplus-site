import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CmsShell } from "@/app/_components/cms-shell";
import { isAdminLoggedIn, loginAdmin } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Login | Admin",
};

type AdminLoginPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

async function signIn(formData: FormData) {
  "use server";

  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (await loginAdmin(username, password)) {
    redirect("/admin/dashboard");
  }

  redirect("/admin/login?error=1");
}

export default async function AdminLoginPage({ searchParams }: AdminLoginPageProps) {
  if (await isAdminLoggedIn()) {
    redirect("/admin/dashboard");
  }

  const { error } = await searchParams;

  return (
    <CmsShell
      eyebrow="Admin"
      title="Admin Login"
      description="Sign in with the single admin account configured in your environment variables."
      links={[
        { href: "/blog", label: "View public blog" },
      ]}
    >
      <form action={signIn} className="grid gap-4" aria-label="Admin login form">
        {error ? (
          <p className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-700">
            Invalid username or password.
          </p>
        ) : null}
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Username</span>
          <input
            name="username"
            type="text"
            required
            autoComplete="username"
            className="rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-medium">Password</span>
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </label>
        <button
          type="submit"
          className="mt-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
        >
          Sign in
        </button>
      </form>
    </CmsShell>
  );
}
