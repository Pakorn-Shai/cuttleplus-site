"use client";

import { Download, FileUp, RotateCcw, TriangleAlert } from "lucide-react";
import { useState } from "react";

interface RestoreTablePlan {
  table: string;
  label: string;
  currentCount: number;
  backupCount: number;
}

interface RestorePlan {
  backupCreatedAt: string;
  tables: RestoreTablePlan[];
  totalCurrent: number;
  totalBackup: number;
  warnings: string[];
}

interface IntegrityIssue {
  table: string;
  message: string;
}

type RestoreState = "idle" | "loading-plan" | "plan-ready" | "restoring" | "restored" | "error";

const MAX_BACKUP_BYTES = 25 * 1024 * 1024;

export function BackupRestore() {
  const [file, setFile] = useState<File | null>(null);
  const [backup, setBackup] = useState<unknown>(null);
  const [state, setState] = useState<RestoreState>("idle");
  const [plan, setPlan] = useState<RestorePlan | null>(null);
  const [issues, setIssues] = useState<IntegrityIssue[]>([]);
  const [message, setMessage] = useState("เลือกไฟล์ .json ที่ดาวน์โหลดจาก Knowledge Hub แล้วกดตรวจไฟล์");
  const [confirmed, setConfirmed] = useState(false);
  const [preRestoreBackupJson, setPreRestoreBackupJson] = useState<string | null>(null);
  const [restoredAt, setRestoredAt] = useState<string | null>(null);

  function reset() {
    setPlan(null);
    setIssues([]);
    setConfirmed(false);
    setPreRestoreBackupJson(null);
    setRestoredAt(null);
  }

  async function loadAndPlan() {
    if (!file) return;
    if (file.size > MAX_BACKUP_BYTES) {
      setState("error");
      setMessage("ไฟล์ Backup ต้องมีขนาดไม่เกิน 25 MB");
      return;
    }
    setState("loading-plan");
    setMessage("กำลังตรวจไฟล์และเตรียมแผน Restore...");
    reset();
    try {
      const parsed: unknown = JSON.parse(await file.text());
      setBackup(parsed);
      const response = await fetch("/api/admin/backup/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ backup: parsed, dryRun: true }),
      });
      if (response.status === 401) { window.location.href = "/login"; return; }
      const result = await response.json() as { error?: string; issues?: IntegrityIssue[]; plan?: RestorePlan };
      if (!response.ok || !result.plan) {
        setState("error");
        setIssues(result.issues ?? []);
        setMessage(result.error ?? "ตรวจไฟล์ไม่สำเร็จ");
        return;
      }
      setPlan(result.plan);
      setState("plan-ready");
      setMessage("ตรวจไฟล์ผ่าน กรุณาตรวจสอบแผนด้านล่างก่อนยืนยัน Restore");
    } catch {
      setState("error");
      setMessage("อ่านหรือตรวจไฟล์ Backup ไม่สำเร็จ");
    }
  }

  async function confirmRestore() {
    if (!backup || !confirmed) return;
    setState("restoring");
    setMessage("กำลัง Restore ข้อมูล อาจใช้เวลาสักครู่...");
    try {
      const response = await fetch("/api/admin/backup/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ backup, dryRun: false }),
      });
      if (response.status === 401) { window.location.href = "/login"; return; }
      const result = await response.json() as { error?: string; restoredAt?: string; preRestoreBackupJson?: string };
      if (!response.ok || !result.restoredAt) {
        setState("error");
        setMessage(result.error ?? "Restore ล้มเหลว");
        return;
      }
      setRestoredAt(result.restoredAt);
      setPreRestoreBackupJson(result.preRestoreBackupJson ?? null);
      setState("restored");
      setMessage("Restore สำเร็จ ข้อมูลถูกแทนที่ด้วย Backup แล้ว");
    } catch {
      setState("error");
      setMessage("Restore ล้มเหลว กรุณาลองใหม่");
    }
  }

  function downloadPreRestoreBackup() {
    if (!preRestoreBackupJson) return;
    const blob = new Blob([preRestoreBackupJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `knowledge-hub-pre-restore-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  const busy = state === "loading-plan" || state === "restoring";

  return <div className="backup-restore">
    <div className="backup-restore-picker">
      <label>Restore จากไฟล์ Backup<input type="file" accept="application/json,.json" onChange={(event) => { setFile(event.target.files?.[0] ?? null); setState("idle"); reset(); setMessage(event.target.files?.[0]?.name ?? "เลือกไฟล์ .json ที่ดาวน์โหลดจาก Knowledge Hub แล้วกดตรวจไฟล์"); }} /></label>
      <button className="secondary-button" type="button" disabled={!file || busy} onClick={() => void loadAndPlan()}>
        <FileUp size={14} /> {state === "loading-plan" ? "กำลังตรวจ..." : "ตรวจไฟล์และดูแผน"}
      </button>
    </div>

    <p role={state === "error" ? "alert" : "status"} className={`backup-restore-message ${state}`}>{message}</p>

    {issues.length > 0 && <ul className="backup-restore-issues">{issues.map((issue) => <li key={`${issue.table}-${issue.message}`}>{issue.message}</li>)}</ul>}

    {plan && state !== "restored" && <div className="backup-restore-plan">
      <div className="backup-restore-plan-head">
        <strong>แผน Restore</strong>
        <span>Backup สร้างเมื่อ {new Date(plan.backupCreatedAt).toLocaleString("th-TH")}</span>
      </div>
      <div className="admin-table-wrap"><table className="admin-table">
        <thead><tr><th>ตาราง</th><th>ข้อมูลปัจจุบัน</th><th>จาก Backup</th></tr></thead>
        <tbody>
          {plan.tables.map((row) => <tr key={row.table}>
            <td>{row.label}</td>
            <td>{row.currentCount.toLocaleString()}</td>
            <td>{row.backupCount.toLocaleString()}</td>
          </tr>)}
        </tbody>
        <tfoot><tr><td>รวม</td><td>{plan.totalCurrent.toLocaleString()}</td><td>{plan.totalBackup.toLocaleString()}</td></tr></tfoot>
      </table></div>
      <ul className="backup-restore-warnings">
        {plan.warnings.map((warning) => <li key={warning}><TriangleAlert size={13} /> {warning}</li>)}
      </ul>
      <label className="backup-restore-confirm">
        <input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />
        ฉันเข้าใจว่าข้อมูลปัจจุบันทั้งหมดจะถูกลบและแทนที่ด้วย Backup นี้
      </label>
      <div className="backup-restore-actions">
        <button className="danger-button" type="button" disabled={!confirmed || busy} onClick={() => void confirmRestore()}>
          <RotateCcw size={14} /> {state === "restoring" ? "กำลัง Restore..." : "ยืนยัน Restore"}
        </button>
      </div>
    </div>}

    {state === "restored" && <div className="backup-restore-done">
      <p>Restore สำเร็จเมื่อ {restoredAt ? new Date(restoredAt).toLocaleString("th-TH") : "-"}</p>
      {preRestoreBackupJson && <button className="secondary-button" type="button" onClick={downloadPreRestoreBackup}>
        <Download size={14} /> ดาวน์โหลด Backup ของสถานะก่อน Restore
      </button>}
      <p className="muted">เก็บไฟล์ Backup ก่อน Restore ไว้เผื่อต้องการย้อนกลับ</p>
    </div>}
  </div>;
}