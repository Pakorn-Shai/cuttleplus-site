import { notFound } from "next/navigation";
import { CmsShell } from "@/app/_components/cms-shell";
import { prisma } from "@/lib/prisma";
import { WorksheetBrowser } from "./worksheet-browser";

type WorksheetPageContentProps = {
  categorySlug?: string;
  subcategorySlug?: string;
};

export async function WorksheetPageContent({
  categorySlug,
  subcategorySlug,
}: WorksheetPageContentProps) {
  const categories = await prisma.worksheetCategory.findMany({
    include: {
      subcategories: {
        orderBy: {
          name: "asc",
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  const selectedCategory = categorySlug
    ? categories.find((category) => category.slug === categorySlug)
    : null;

  if (categorySlug && !selectedCategory) {
    notFound();
  }

  const selectedSubcategory = subcategorySlug && selectedCategory
    ? selectedCategory.subcategories.find((subcategory) => subcategory.slug === subcategorySlug)
    : null;

  if (subcategorySlug && !selectedSubcategory) {
    notFound();
  }

  const worksheets = await prisma.worksheet.findMany({
    where: {
      ...(selectedCategory ? { categoryId: selectedCategory.id } : {}),
      ...(selectedSubcategory ? { subcategoryId: selectedSubcategory.id } : {}),
    },
    include: {
      category: true,
      subcategory: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const title = selectedSubcategory
    ? `${selectedCategory?.name} / ${selectedSubcategory.name}`
    : selectedCategory?.name ?? "Worksheets";
  const description = selectedSubcategory
    ? `Browse and download ${selectedSubcategory.name} worksheets for ${selectedCategory?.name}.`
    : selectedCategory
      ? `Browse and download worksheets for ${selectedCategory.name}.`
      : "Browse and download worksheets and learning resources.";

  return (
    <CmsShell
      eyebrow="Resources"
      title={title}
      description={description}
      links={[{ href: "/", label: "Back to home" }, { href: "/blog", label: "Blog" }]}
    >
      <WorksheetBrowser
        categories={categories}
        worksheets={worksheets}
        selectedCategorySlug={selectedCategory?.slug}
        selectedSubcategorySlug={selectedSubcategory?.slug}
      />
    </CmsShell>
  );
}
