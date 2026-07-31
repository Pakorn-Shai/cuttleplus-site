import { EditorLoader } from "@/components/editor/editor-loader";
import { getEditorDraft } from "@/core/content/editor-service";
import { notFound } from "next/navigation";

export default async function EditContentPage({ params }: { params: Promise<{ id: string }> }) {
  const draft = await getEditorDraft((await params).id);
  if (!draft) notFound();
  return <EditorLoader initialDraft={draft} />;
}
