import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import SubcategoriesClient from "./subcategories-client";

export const metadata: Metadata = {
  title: "Subcategories | Admin",
};

export default async function SubcategoriesPage() {
  await requireAdmin();

  return <SubcategoriesClient />;
}
