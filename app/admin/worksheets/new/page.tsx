import { revalidatePath } from "next/cache";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CmsShell } from "@/app/_components/cms-shell";
import WorksheetCategorySelect from "@/app/_components/worksheet-category-select";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isHttpUrl } from "@/lib/urls";

export const metadata: Metadata = {
  title: "New Worksheet | Admin",
};

function parseOptionalId(value: FormDataEntryValue | null, label: string) {
  const rawValue = String(value ?? "").trim();

  if (!rawValue) {
    return null;
  }

  const id = Number(rawValue);

  if (!Number.isInteger(id)) {
    throw new Error(`A valid ${label} id is required.`);
  }

  return id;
}

async function validateWorksheetTaxonomy(categoryId: number | null, subcategoryId: number | null) {
  if (subcategoryId && !categoryId) {
    throw new Error("Select a worksheet category before selecting a subcategory.");
  }

  if (categoryId) {
    const category = await prisma.worksheetCategory.findUnique({
      where: { id: categoryId },
      select: { id: true },
    });

    if (!category) {
      throw new Error("Worksheet category not found.");
    }
  }

  if (subcategoryId) {
    const subcategory = await prisma.worksheetSubcategory.findUnique({
      where: { id: subcategoryId },
      select: { categoryId: true },
    });

    if (!subcategory) {
      throw new Error("Worksheet subcategory not found.");
    }

    if (subcategory.categoryId !== categoryId) {
      throw new Error("Worksheet subcategory must belong to the selected category.");
    }
  }
}

async function createWorksheet(formData: FormData) {
  "use server";

  await requireAdmin();

  const title = String(formData.get("title") ?? "").trim();
  const imageUrl = String(formData.get("imageUrl") ?? "").trim();
  const link = String(formData.get("link") ?? "").trim();
  const categoryId = parseOptionalId(formData.get("categoryId"), "worksheet category");
  const subcategoryId = parseOptionalId(formData.get("subcategoryId"), "worksheet subcategory");

  if (!title || !imageUrl || !link) {
    throw new Error("Title, image URL, and link are required.");
  }

  if (!isHttpUrl(imageUrl) || !isHttpUrl(link)) {
    throw new Error("Image URL and link must be valid http(s) URLs.");
  }

  await validateWorksheetTaxonomy(categoryId, subcategoryId);

  await prisma.worksheet.create({
    data: { title, imageUrl, link, categoryId, subcategoryId },
  });

  revalidatePath("/admin/worksheets");
  revalidatePath("/worksheets");
  redirect("/admin/worksheets");
}

export default async function NewWorksheetPage() {
  await requireAdmin();

  return (
    <CmsShell
      eyebrow="Admin"
      title="Add Worksheet"
      description="Create a new worksheet with a cover image and link."
      links={[
        { href: "/admin/worksheets", label: "Back to worksheets" },
      ]}
    >
      <form action={createWorksheet} className="grid gap-5">
        <label className="grid gap-2 text-sm">
          <span className="font-medium">Title</span>
          <input
            name="title"
            type="text"
            required
            placeholder="Excel Data Analysis"
            className="rounded-lg border border-border bg-surface px-4 py-3 text-sm outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </label>

        <label className="grid gap-2 text-sm">
          <span className="font-medium">Image URL</span>
          <input
            name="imageUrl"
            type="url"
            required
            placeholder="https://example.com/worksheet.jpg"
            className="rounded-lg border border-border bg-surface px-4 py-3 text-sm outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </label>

        <label className="grid gap-2 text-sm">
          <span className="font-medium">Link</span>
          <input
            name="link"
            type="url"
            required
            placeholder="https://example.com/worksheet.pdf"
            className="rounded-lg border border-border bg-surface px-4 py-3 text-sm outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <span className="text-xs text-muted">
            URL where users can access or download the worksheet.
          </span>
        </label>

        <WorksheetCategorySelect />

        <div className="flex flex-wrap items-center gap-3 border-t border-border pt-5">
          <button
            type="submit"
            className="rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
          >
            Save worksheet
          </button>
        </div>
      </form>
    </CmsShell>
  );
}
