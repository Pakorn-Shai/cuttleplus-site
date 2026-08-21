"use client";

import { Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const modeOptions = [
  { value: "default", label: "Default (ปรับปรุงทั่วไป)" },
  { value: "concise", label: "Concise (กระชับ)" },
  { value: "tutorial", label: "Tutorial (สอนทีละขั้น)" },
  { value: "beginner", label: "Beginner (สำหรับมือใหม่)" },
  { value: "technical", label: "Technical (เชิงเทคนิค)" },
  { value: "public", label: "Public (สำหรับทั่วไป)" },
  { value: "proofread", label: "Proofread (ตรวจไวยากรณ์)" },
];

const actionOptions = [
  { value: "rewrite", label: "Rewrite (เขียนใหม่)" },
  { value: "summarize", label: "Summarize (สรุป)" },
  { value: "expand", label: "Expand (ขยายความ)" },
  { value: "shorten", label: "Shorten (ย่อ)" },
  { value: "explain", label: "Explain (อธิบาย)" },
  { value: "steps", label: "Steps (ขั้นตอน)" },
  { value: "checklist", label: "Checklist (รายการตรวจสอบ)" },
  { value: "faq", label: "FAQ (ถาม-ตอบ)" },
  { value: "takeaways", label: "Key Takeaways (ประเด็นสำคัญ)" },
];

export function AIGenerateForm({ contents, initialContentId = "" }: { contents: { id: string; title: string }[]; initialContentId?: string }) {
  const router = useRouter();
  const [contentId, setContentId] = useState(initialContentId || contents[0]?.id || "");
  const [mode, setMode] = useState("default");
  const [action, setAction] = useState("rewrite");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function generate(event: React.FormEvent) {
    event.preventDefault();
    if (!contentId) return;
    setStatus("loading");
    setMessage("");
    try {
      const response = await fetch("/api/admin/ai/suggest", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contentId, mode, action }) });
      const result = await response.json() as { error?: string };
      if (response.status === 401) { window.location.href = "/login"; return; }
      if (!response.ok) { setStatus("error"); setMessage(result.error ?? "สร้างคำแนะนำไม่สำเร็จ"); return; }
      setStatus("success");
      setMessage("สร้าง Suggested Version แล้ว กรุณาตรวจสอบรายการด้านล่างก่อนกด Accept");
      router.refresh();
    } catch {
      setStatus("error");
      setMessage("เชื่อมต่อ AI provider ไม่สำเร็จ");
    }
  }

  return <form className="ai-generate-form" onSubmit={generate}>
    <label>เลือกเนื้อหา<select value={contentId} onChange={(event) => setContentId(event.target.value)} required>{contents.map((content) => <option value={content.id} key={content.id}>{content.title}</option>)}</select></label>
    <label>โหมด<select value={mode} onChange={(event) => setMode(event.target.value)}>{modeOptions.map((opt) => <option value={opt.value} key={opt.value}>{opt.label}</option>)}</select></label>
    <label>แอคชั่น<select value={action} onChange={(event) => setAction(event.target.value)}>{actionOptions.map((opt) => <option value={opt.value} key={opt.value}>{opt.label}</option>)}</select></label>
    <button className="primary-button" disabled={!contentId || status === "loading"}><Sparkles size={14} /> {status === "loading" ? "AI กำลังวิเคราะห์..." : "สร้าง Suggested Version"}</button>
    {message && <p className={`ai-form-message ${status}`}>{message}</p>}
    <small>ระบบส่งเฉพาะชื่อ Excerpt และ reader blocks ของบทความที่เลือกไปยัง Typhoon</small>
  </form>;
}