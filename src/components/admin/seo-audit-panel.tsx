"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Clock, FileText, RefreshCw, Search } from "lucide-react";

interface SeoIssue {
  contentId: string;
  contentTitle: string;
  contentSlug: string;
  severity: "high" | "medium" | "low";
  category: string;
  message: string;
}

interface ContentFreshnessIssue {
  contentId: string;
  contentTitle: string;
  contentSlug: string;
  publishedAt: string;
  updatedAt: string;
  monthsSinceUpdate: number;
}

interface SeoAuditResult {
  issues: SeoIssue[];
  freshnessIssues: ContentFreshnessIssue[];
  summary: {
    totalContent: number;
    withIssues: number;
    staleContent: number;
    highSeverity: number;
  };
}

const severityColors: Record<string, string> = {
  high: "#a33434",
  medium: "#765b08",
  low: "#316282",
};

const severityBg: Record<string, string> = {
  high: "#ffeded",
  medium: "#fff5d8",
  low: "#e8f3fa",
};

export function SeoAuditPanel() {
  const [data, setData] = useState<SeoAuditResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"issues" | "freshness">("issues");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/seo-audit")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load");
        return res.json();
      })
      .then((json) => {
        if (!cancelled) {
          setData(json);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, []);

  function refresh() {
    setLoading(true);
    setError(null);
    let cancelled = false;
    fetch("/api/admin/seo-audit")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load");
        return res.json();
      })
      .then((json) => {
        if (!cancelled) {
          setData(json);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }

  if (loading) {
    return (
      <div className="panel-body" style={{ textAlign: "center", padding: "40px" }}>
        <p style={{ color: "var(--muted)" }}>กำลังตรวจสอบ SEO...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="panel-body">
        <div className="admin-notice error">โหลดข้อมูลไม่สำเร็จ: {error}</div>
        <button className="secondary-button" onClick={refresh}><RefreshCw size={14} /> ลองใหม่</button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div>
      <div className="panel-head">
        <h3><Search size={16} /> SEO Audit</h3>
        <div style={{ display: "flex", gap: "8px" }}>
          <button className={`secondary-button ${tab === "issues" ? "active" : ""}`} onClick={() => setTab("issues")} style={tab === "issues" ? { background: "var(--accent-soft)", color: "var(--accent)", borderColor: "var(--accent)" } : {}}>
            Issues ({data.issues.length})
          </button>
          <button className={`secondary-button ${tab === "freshness" ? "active" : ""}`} onClick={() => setTab("freshness")} style={tab === "freshness" ? { background: "var(--accent-soft)", color: "var(--accent)", borderColor: "var(--accent)" } : {}}>
            <Clock size={14} /> เนื้อหาเก่า ({data.freshnessIssues.length})
          </button>
          <button className="icon-button" onClick={refresh} title="ตรวจสอบอีกครั้ง"><RefreshCw size={14} /></button>
        </div>
      </div>

      <div className="panel-body">
        {/* Summary cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px", marginBottom: "16px" }}>
          <div style={{ padding: "12px", border: "1px solid #e3e4e8", borderRadius: "10px", textAlign: "center" }}>
            <strong style={{ display: "block", fontSize: "1.4rem" }}>{data.summary.totalContent}</strong>
            <span style={{ color: "var(--muted)", fontSize: ".7rem" }}>บทความทั้งหมด</span>
          </div>
          <div style={{ padding: "12px", border: "1px solid #e3e4e8", borderRadius: "10px", textAlign: "center" }}>
            <strong style={{ display: "block", fontSize: "1.4rem", color: data.summary.withIssues > 0 ? "#a33434" : "#087658" }}>{data.summary.withIssues}</strong>
            <span style={{ color: "var(--muted)", fontSize: ".7rem" }}>มีปัญหา</span>
          </div>
          <div style={{ padding: "12px", border: "1px solid #e3e4e8", borderRadius: "10px", textAlign: "center" }}>
            <strong style={{ display: "block", fontSize: "1.4rem", color: data.summary.highSeverity > 0 ? "#a33434" : "#087658" }}>{data.summary.highSeverity}</strong>
            <span style={{ color: "var(--muted)", fontSize: ".7rem" }}>ความรุนแรงสูง</span>
          </div>
          <div style={{ padding: "12px", border: "1px solid #e3e4e8", borderRadius: "10px", textAlign: "center" }}>
            <strong style={{ display: "block", fontSize: "1.4rem", color: data.summary.staleContent > 0 ? "#765b08" : "#087658" }}>{data.summary.staleContent}</strong>
            <span style={{ color: "var(--muted)", fontSize: ".7rem" }}>เนื้อหาเก่า</span>
          </div>
        </div>

        {tab === "issues" ? (
          data.issues.length === 0 ? (
            <div className="empty-state" style={{ padding: "30px" }}>
              <FileText size={24} />
              <p style={{ margin: "8px 0 0" }}>🎉 ไม่พบปัญหา SEO — ทุกอย่างเรียบร้อยดี</p>
            </div>
          ) : (
            <div style={{ display: "grid", gap: "8px", maxHeight: "500px", overflow: "auto" }}>
              {data.issues.map((issue, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: "10px", alignItems: "start", padding: "10px 12px", border: "1px solid #e3e4e8", borderRadius: "9px", background: severityBg[issue.severity] }}>
                  <span style={{ padding: "2px 8px", borderRadius: "999px", background: severityColors[issue.severity], color: "#fff", fontSize: ".6rem", fontWeight: 800, textTransform: "uppercase", whiteSpace: "nowrap" }}>{issue.severity}</span>
                  <div>
                    <strong style={{ fontSize: ".78rem" }}>{issue.contentTitle}</strong>
                    <span style={{ display: "block", color: "var(--muted)", fontSize: ".68rem" }}>{issue.category}: {issue.message}</span>
                  </div>
                  <Link href={`/admin/content/${issue.contentId}/edit`} className="text-link" style={{ fontSize: ".7rem", whiteSpace: "nowrap" }}>แก้ไข →</Link>
                </div>
              ))}
            </div>
          )
        ) : (
          data.freshnessIssues.length === 0 ? (
            <div className="empty-state" style={{ padding: "30px" }}>
              <Clock size={24} />
              <p style={{ margin: "8px 0 0" }}>🎉 เนื้อหาทั้งหมดอัปเดตภายใน 6 เดือน</p>
            </div>
          ) : (
            <div style={{ display: "grid", gap: "8px", maxHeight: "500px", overflow: "auto" }}>
              {data.freshnessIssues.map((item, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: "10px", alignItems: "center", padding: "10px 12px", border: "1px solid #e3e4e8", borderRadius: "9px" }}>
                  <AlertTriangle size={16} style={{ color: "#765b08" }} />
                  <div>
                    <strong style={{ fontSize: ".78rem" }}>{item.contentTitle}</strong>
                    <span style={{ display: "block", color: "var(--muted)", fontSize: ".68rem" }}>
                      เผยแพร่ {new Date(item.publishedAt).toLocaleDateString("th-TH")} · ไม่อัปเดตมา {item.monthsSinceUpdate} เดือน
                    </span>
                  </div>
                  <Link href={`/admin/content/${item.contentId}/edit`} className="text-link" style={{ fontSize: ".7rem", whiteSpace: "nowrap" }}>อัปเดต →</Link>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}