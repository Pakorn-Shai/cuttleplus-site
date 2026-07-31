import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import CategoriesClient from "./categories-client";

export const metadata: Metadata = {
  title: "Categories | Admin",
};

export default async function CategoriesPage() {
  await requireAdmin();

  return <CategoriesClient />;
}
