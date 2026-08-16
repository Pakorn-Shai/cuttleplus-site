import { Eye, X } from "lucide-react";

export function ThemePreviewBar({ themeName, isActiveTheme }: { themeName: string; isActiveTheme: boolean }) {
  return (
    <div className="theme-preview-banner" role="status">
      <span className="theme-preview-banner-label">
        <Eye size={14} aria-hidden="true" />
        กำลังดูตัวอย่างธีม <strong>{themeName}</strong>
        {isActiveTheme ? " (ธีมที่ใช้งานอยู่)" : " — ผู้เยี่ยมชมยังคงเห็นธีมที่ใช้งานอยู่"}
      </span>
      <span className="theme-preview-banner-actions">
        <a href="/admin/themes">จัดการธีม</a>
        <a href="/api/theme-preview?exit=1"><X size={12} aria-hidden="true" /> ออกจากตัวอย่าง</a>
      </span>
    </div>
  );
}