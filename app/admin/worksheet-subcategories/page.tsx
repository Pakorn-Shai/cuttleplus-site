import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import WorksheetSubcategoriesClient from "./worksheet-subcategories-client";

export const metadata: Metadata = {
  title: "Worksheet Subcategories | Admin",
};

export default async function WorksheetSubcategoriesPage() {
  await requireAdmin();

  return <WorksheetSubcategoriesClient />;
}
