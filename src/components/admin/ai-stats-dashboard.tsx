"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, BarChart3, CheckCircle2, Clock3, Coins, Hash, XCircle } from "lucide-react";

interface AIStats {
  totals: { jobs: number; inputTokens: number; outputTokens: number; estimatedCost: number };
  successRate: string;
  completedJobs: number;
  failedJobs: number;
  queuedJobs: number;
  runningJobs: number;
  cancelledJobs: number;
  byModel: { model: string; jobs: number; inputTokens: number; outputTokens: number; estimatedCost: number }[];
  recentFailures: { id: string; model: string; jobType: string; errorMessage: string | null; createdAt: string; contentTitle: string | null }[];
  daily: { date: string; jobs: number; inputTokens: number; outputTokens: number; cost: number }[];
  budget?: { monthlyLimit: number; usageThisMonth: number; percent: number; warning: boolean };
}

function formatTokens(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function formatCost(n: number) {
  return `$${n.toFixed(4)}`;
}

export function AIStatsDashboard() {
  const [stats, setStats] = useState<AIStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/ai/stats")
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load AI stats");
        const data = (await res.json()) as AIStats;
        setStats(data);
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Unknown error"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="ai-stats-loading"><p className="muted">กำลังโหลดสถิติ AI...</p></div>;
  if (error) return <div className="ai-stats-error"><p className="muted">โหลดสถิติ AI ไม่สำเร็จ: {error}</p></div>;
  if (!stats) return null;

  return (
    <div className="ai-stats-dashboard">
      <div className="ai-stats-grid">
        <div className="ai-stat-card"><Hash size={16} /><div><strong>{stats.totals.jobs}</strong><span>งานทั้งหมด</span></div></div>
        <div className="ai-stat-card success"><CheckCircle2 size={16} /><div><strong>{stats.completedJobs}</strong><span>สำเร็จ ({stats.successRate})</span></div></div>
        <div className="ai-stat-card danger"><XCircle size={16} /><div><strong>{stats.failedJobs}</strong><span>ล้มเหลว</span></div></div>
        <div className="ai-stat-card"><Clock3 size={16} /><div><strong>{stats.queuedJobs + stats.runningJobs}</strong><span>รอดำเนินการ/กำลังทำงาน</span></div></div>
        <div className="ai-stat-card"><Coins size={16} /><div><strong>{formatCost(stats.totals.estimatedCost)}</strong><span>ค่าใช้จ่ายประมาณ</span></div></div>
        <div className="ai-stat-card"><BarChart3 size={16} /><div><strong>{formatTokens(stats.totals.inputTokens + stats.totals.outputTokens)}</strong><span>Tokens ทั้งหมด (in: {formatTokens(stats.totals.inputTokens)} / out: {formatTokens(stats.totals.outputTokens)})</span></div></div>
      </div>

      {stats.budget && stats.budget.monthlyLimit > 0 && (
        <section className="ai-stats-section">
          <h4>งบประมาณรายเดือน</h4>
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: ".8rem" }}>
              <span>{formatCost(stats.budget.usageThisMonth)} / {formatCost(stats.budget.monthlyLimit)}</span>
              <span style={{ color: stats.budget.percent >= 90 ? "#a33434" : stats.budget.percent >= 80 ? "#8a6d14" : "#71717f" }}>{stats.budget.percent}%</span>
            </div>
            <div style={{ height: 8, borderRadius: 4, background: "#e4e4e7", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${stats.budget.percent}%`, borderRadius: 4, background: stats.budget.percent >= 90 ? "#a33434" : stats.budget.percent >= 80 ? "#d4a017" : "#087658", transition: "width .3s" }} />
            </div>
          </div>
          {stats.budget.warning && (
            <div className="admin-alert" style={{ marginTop: 8 }}>
              <AlertTriangle size={14} /> {stats.budget.percent >= 100
                ? "ถึงงบประมาณรายเดือนแล้ว — AI requests จะถูกปฏิเสธจนกว่าจะเพิ่ม budget หรือเริ่มเดือนใหม่"
                : `ใช้ไป ${stats.budget.percent}% ของงบประมาณรายเดือน — พิจารณาเพิ่ม budget ใน Settings`}
            </div>
          )}
        </section>
      )}

      {stats.byModel.length > 0 && (
        <section className="ai-stats-section">
          <h4>จำแนกตาม Model</h4>
          <div className="ai-model-table-wrap">
            <table className="ai-model-table">
              <thead><tr><th>Model</th><th>Jobs</th><th>Input Tokens</th><th>Output Tokens</th><th>Cost</th></tr></thead>
              <tbody>
                {stats.byModel.map((m) => (
                  <tr key={m.model}><td className="model-name">{m.model}</td><td>{m.jobs}</td><td>{formatTokens(m.inputTokens)}</td><td>{formatTokens(m.outputTokens)}</td><td>{formatCost(m.estimatedCost)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {stats.daily.length > 0 && (
        <section className="ai-stats-section">
          <h4>การใช้งานรายวัน</h4>
          <div className="ai-model-table-wrap">
            <table className="ai-model-table">
              <thead><tr><th>วันที่</th><th>Jobs</th><th>Input Tokens</th><th>Output Tokens</th><th>Cost</th></tr></thead>
              <tbody>
                {stats.daily.slice(-14).reverse().map((d) => (
                  <tr key={d.date}><td>{d.date}</td><td>{d.jobs}</td><td>{formatTokens(d.inputTokens)}</td><td>{formatTokens(d.outputTokens)}</td><td>{formatCost(d.cost)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {stats.recentFailures.length > 0 && (
        <section className="ai-stats-section">
          <h4><AlertTriangle size={16} /> งานล้มเหลวล่าสุด</h4>
          <div className="ai-failure-list">
            {stats.recentFailures.map((f) => (
              <div className="ai-failure-row" key={f.id}>
                <div><strong>{f.jobType}</strong> · {f.model} · {f.createdAt.slice(0, 16).replace("T", " ")}</div>
                {f.contentTitle && <small>{f.contentTitle}</small>}
                {f.errorMessage && <p className="ai-failure-error">{f.errorMessage}</p>}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}