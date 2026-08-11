import Link from "next/link";
import type { Route } from "next";
import { AlertTriangle, CheckCircle2, Image, Clock, Heading, FileText, Link2, Tag } from "lucide-react";
import { contentRepository } from "@/core/content/repository";
import type { KnowledgeContent } from "@/core/content/types";

interface SEOIssue {
  contentId: string;
  title: string;
  slug: string;
  issues: string[];
  warnings: string[];
}

type Severity = "error" | "warning";

function analyzeSEO(content: KnowledgeContent): { issues: string[]; warnings: string[] } {
  const issues: string[] = [];
  const warnings: string[] = [];

  // --- Title checks ---
  if (!content.title || content.title.length < 20) issues.push("Title สั้นเกินไป (<20 ตัวอักษร) — แนะนำ 30-60 ตัวอักษร");
  else if (content.title.length > 70) warnings.push("Title ยาวเกิน 70 ตัวอักษร (อาจถูกตัดในผลค้นหา)");

  // --- Excerpt checks ---
  if (!content.excerpt || content.excerpt.length < 50) issues.push("Excerpt สั้นเกินไปหรือว่างเปล่า (แนะนำ ≥50 ตัวอักษร)");
  if (content.excerpt && content.excerpt.length > 160) warnings.push("Excerpt ยาวเกิน 160 ตัวอักษร (อาจถูกตัดในผลค้นหา)");

  // --- Slug checks ---
  if (content.slug.length > 80) warnings.push("Slug ยาวเกิน 80 ตัวอักษร");

  // --- Taxonomy checks ---
  if (!content.tags || content.tags.length === 0) issues.push("ไม่มีแท็ก — เพิ่มแท็กเพื่อช่วยในการค้นหาและ SEO");
  else if (content.tags.length > 10) warnings.push(`มี ${content.tags.length} แท็ก — แนะนำไม่เกิน 10 แท็กต่อบทความ`);
  if (content.category.slug === "uncategorized") issues.push("ไม่มีหมวดหมู่ — กำหนดหมวดหมู่ที่เหมาะสม");

  // --- Heading structure ---
  if (!content.headings || content.headings.length === 0) {
    issues.push("ไม่มี headings — เพิ่ม H2/H3 เพื่อจัดโครงสร้างเนื้อหา");
  } else {
    const hasH2 = content.headings.some((h) => h.level === 2);
    if (!hasH2) issues.push("ไม่มี H2 headings — ใช้ H2 สำหรับหัวข้อหลัก");
    // Check heading hierarchy: H3 should not appear before any H2
    const firstHeading = content.headings[0];
    if (firstHeading && firstHeading.level === 3) {
      warnings.push("Heading แรกเป็น H3 — ควรเริ่มด้วย H2 ก่อนใช้ H3");
    }
  }

  // --- Word count ---
  const wordCount = content.blocks.reduce((acc, block) => {
    if ("text" in block && typeof block.text === "string") return acc + block.text.split(/\s+/).filter(Boolean).length;
    if ("content" in block && typeof block.content === "string") return acc + block.content.split(/\s+/).filter(Boolean).length;
    if ("code" in block && typeof block.code === "string") return acc + block.code.split(/\s+/).filter(Boolean).length;
    if ("items" in block && Array.isArray(block.items)) {
      return acc + block.items.reduce((sum: number, item: unknown) => {
        if (typeof item === "string") return sum + item.split(/\s+/).filter(Boolean).length;
        if (typeof item === "object" && item !== null && "step" in item && typeof (item as { step: string }).step === "string") return sum + (item as { step: string }).step.split(/\s+/).filter(Boolean).length;
        if (typeof item === "object" && item !== null && "question" in item && typeof (item as { question: string }).question === "string") return sum + (item as { question: string }).question.split(/\s+/).filter(Boolean).length + ((item as { answer?: string }).answer?.split(/\s+/)?.filter(Boolean).length ?? 0);
        return sum;
      }, 0);
    }
    if ("expression" in block && typeof block.expression === "string") return acc + block.expression.split(/\s+/).filter(Boolean).length;
    if ("term" in block && typeof block.term === "string") return acc + block.term.split(/\s+/).filter(Boolean).length + (("text" in block && typeof block.text === "string") ? block.text.split(/\s+/).filter(Boolean).length : 0);
    return acc;
  }, 0);
  if (wordCount < 100) issues.push(`เนื้อหาสั้นเกินไป (${wordCount} คำ) — แนะนำ ≥300 คำสำหรับ SEO`);
  else if (wordCount < 300) warnings.push(`เนื้อหาค่อนข้างสั้น (${wordCount} คำ) — แนะนำ ≥300 คำสำหรับ SEO`);

  // --- Sources ---
  const hasSource = content.sources && content.sources.length > 0;
  if (!hasSource) warnings.push("ไม่มีแหล่งอ้างอิง — เพิ่มแหล่งอ้างอิงเพื่อความน่าเชื่อถือ");

  // --- Internal links ---
  const hasInternalLink = content.blocks.some((block) => {
    if ("text" in block && typeof block.text === "string" && block.text.includes("/knowledge/")) return true;
    if ("content" in block && typeof block.content === "string" && block.content.includes("/knowledge/")) return true;
    if ("url" in block && typeof block.url === "string" && block.url.includes("/knowledge/")) return true;
    return false;
  });
  if (!hasInternalLink && (!content.relatedContent || content.relatedContent.length === 0)) {
    warnings.push("ไม่มี internal links หรือ related content — เชื่อมโยงกับบทความอื่นเพื่อช่วย SEO");
  }

  // --- Image alt text ---
  const imageBlocks = content.blocks.filter((b) => b.type === "image");
  const imagesWithoutAlt = imageBlocks.filter((b) => "alt" in b && (!b.alt || b.alt.trim().length === 0));
  if (imagesWithoutAlt.length > 0) {
    issues.push(`${imagesWithoutAlt.length} รูปภาพไม่มี alt text — เพิ่มคำอธิบายสำหรับ SEO และ accessibility`);
  }
  if (imageBlocks.length === 0 && wordCount > 200) {
    warnings.push("ไม่มีรูปภาพ — เพิ่มรูปภาพเพื่อเพิ่มความน่าสนใจและ Open Graph");
  }

  // --- Content freshness ---
  if (content.publishedAt) {
    const publishedDate = new Date(content.publishedAt);
    const now = new Date();
    const monthsSinceUpdate = (now.getFullYear() - publishedDate.getFullYear()) * 12 + (now.getMonth() - publishedDate.getMonth());
    if (monthsSinceUpdate > 12) {
      warnings.push(`เนื้อหาไม่ได้รับการอัปเดตเกิน 1 ปี (${monthsSinceUpdate} เดือน) — พิจารณาทบทวนและอัปเดต`);
    } else if (monthsSinceUpdate > 6) {
      warnings.push(`เนื้อหาไม่ได้รับการอัปเดตเกิน 6 เดือน (${monthsSinceUpdate} เดือน)`);
    }
  }

  // --- Reading time vs content length ---
  if (content.readingTime < 1 && wordCount > 50) {
    warnings.push("Reading time ต่ำกว่า 1 นาที — ตรวจสอบความถูกต้อง");
  }

  return { issues, warnings };
}

function SeverityBadge({ label, severity }: { label: string; severity: Severity }) {
  const colors = severity === "error"
    ? { background: "#fff0f0", color: "#a33434", border: "#efcaca" }
    : { background: "#fff8e6", color: "#8a6d14", border: "#f0d78c" };
  return <span style={{ padding: "2px 8px", borderRadius: 999, background: colors.background, color: colors.color, border: `1px solid ${colors.border}`, fontSize: ".65rem", fontWeight: 700, whiteSpace: "nowrap" }}>{label}</span>;
}

function CategoryBreakdown({ results }: { results: SEOIssue[] }) {
  const categories = new Map<string, { name: string; count: number; issues: number }>();
  for (const r of results) {
    const key = r.issues.length > 0 ? "issues" : "clean";
    const existing = categories.get(key);
    if (existing) {
      existing.count++;
      existing.issues += r.issues.length;
    } else {
      categories.set(key, { name: key === "issues" ? "มีปัญหา" : "สุขภาพดี", count: 1, issues: r.issues.length });
    }
  }
  return null; // Used for future expansion
}

export default async function SEOReviewPage() {
  const contents = await contentRepository.listAll();
  const published = contents.filter((c) => c.status === "published");

  const results: SEOIssue[] = published.map((content) => {
    const { issues, warnings } = analyzeSEO(content);
    return {
      contentId: content.id,
      title: content.title,
      slug: content.slug,
      issues,
      warnings,
    };
  });

  const withErrors = results.filter((r) => r.issues.length > 0);
  const withWarningsOnly = results.filter((r) => r.issues.length === 0 && r.warnings.length > 0);
  const noIssues = results.filter((r) => r.issues.length === 0 && r.warnings.length === 0);
  const totalIssues = results.reduce((sum, r) => sum + r.issues.length, 0);
  const totalWarnings = results.reduce((sum, r) => sum + r.warnings.length, 0);

  return <main className="admin-content">
    <header className="admin-page-head"><div><h2>SEO Review</h2><p>ตรวจสอบสุขภาพ SEO ของเนื้อหาที่เผยแพร่แล้ว — errors ควรแก้ไข, warnings เป็นคำแนะนำ</p></div></header>

    <div style={{ display: "flex", gap: 14, marginBottom: 20, flexWrap: "wrap" }}>
      <div className="stat-card" style={{ flex: "1 1 140px" }}>
        <div className="stat-card-top"><span>เนื้อหาทั้งหมด</span></div>
        <strong>{published.length}</strong><small>published</small>
      </div>
      <div className="stat-card" style={{ flex: "1 1 140px", borderColor: withErrors.length > 0 ? "#efcaca" : "#b9e4d5" }}>
        <div className="stat-card-top"><span>⚠️ Errors</span></div>
        <strong style={{ color: withErrors.length > 0 ? "#a33434" : "#087658" }}>{totalIssues}</strong>
        <small>{withErrors.length} บทความ</small>
      </div>
      <div className="stat-card" style={{ flex: "1 1 140px", borderColor: withWarningsOnly.length > 0 ? "#f0d78c" : "#b9e4d5" }}>
        <div className="stat-card-top"><span>🔶 Warnings</span></div>
        <strong style={{ color: withWarningsOnly.length > 0 ? "#8a6d14" : "#087658" }}>{totalWarnings}</strong>
        <small>{withWarningsOnly.length} บทความ</small>
      </div>
      <div className="stat-card" style={{ flex: "1 1 140px", borderColor: "#b9e4d5" }}>
        <div className="stat-card-top"><span>✅ สุขภาพดี</span></div>
        <strong style={{ color: "#087658" }}>{noIssues.length}</strong><small>no issues</small>
      </div>
    </div>

    {/* Quick issue type summary */}
    {totalIssues > 0 && <div style={{ marginBottom: 20, display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
      <span style={{ fontSize: ".75rem", color: "#71717f", fontWeight: 600 }}>ปัญหาที่พบบ่อย:</span>
      {(() => {
        const issueCounts = new Map<string, number>();
        for (const r of withErrors) for (const issue of r.issues) issueCounts.set(issue, (issueCounts.get(issue) ?? 0) + 1);
        return [...issueCounts.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([issue, count]) => <span key={issue} style={{ padding: "2px 8px", borderRadius: 999, background: "#fff0f0", color: "#a33434", fontSize: ".65rem", fontWeight: 600, border: "1px solid #efcaca" }}>{issue.split(" —")[0]} ({count})</span>);
      })()}
    </div>}

    {/* Errors section */}
    {withErrors.length > 0 && <section style={{ marginBottom: 28 }}>
      <h3 style={{ margin: "0 0 12px", fontSize: ".9rem", display: "flex", alignItems: "center", gap: 6 }}>
        <AlertTriangle size={16} color="#a33434" /> เนื้อหาที่มี Errors ({withErrors.length})
      </h3>
      <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th style={{ width: "30%" }}>ชื่อ</th><th>ปัญหา</th><th style={{ width: 80 }}>จัดการ</th></tr></thead><tbody>{withErrors.map((item) => <tr key={item.contentId}>
        <td className="admin-table-title"><Link href={`/admin/content/${item.contentId}/edit` as Route}><strong>{item.title}</strong><span style={{ fontSize: ".7rem", color: "#71717f" }}>/{item.slug}</span></Link></td>
        <td><div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>{item.issues.map((issue, i) => <SeverityBadge key={`e-${i}`} label={issue} severity="error" />)}{item.warnings.map((w, i) => <SeverityBadge key={`w-${i}`} label={w} severity="warning" />)}</div></td>
        <td><Link className="icon-button" href={`/admin/content/${item.contentId}/edit` as Route} aria-label={`แก้ไข ${item.title}`}>แก้ไข</Link></td>
      </tr>)}</tbody></table></div>
    </section>}

    {/* Warnings-only section */}
    {withWarningsOnly.length > 0 && <section style={{ marginBottom: 28 }}>
      <h3 style={{ margin: "0 0 12px", fontSize: ".9rem", display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ color: "#8a6d14" }}>🔶</span> คำแนะนำเพิ่มเติม ({withWarningsOnly.length})
      </h3>
      <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th style={{ width: "30%" }}>ชื่อ</th><th>คำแนะนำ</th><th style={{ width: 80 }}>จัดการ</th></tr></thead><tbody>{withWarningsOnly.map((item) => <tr key={item.contentId}>
        <td className="admin-table-title"><Link href={`/admin/content/${item.contentId}/edit` as Route}><strong>{item.title}</strong><span style={{ fontSize: ".7rem", color: "#71717f" }}>/{item.slug}</span></Link></td>
        <td><div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>{item.warnings.map((w, i) => <SeverityBadge key={i} label={w} severity="warning" />)}</div></td>
        <td><Link className="icon-button" href={`/admin/content/${item.contentId}/edit` as Route} aria-label={`แก้ไข ${item.title}`}>แก้ไข</Link></td>
      </tr>)}</tbody></table></div>
    </section>}

    {/* Clean section */}
    {noIssues.length > 0 && <section>
      <h3 style={{ margin: "0 0 12px", fontSize: ".9rem", display: "flex", alignItems: "center", gap: 6 }}>
        <CheckCircle2 size={16} color="#087658" /> สุขภาพดี ({noIssues.length})
      </h3>
      <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>ชื่อ</th><th>แท็ก</th><th>หมวดหมู่</th><th>คำ</th></tr></thead><tbody>{noIssues.map((item) => {
        const content = contents.find((c) => c.id === item.contentId);
        const wordCount = content?.blocks.reduce((acc, block) => {
          if ("text" in block && typeof block.text === "string") return acc + block.text.split(/\s+/).filter(Boolean).length;
          return acc;
        }, 0) ?? 0;
        return <tr key={item.contentId}>
          <td className="admin-table-title"><Link href={`/admin/content/${item.contentId}/edit` as Route}><strong>{item.title}</strong></Link></td>
          <td>{content?.tags.join(", ") || "—"}</td>
          <td>{content?.category.name || "—"}</td>
          <td style={{ fontSize: ".75rem", color: "#71717f" }}>{wordCount}</td>
        </tr>;
      })}</tbody></table></div>
    </section>}

    {published.length === 0 && <div style={{ textAlign: "center", padding: 40, color: "#71717f" }}>
      <FileText size={32} style={{ marginBottom: 8, opacity: 0.4 }} />
      <p>ยังไม่มีเนื้อหาที่เผยแพร่ — สร้างและเผยแพร่บทความแรกเพื่อเริ่มตรวจสอบ SEO</p>
    </div>}
  </main>;
}
