import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import WorksheetCategoriesClient from "./worksheet-categories-client";

export const metadata: Metadata = {
  title: "Worksheet Categories | Admin",
};

export default async function WorksheetCategoriesPage() {
  await requireAdmin();

  return <WorksheetCategoriesClient />;
}
