"use client";

import { Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

export function MediaUploadForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "error">("idle");
  const [message, setMessage] = useState("");

  async function upload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("uploading");
    setMessage("");
    try {
      const response = await fetch("/api/admin/media", { method: "POST", body: new FormData(event.currentTarget) });
      const result = await response.json() as { error?: string };
      if (response.status === 401) { window.location.href = "/login"; return; }
      if (!response.ok) { setStatus("error"); setMessage(result.error ?? "อัปโหลดไม่สำเร็จ"); return; }
      formRef.current?.reset();
      setStatus("idle");
      router.refresh();
    } catch {
      setStatus("error");
      setMessage("เชื่อมต่อระบบอัปโหลดไม่สำเร็จ");
    }
  }

  return <form className="media-upload-form" onSubmit={upload} ref={formRef}><label>เลือกรูป<input name="file" type="file" accept="image/jpeg,image/png,image/webp,image/gif" required /></label><label>Alt text<input name="altText" maxLength={240} required placeholder="อธิบายสิ่งที่อยู่ในภาพ" /></label><label>การมองเห็น<select name="visibility" defaultValue="PRIVATE"><option value="PRIVATE">Private</option><option value="UNLISTED">Unlisted</option><option value="PUBLIC">Public</option></select></label><button className="primary-button" disabled={status === "uploading"}><Upload size={14} /> {status === "uploading" ? "กำลังอัปโหลด..." : "อัปโหลดรูป"}</button>{message && <p className="upload-error">{message}</p>}<small>รองรับ JPEG, PNG, WebP และ GIF · สูงสุด 5 MB โดยค่าเริ่มต้น · ไม่รองรับ SVG เพื่อป้องกัน executable markup</small></form>;
}
