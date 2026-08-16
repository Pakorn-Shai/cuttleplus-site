import Link from "next/link";
import { Upload } from "lucide-react";
import { getEditorTaxonomyOptions } from "@/core/content/editor-service";
import { importMarkdownAction } from "../actions";

export default async function ImportContentPage({ searchParams }: { searchParams: Promise<{ result?: string }> }) {
  const [{ categories }, query] = await Promise.all([getEditorTaxonomyOptions(), searchParams]);

  return <main className="admin-content">
    <header className="admin-page-head">
      <div>
        <h2>Import บทความด้วย Markdown</h2>
        <p>วางเนื้อหา Markdown แล้วระบบจะแปลงเป็นบทความอัตโนมัติ</p>
      </div>
      <Link className="secondary-button" href="/admin/content">กลับไปหน้ารายการ</Link>
    </header>

    {query.result === "invalid" && <p className="admin-notice error" role="alert">กรุณาใส่เนื้อหา Markdown ก่อนส่ง</p>}

    <form className="import-markdown-form" action={importMarkdownAction}>
      <div className="import-field">
        <label htmlFor="markdown">เนื้อหา Markdown</label>
        <textarea
          id="markdown"
          name="markdown"
          rows={18}
          placeholder={"# ชื่อบทความ\n\n## หัวข้อรอง\n\nเนื้อหาย่อหน้าแรก...\n\n- รายการที่ 1\n- รายการที่ 2\n\n```js\nconsole.log(\"hello\");\n```"}
          required
        />
        <p className="import-hint">รองรับ H1 (ชื่อบทความ), H2/H3, ย่อหน้า, code block, และรายการ</p>
      </div>

      <div className="import-grid">
        <div className="import-field">
          <label htmlFor="categorySlug">หมวดหมู่ (ไม่บังคับ)</label>
          <select id="categorySlug" name="categorySlug" defaultValue="">
            <option value="">— ไม่ระบุหมวดหมู่ —</option>
            {categories.map((category) => <option key={category.slug} value={category.slug}>{category.name}</option>)}
          </select>
        </div>
        <div className="import-field">
          <label htmlFor="status">สถานะ</label>
          <select id="status" name="status" defaultValue="DRAFT">
            <option value="DRAFT">Draft</option>
            <option value="INBOX">Inbox</option>
          </select>
        </div>
        <div className="import-field">
          <label htmlFor="visibility">Visibility</label>
          <select id="visibility" name="visibility" defaultValue="PRIVATE">
            <option value="PRIVATE">Private</option>
            <option value="UNLISTED">Unlisted</option>
            <option value="PUBLIC">Public</option>
          </select>
        </div>
      </div>

      <div className="import-actions">
        <button className="primary-button" type="submit"><Upload size={16} /> Import บทความ</button>
      </div>
    </form>
  </main>;
}