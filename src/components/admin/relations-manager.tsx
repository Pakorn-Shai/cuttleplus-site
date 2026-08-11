"use client";

import { useState } from "react";
import { Link as LinkIcon, Trash2 } from "lucide-react";

interface RelatedContent {
  id: string;
  title: string;
  slug: string;
  relationType: string;
}

interface AllContent {
  id: string;
  title: string;
}

interface RelationsManagerProps {
  contentId: string;
  initialRelations: RelatedContent[];
  allContent: AllContent[];
  addRelation: (formData: FormData) => void;
  removeRelation: (formData: FormData) => void;
}

export function RelationsManager({ contentId, initialRelations, allContent, addRelation, removeRelation }: RelationsManagerProps) {
  const [showAdd, setShowAdd] = useState(false);

  return (
    <div className="relations-manager">
      {initialRelations.length > 0 ? (
        <ul className="relations-list">
          {initialRelations.map((rel) => (
            <li key={rel.id} className="relation-item">
              <span className="relation-type-badge">{rel.relationType}</span>
              <span className="relation-title">{rel.title}</span>
              <form action={removeRelation} style={{ marginLeft: "auto" }}>
                <input type="hidden" name="sourceContentId" value={contentId} />
                <input type="hidden" name="targetContentId" value={rel.id} />
                <input type="hidden" name="relationType" value={rel.relationType} />
                <button type="submit" className="icon-button" aria-label={`ลบ relation กับ ${rel.title}`} title="ลบ relation" style={{ width: 28, height: 28 }}><Trash2 size={12} /></button>
              </form>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted" style={{ fontSize: ".72rem" }}>ยังไม่มี relation</p>
      )}

      {showAdd ? (
        <form action={addRelation} className="add-relation-form">
          <input type="hidden" name="sourceContentId" value={contentId} />
          <select name="targetContentId" required style={{ minHeight: 32, padding: "4px 8px", border: "1px solid #dedfe4", borderRadius: 6, fontSize: ".72rem" }}>
            <option value="">เลือกเนื้อหา...</option>
            {allContent.filter((c) => c.id !== contentId).map((c) => <option value={c.id} key={c.id}>{c.title}</option>)}
          </select>
          <select name="relationType" required style={{ minHeight: 32, padding: "4px 8px", border: "1px solid #dedfe4", borderRadius: 6, fontSize: ".72rem" }}>
            <option value="RELATED">Related</option>
            <option value="PREREQUISITE">Prerequisite</option>
            <option value="FOLLOW_UP">Follow-up</option>
            <option value="ALTERNATIVE">Alternative</option>
            <option value="SUPERSEDES">Supersedes</option>
            <option value="PART_OF">Part of</option>
          </select>
          <div style={{ display: "flex", gap: 6 }}>
            <button type="submit" className="primary-button" style={{ minHeight: 32, fontSize: ".72rem" }}>เพิ่ม</button>
            <button type="button" className="secondary-button" style={{ minHeight: 32, fontSize: ".72rem" }} onClick={() => setShowAdd(false)}>ยกเลิก</button>
          </div>
        </form>
      ) : (
        <button type="button" className="secondary-button" style={{ marginTop: 8, minHeight: 32, fontSize: ".72rem", width: "100%" }} onClick={() => setShowAdd(true)}>
          <LinkIcon size={13} /> เพิ่ม Relation
        </button>
      )}
    </div>
  );
}