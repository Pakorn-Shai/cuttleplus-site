export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { WorksheetPageContent } from "../../_components/worksheet-page-content";

type WorksheetSubcategoryPageProps = {
  params: Promise<{
    category: string;
    subcategory: string;
  }>;
};

export async function generateMetadata({
  params,
}: WorksheetSubcategoryPageProps): Promise<Metadata> {
  const { category: categorySlug, subcategory: subcategorySlug } = await params;
  const category = await prisma.worksheetCategory.findUnique({
    where: { slug: categorySlug },
    include: {
      subcategories: true,
    },
  });

  if (!category) {
    return {
      title: "Worksheet category not found",
    };
  }

  const subcategory = category.subcategories.find((item) => item.slug === subcategorySlug);

  if (!subcategory) {
    return {
      title: "Worksheet subcategory not found",
    };
  }

  return {
    title: `${subcategory.name} Worksheets for ${category.name} | CuttlePlus`,
    description: `Browse and download ${subcategory.name} worksheets for ${category.name}.`,
  };
}

export default async function WorksheetSubcategoryPage({ params }: WorksheetSubcategoryPageProps) {
  const { category, subcategory } = await params;

  return <WorksheetPageContent categorySlug={category} subcategorySlug={subcategory} />;
}
