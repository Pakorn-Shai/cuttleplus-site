import { EditorLoader } from "@/components/editor/editor-loader";
import { getEditorTaxonomyOptions } from "@/core/content/editor-service";

export default async function NewContentPage() {
  const taxonomy = await getEditorTaxonomyOptions();
  return <EditorLoader taxonomy={taxonomy} />;
}
