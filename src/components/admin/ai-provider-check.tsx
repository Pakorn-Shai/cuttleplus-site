"use client";

import { CircleCheck, RefreshCw } from "lucide-react";
import { useState } from "react";

export function AIProviderCheck() {
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("ยังไม่ได้ทดสอบการเชื่อมต่อใน session นี้");

  async function check() {
    setState("loading");
    setMessage("กำลังตรวจ AI provider หลัก...");
    try {
      const response = await fetch("/api/admin/ai/health", { method: "POST" });
      const result = await response.json() as { error?: string; model?: string; provider?: string };
      if (response.status === 401) { window.location.href = "/login"; return; }
      if (!response.ok) { setState("error"); setMessage(result.error ?? "ตรวจการเชื่อมต่อไม่สำเร็จ"); return; }
      setState("success");
      const providerLabel = result.provider === "typhoon" ? "Typhoon" : result.provider === "openrouter" ? "OpenRouter" : result.provider ?? "AI";
      setMessage(`เชื่อมต่อสำเร็จ (${providerLabel}) · ${result.model}`);
    } catch {
      setState("error");
      setMessage("เรียก API ตรวจสอบไม่สำเร็จ");
    }
  }

  return <div className={`ai-provider-check ${state}`}><div>{state === "success" ? <CircleCheck size={17} /> : <RefreshCw size={17} />}<span><strong>Provider status</strong><small>{message}</small></span></div><button className="secondary-button" type="button" disabled={state === "loading"} onClick={() => void check()}>{state === "loading" ? "กำลังทดสอบ..." : "ทดสอบการเชื่อมต่อ"}</button></div>;
}
