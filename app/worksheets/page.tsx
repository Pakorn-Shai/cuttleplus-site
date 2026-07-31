export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { WorksheetPageContent } from "./_components/worksheet-page-content";

export const metadata: Metadata = {
  title: "Worksheets | CuttlePlus",
  description: "Browse and download worksheets and resources.",
};

export default async function WorksheetsPage() {
  return <WorksheetPageContent />;
}
