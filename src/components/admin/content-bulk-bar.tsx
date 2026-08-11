"use client";

import { useState } from "react";
import { Archive, Globe2, Trash2 } from "lucide-react";

export function ContentBulkBar({ onAction, selectedCount, totalCount }: { onAction: (action: string, ids: string[]) => void; selectedCount: number; totalCount: number }) {
  if (selectedCount === 0) return null;
  return <div className="bulk-actions-bar">
    <span>เลือก {selectedCount} / {totalCount} รายการ:</span>
    <button className="status-action-button" onClick={() => onAction("publish", [])}><Globe2 size={13} /> เผยแพร่</button>
    <button className="status-action-button" onClick={() => onAction("archive", [])}><Archive size={13} /> เก็บถาวร</button>
    <button className="danger-button" onClick={() => { if (confirm(`ลบ ${selectedCount} รายการ?`)) onAction("delete", []); }}><Trash2 size={13} /> ลบ</button>
  </div>;
}

// Checkbox column component for each row
export function BulkCheckbox({ contentId, selected, onToggle }: { contentId: string; selected: boolean; onToggle: (id: string) => void }) {
  return <input type="checkbox" checked={selected} onChange={() => onToggle(contentId)} aria-label={`เลือก ${contentId}`} style={{ width: 16, minHeight: 16 }} />;
}