export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { WorksheetPageContent } from "../_components/worksheet-page-content";

type WorksheetCategoryPageProps = {
  params: Promise<{
    category: string;
  }>;
};

export async function generateMetadata({
  params,
}: WorksheetCategoryPageProps): Promise<Metadata> {
  const { category: categorySlug } = await params;
  const category = await prisma.worksheetCategory.findUnique({
    where: { slug: categorySlug },
  });

  if (!category) {
    return {
      title: "Worksheet category not found",
    };
  }

  return {
    title: `${category.name} Worksheets | CuttlePlus`,
    description: `Browse and download worksheets for ${category.name}.`,
  };
}

export default async function WorksheetCategoryPage({ params }: WorksheetCategoryPageProps) {
  const { category } = await params;

  return <WorksheetPageContent categorySlug={category} />;
}
