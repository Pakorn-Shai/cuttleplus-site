"use client";

import { Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function AIGenerateForm({ contents, initialContentId = "" }: { contents: { id: string; title: string }[]; initialContentId?: string }) {
  const router = useRouter();
  const [contentId, setContentId] = useState(initialContentId || contents[0]?.id || "");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState("");

  async function generate(event: React.FormEvent) {
    event.preventDefault();
    if (!contentId) return;
    setStatus("loading");
    setMessage("");
    try {
      const response = await fetch("/api/admin/ai/suggest", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contentId }) });
      const result = await response.json() as { error?: string };
      if (response.status === 401) { window.location.href = "/login"; return; }
      if (!response.ok) { setStatus("error"); setMessage(result.error ?? "สร้างคำแนะนำไม่สำเร็จ"); return; }
      setStatus("idle");
      router.refresh();
    } catch {
      setStatus("error");
      setMessage("เชื่อมต่อ AI provider ไม่สำเร็จ");
    }
  }

  return <form className="ai-generate-form" onSubmit={generate}><label>เลือกเนื้อหา<select value={contentId} onChange={(event) => setContentId(event.target.value)} required>{contents.map((content) => <option value={content.id} key={content.id}>{content.title}</option>)}</select></label><button className="primary-button" disabled={!contentId || status === "loading"}><Sparkles size={14} /> {status === "loading" ? "AI กำลังวิเคราะห์..." : "สร้าง Suggested Version"}</button>{message && <p className="upload-error">{message}</p>}<small>ระบบส่งเฉพาะชื่อ Excerpt และ reader blocks ของบทความที่เลือกไปยัง OpenRouter</small></form>;
}
