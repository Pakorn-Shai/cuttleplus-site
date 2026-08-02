import { EditorLoader } from "@/components/editor/editor-loader";
import { getEditorDraft, getEditorTaxonomyOptions } from "@/core/content/editor-service";
import { notFound } from "next/navigation";

export default async function EditContentPage({ params }: { params: Promise<{ id: string }> }) {
  const [draft, taxonomy] = await Promise.all([getEditorDraft((await params).id), getEditorTaxonomyOptions()]);
  if (!draft) notFound();
  return <EditorLoader initialDraft={draft} taxonomy={taxonomy} />;
}
