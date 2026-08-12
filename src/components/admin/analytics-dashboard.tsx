"use client";

import { useEffect, useState } from "react";

interface PageViewSummary {
  totalViews: number;
  todayViews: number;
  topPaths: { path: string; views: number }[];
  viewsByDay: { date: string; views: number }[];
  topReferrers: { referrer: string; views: number }[];
}

export function AnalyticsDashboard() {
  const [data, setData] = useState<PageViewSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(30);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/admin/analytics?days=${days}`)
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
  }, [days]);

  if (loading) {
    return (
      <div className="analytics-loading">
        <p>กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analytics-error">
        <p>โหลดข้อมูลไม่สำเร็จ: {error}</p>
      </div>
    );
  }

  if (!data) return null;

  const maxDailyViews = Math.max(1, ...data.viewsByDay.map((d) => d.views));

  return (
    <div className="analytics-dashboard">
      <div className="analytics-header">
        <h2>📊 Analytics</h2>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="analytics-days-select"
        >
          <option value={7}>7 วันล่าสุด</option>
          <option value={30}>30 วันล่าสุด</option>
          <option value={90}>90 วันล่าสุด</option>
          <option value={365}>1 ปีล่าสุด</option>
        </select>
      </div>

      <div className="analytics-cards">
        <div className="analytics-card">
          <span className="analytics-card-value">{data.totalViews.toLocaleString()}</span>
          <span className="analytics-card-label">Page Views ทั้งหมด</span>
        </div>
        <div className="analytics-card">
          <span className="analytics-card-value">{data.todayViews.toLocaleString()}</span>
          <span className="analytics-card-label">วันนี้</span>
        </div>
      </div>

      {data.viewsByDay.length > 0 && (
        <div className="analytics-section">
          <h3>Views รายวัน</h3>
          <div className="analytics-bar-chart">
            {data.viewsByDay.map((day) => (
              <div key={day.date} className="analytics-bar-item" title={`${day.date}: ${day.views} views`}>
                <div
                  className="analytics-bar"
                  style={{ height: `${(day.views / maxDailyViews) * 100}%` }}
                />
                <span className="analytics-bar-label">
                  {new Date(day.date).toLocaleDateString("th-TH", { day: "numeric", month: "short" })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="analytics-grid">
        <div className="analytics-section">
          <h3>หน้าที่มีคนดูมากที่สุด</h3>
          {data.topPaths.length === 0 ? (
            <p className="analytics-empty">ยังไม่มีข้อมูล</p>
          ) : (
            <ul className="analytics-list">
              {data.topPaths.slice(0, 10).map((item) => (
                <li key={item.path} className="analytics-list-item">
                  <a href={item.path} target="_blank" rel="noopener noreferrer" className="analytics-path">
                    {item.path}
                  </a>
                  <span className="analytics-count">{item.views.toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="analytics-section">
          <h3>แหล่งที่มา</h3>
          {data.topReferrers.length === 0 ? (
            <p className="analytics-empty">ยังไม่มีข้อมูล</p>
          ) : (
            <ul className="analytics-list">
              {data.topReferrers.map((item) => (
                <li key={item.referrer} className="analytics-list-item">
                  <span className="analytics-referrer">{item.referrer}</span>
                  <span className="analytics-count">{item.views.toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <p className="analytics-privacy-note">
        🔒 ระบบเก็บเฉพาะ path และ referrer domain — ไม่เก็บ IP, user agent หรือข้อมูลส่วนบุคคล
      </p>
    </div>
  );
}