"use client";

import { useRef, useState } from "react";
import { Archive, Globe2, Trash2 } from "lucide-react";

interface BulkContentActionsProps {
  contentIds: string[];
  bulkAction: (formData: FormData) => void;
}

export function BulkContentActions({ contentIds, bulkAction }: BulkContentActionsProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const formRef = useRef<HTMLFormElement>(null);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) => {
      if (prev.size === contentIds.length) return new Set();
      return new Set(contentIds);
    });
  }

  if (!contentIds.length) return null;

  return (
    <>
      <label className="bulk-select-all" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: ".72rem", color: "#747580", cursor: "pointer" }}>
        <input type="checkbox" checked={selected.size === contentIds.length && contentIds.length > 0} onChange={toggleAll} /> เลือกทั้งหมด
      </label>
      {selected.size > 0 && (
        <form ref={formRef} action={bulkAction} style={{ display: "inline-flex", alignItems: "center", gap: 8, marginLeft: 12 }}>
          {Array.from(selected).map((id) => <input type="hidden" name="ids" value={id} key={id} />)}
          <span style={{ fontSize: ".72rem", color: "#747580" }}>เลือก {selected.size} รายการ:</span>
          <button type="submit" name="bulkAction" value="publish" className="status-action-button"><Globe2 size={13} /> เผยแพร่</button>
          <button type="submit" name="bulkAction" value="archive" className="status-action-button"><Archive size={13} /> เก็บถาวร</button>
          <button type="submit" name="bulkAction" value="delete" className="danger-button" onClick={(e) => { if (!confirm(`ลบ ${selected.size} รายการ?`)) e.preventDefault(); }}><Trash2 size={13} /> ลบ</button>
        </form>
      )}
      {contentIds.map((id) => (
        <input type="checkbox" name="ids" value={id} checked={selected.has(id)} onChange={() => toggle(id)} key={id} className="bulk-checkbox" data-content-id={id} style={{ display: "none" }} />
      ))}
    </>
  );
}