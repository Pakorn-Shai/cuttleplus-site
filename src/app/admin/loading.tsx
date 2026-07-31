export default function AdminLoading() {
  return (
    <main className="admin-content" aria-live="polite">
      <span className="eyebrow">Knowledge Hub Admin</span>
      <h1>กำลังโหลดพื้นที่จัดการ...</h1>
      <div className="stat-grid" style={{ marginTop: 28 }}>
        {[1, 2, 3].map((item) => (
          <div className="stat-card" key={item}>
            <div style={{ width: "45%", height: 12, borderRadius: 6, background: "#e8e8eb" }} />
            <div style={{ width: "70%", height: 34, marginTop: 18, borderRadius: 8, background: "#f1f1f3" }} />
          </div>
        ))}
      </div>
    </main>
  );
}