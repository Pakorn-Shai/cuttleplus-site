"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, Lightbulb, RefreshCw, Tag } from "lucide-react";

interface LearningSummary {
  period: string;
  totalContent: number;
  categories: string[];
  topTags: string[];
  summary: string;
  suggestedNextTopics: string[];
}

interface LearningPathsData {
  summary: LearningSummary;
  paths: {
    existingSeries: { name: string; slug: string; progress: number; totalItems: number }[];
    suggestedPaths: { title: string; description: string; topics: string[] }[];
  };
}

export function LearningPathsPanel() {
  const [data, setData] = useState<LearningPathsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/learning-paths")
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
    fetch("/api/admin/learning-paths")
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
        <p style={{ color: "var(--muted)" }}>กำลังวิเคราะห์เส้นทางการเรียนรู้...</p>
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

  const { summary, paths } = data;

  return (
    <div>
      <div className="panel-head">
        <h3><Lightbulb size={16} /> Learning Insights</h3>
        <button className="icon-button" onClick={refresh} title="โหลดใหม่"><RefreshCw size={14} /></button>
      </div>
      <div className="panel-body">
        {/* Learning Summary */}
        {summary.totalContent > 0 && (
          <div style={{ marginBottom: "20px", padding: "16px", border: "1px solid #e3e4e8", borderRadius: "12px", background: "#fafafb" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
              <BookOpen size={16} style={{ color: "var(--accent)" }} />
              <strong style={{ fontSize: ".85rem" }}>สรุปการเรียนรู้ ({summary.period})</strong>
            </div>
            <p style={{ margin: "0 0 12px", color: "var(--muted)", fontSize: ".78rem", lineHeight: "1.6" }}>{summary.summary}</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "10px" }}>
              {summary.categories.map((cat) => (
                <span key={cat} style={{ padding: "3px 10px", borderRadius: "999px", background: "var(--accent-soft)", color: "var(--accent)", fontSize: ".7rem", fontWeight: 700 }}>{cat}</span>
              ))}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
              {summary.topTags.slice(0, 8).map((tag) => (
                <span key={tag} className="tag">{tag}</span>
              ))}
            </div>
            {summary.suggestedNextTopics.length > 0 && (
              <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid #e3e4e8" }}>
                <small style={{ color: "var(--muted)", fontSize: ".68rem", fontWeight: 700, textTransform: "uppercase" }}>หัวข้อแนะนำถัดไป</small>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "6px" }}>
                  {summary.suggestedNextTopics.map((topic) => (
                    <span key={topic} style={{ padding: "4px 10px", borderRadius: "8px", border: "1px solid #b9e4d5", background: "#ecfbf5", color: "#087658", fontSize: ".72rem", fontWeight: 600 }}>{topic}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Existing Series */}
        {paths.existingSeries.length > 0 && (
          <div style={{ marginBottom: "16px" }}>
            <h4 style={{ margin: "0 0 10px", fontSize: ".82rem", display: "flex", alignItems: "center", gap: "6px" }}>
              <BookOpen size={14} /> Series ที่มีอยู่
            </h4>
            <div style={{ display: "grid", gap: "6px" }}>
              {paths.existingSeries.map((s) => (
                <Link key={s.slug} href={`/series/${s.slug}`} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", border: "1px solid #e3e4e8", borderRadius: "9px", fontSize: ".78rem" }}>
                  <span>{s.name}</span>
                  <span style={{ color: "var(--muted)", fontSize: ".7rem" }}>{s.totalItems} บท</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Suggested Paths */}
        {paths.suggestedPaths.length > 0 && (
          <div>
            <h4 style={{ margin: "0 0 10px", fontSize: ".82rem", display: "flex", alignItems: "center", gap: "6px" }}>
              <Lightbulb size={14} /> เส้นทางการเรียนรู้ที่แนะนำ
            </h4>
            <div style={{ display: "grid", gap: "10px" }}>
              {paths.suggestedPaths.map((p, i) => (
                <div key={i} style={{ padding: "14px", border: "1px solid #e3e4e8", borderRadius: "10px" }}>
                  <strong style={{ fontSize: ".8rem" }}>{p.title}</strong>
                  <p style={{ margin: "4px 0 8px", color: "var(--muted)", fontSize: ".7rem" }}>{p.description}</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                    {p.topics.map((topic) => (
                      <span key={topic} className="tag" style={{ fontSize: ".68rem" }}>{topic}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {paths.existingSeries.length === 0 && paths.suggestedPaths.length === 0 && (
          <div className="empty-state" style={{ padding: "30px" }}>
            <BookOpen size={24} />
            <p style={{ margin: "8px 0 0" }}>สร้าง Series หรือเพิ่ม Relations เพื่อให้ระบบแนะนำเส้นทางการเรียนรู้</p>
          </div>
        )}
      </div>
    </div>
  );
}