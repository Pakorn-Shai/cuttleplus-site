import type { Metadata } from "next";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { CmsShell } from "@/app/_components/cms-shell";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DeleteWorksheetButton } from "./delete-worksheet-button";

export const metadata: Metadata = {
  title: "Worksheets | Admin",
};

async function deleteWorksheet(formData: FormData) {
  "use server";

  await requireAdmin();

  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) {
    throw new Error("A valid worksheet id is required.");
  }

  await prisma.worksheet.delete({
    where: { id },
  });

  revalidatePath("/admin/worksheets");
  revalidatePath("/worksheets");
}

export default async function WorksheetsPage() {
  await requireAdmin();

  const worksheets = await prisma.worksheet.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <CmsShell
      eyebrow="Admin"
      title="Worksheets"
      description="Manage worksheet links and images."
      links={[{ href: "/admin/dashboard", label: "Back to dashboard" }]}
    >
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/admin/worksheets/new"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary-hover"
        >
          Add Worksheet
        </Link>
      </div>

      {worksheets.length ? (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {worksheets.map((worksheet) => (
            <li
              key={worksheet.id}
              className="rounded-xl border border-border bg-surface/60 overflow-hidden"
            >
              <img
                src={worksheet.imageUrl}
                alt={worksheet.title}
                className="h-40 w-full object-cover"
              />
              <div className="p-4">
                <h3 className="text-sm font-semibold">{worksheet.title}</h3>
                <a
                  href={worksheet.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 block truncate text-xs text-primary hover:underline"
                >
                  {worksheet.link}
                </a>
                <div className="mt-3 flex items-center gap-2">
                  <Link
                    href={`/admin/worksheets/${worksheet.id}/edit`}
                    className="rounded-md border border-border px-3 py-1.5 text-xs font-medium transition hover:bg-surface-muted"
                  >
                    Edit
                  </Link>
                  <form action={deleteWorksheet}>
                    <input type="hidden" name="id" value={worksheet.id} />
                    <DeleteWorksheetButton
                      className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50"
                    />
                  </form>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-xl border border-border bg-surface/60 p-5 text-sm text-muted">
          No worksheets have been created yet.
        </p>
      )}
    </CmsShell>
  );
}
