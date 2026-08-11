import { prisma } from "@/lib/prisma";
import { Shield } from "lucide-react";

export default async function AuditLogPage({ searchParams }: { searchParams: Promise<{ action?: string; entity?: string }> }) {
  const [logs, query] = await Promise.all([
    prisma.auditLog.findMany({
      include: { user: { select: { email: true, name: true } } },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    searchParams,
  ]);

  const actionFilter = query.action ?? "";
  const entityFilter = query.entity ?? "";
  const filtered = logs.filter((log) => {
    if (actionFilter && !log.action.toLowerCase().includes(actionFilter.toLowerCase())) return false;
    if (entityFilter && !log.entityType.toLowerCase().includes(entityFilter.toLowerCase())) return false;
    return true;
  });

  const uniqueActions = [...new Set(logs.map((l) => l.action))].sort();
  const uniqueEntities = [...new Set(logs.map((l) => l.entityType))].sort();

  return <main className="admin-content">
    <header className="admin-page-head"><div><h2>Audit Log</h2><p>บันทึกการกระทำทั้งหมดในระบบ พร้อมข้อมูลผู้ทำและเวลา</p></div></header>
    <form className="admin-filters" method="get">
      <select className="filter-select" name="action" defaultValue={actionFilter}>
        <option value="">ทุก Action</option>
        {uniqueActions.map((a) => <option value={a} key={a}>{a}</option>)}
      </select>
      <select className="filter-select" name="entity" defaultValue={entityFilter}>
        <option value="">ทุก Entity</option>
        {uniqueEntities.map((e) => <option value={e} key={e}>{e}</option>)}
      </select>
      <button className="secondary-button" type="submit">กรอง</button>
      {(actionFilter || entityFilter) && <a className="text-link" href="/admin/audit">ล้าง</a>}
    </form>
    <p className="admin-result-count">แสดง {filtered.length} จาก {logs.length} รายการ</p>
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead><tr><th>เวลา</th><th>Action</th><th>Entity</th><th>Entity ID</th><th>User</th><th>Metadata</th></tr></thead>
        <tbody>{filtered.map((log) => <tr key={log.id}>
          <td style={{ whiteSpace: "nowrap", fontSize: ".7rem" }}>{log.createdAt.toISOString().slice(0, 19).replace("T", " ")}</td>
          <td><span className="status-badge" style={{ background: getActionColor(log.action).bg, color: getActionColor(log.action).fg }}>{log.action}</span></td>
          <td>{log.entityType}</td>
          <td style={{ maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}><code style={{ fontSize: ".65rem" }}>{log.entityId ?? "—"}</code></td>
          <td>{log.user?.email ?? log.user?.name ?? "—"}</td>
          <td style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: ".68rem" }}>{log.metadataJson ? JSON.stringify(log.metadataJson) : "—"}</td>
        </tr>)}</tbody>
      </table>
      {!filtered.length && <div className="empty-state admin-table-empty"><Shield size={28} /><h3>ไม่มี audit log</h3><p>ยังไม่มีการกระทำที่บันทึก</p></div>}
    </div>
  </main>;
}

function getActionColor(action: string): { bg: string; fg: string } {
  if (action.includes("CREATED") || action.includes("PUBLISHED") || action.includes("ACCEPTED")) return { bg: "#e5f8f1", fg: "#087658" };
  if (action.includes("DELETED") || action.includes("FAILED") || action.includes("REVOKED")) return { bg: "#ffeded", fg: "#a33434" };
  if (action.includes("RESTORED") || action.includes("RETRIED")) return { bg: "#e8f3fa", fg: "#316282" };
  if (action.includes("SCHEDULED") || action.includes("UPDATED") || action.includes("MERGED")) return { bg: "#f5f4ff", fg: "#554bc3" };
  return { bg: "#f7f7fa", fg: "#565762" };
}