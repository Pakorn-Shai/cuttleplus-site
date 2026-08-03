"use client";

import { FileCheck2 } from "lucide-react";
import { useState } from "react";

interface BackupSummary {
  createdAt: string;
  contents: number;
  revisions: number;
  categories: number;
  tags: number;
  mediaRecords: number;
}

export function BackupValidator() {
  const [file, setFile] = useState<File | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("เลือกไฟล์ .json ที่ดาวน์โหลดจาก Knowledge Hub");

  async function validate() {
    if (!file) return;
    if (file.size > 25 * 1024 * 1024) { setState("error"); setMessage("ไฟล์ Backup ต้องมีขนาดไม่เกิน 25 MB"); return; }
    setState("loading");
    setMessage("กำลังตรวจ manifest และโครงสร้างข้อมูล...");
    try {
      const response = await fetch("/api/admin/backup/validate", { method: "POST", headers: { "Content-Type": "application/json" }, body: await file.text() });
      const result = await response.json() as { error?: string; summary?: BackupSummary; warnings?: string[] };
      if (response.status === 401) { window.location.href = "/login"; return; }
      if (!response.ok || !result.summary) { setState("error"); setMessage(result.error ?? "ตรวจไฟล์ไม่สำเร็จ"); return; }
      const summary = result.summary;
      setState("success");
      setMessage(`ไฟล์ถูกต้อง · ${summary.contents} เนื้อหา · ${summary.revisions} revisions · ${summary.categories} หมวด · ${summary.tags} tags · ${summary.mediaRecords} media records`);
    } catch {
      setState("error");
      setMessage("อ่านหรือตรวจไฟล์ Backup ไม่สำเร็จ");
    }
  }

  return <div className={`backup-validator ${state}`}><label>ตรวจไฟล์ก่อน Restore<input type="file" accept="application/json,.json" onChange={(event) => { setFile(event.target.files?.[0] ?? null); setState("idle"); setMessage(event.target.files?.[0]?.name ?? "เลือกไฟล์ .json ที่ดาวน์โหลดจาก Knowledge Hub"); }} /></label><button className="secondary-button" type="button" disabled={!file || state === "loading"} onClick={() => void validate()}><FileCheck2 size={14} /> {state === "loading" ? "กำลังตรวจ..." : "ตรวจไฟล์ Backup"}</button><p role={state === "error" ? "alert" : "status"}>{message}</p></div>;
}
