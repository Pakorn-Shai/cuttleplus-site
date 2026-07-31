import { AdminShell } from "@/components/admin/admin-shell";
import { requireOwner } from "@/lib/auth";

export const metadata = { title: "Admin · Knowledge Hub", robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireOwner();
  return <AdminShell>{children}</AdminShell>;
}
