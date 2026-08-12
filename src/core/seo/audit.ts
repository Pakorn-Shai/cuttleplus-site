import "server-only";

import { prisma } from "@/lib/prisma";
import { parseStoredDocument } from "@/core/content/document";
import type { ContentBlock } from "@/core/content/types";

export interface SeoIssue {
  contentId: string;
  contentTitle: string;
  contentSlug: string;
  severity: "high" | "medium" | "low";
  category: string;
  message: string;
}

export interface ContentFreshnessIssue {
  contentId: string;
  contentTitle: string;
  contentSlug: string;
  publishedAt: string;
  updatedAt: string;
  monthsSinceUpdate: number;
}

export interface SeoAuditResult {
  issues: SeoIssue[];
  freshnessIssues: ContentFreshnessIssue[];
  summary: {
    totalContent: number;
    withIssues: number;
    staleContent: number;
    highSeverity: number;
  };
}

/**
 * Run a comprehensive SEO/AEO audit on all published content.
 * Checks: missing alt text, thin content, missing meta description,
 * heading structure, missing sources, content freshness.
 */
export async function runSeoAudit(): Promise<SeoAuditResult> {
  const contents = await prisma.content.findMany({
    where: { status: "PUBLISHED", deletedAt: null },
    include: { category: { select: { name: true } }, sources: true },
    orderBy: { updatedAt: "desc" },
  });

  const issues: SeoIssue[] = [];
  const freshnessIssues: ContentFreshnessIssue[] = [];
  const now = new Date();
  const staleThresholdMonths = 6;

  for (const content of contents) {
    const stored = parseStoredDocument(content.contentJson);
    const blocks = stored.readerBlocks;

    // Check title length
    if (content.title.length < 10) {
      issues.push({ contentId: content.id, contentTitle: content.title, contentSlug: content.slug, severity: "high", category: "Title", message: "Title สั้นเกินไป (น้อยกว่า 10 ตัวอักษร)" });
    } else if (content.title.length > 120) {
      issues.push({ contentId: content.id, contentTitle: content.title, contentSlug: content.slug, severity: "medium", category: "Title", message: "Title ยาวเกินไป (มากกว่า 120 ตัวอักษร)" });
    }

    // Check excerpt/meta description
    if (!content.excerpt || content.excerpt.length < 20) {
      issues.push({ contentId: content.id, contentTitle: content.title, contentSlug: content.slug, severity: "high", category: "Meta Description", message: "ไม่มี excerpt หรือสั้นเกินไป (น้อยกว่า 20 ตัวอักษร)" });
    } else if (content.excerpt.length > 300) {
      issues.push({ contentId: content.id, contentTitle: content.title, contentSlug: content.slug, severity: "low", category: "Meta Description", message: "Excerpt ยาวเกินไป (มากกว่า 300 ตัวอักษร) อาจถูกตัดใน搜索结果" });
    }

    // Check heading structure
    const headings = blocks.filter((b) => b.type === "heading");
    if (headings.length === 0 && blocks.length > 3) {
      issues.push({ contentId: content.id, contentTitle: content.title, contentSlug: content.slug, severity: "medium", category: "Heading Structure", message: "ไม่มี heading ในเนื้อหา — เพิ่ม h2/h3 เพื่อจัดโครงสร้าง" });
    }

    // Check for images without alt text
    const images = blocks.filter((b) => b.type === "image") as Extract<ContentBlock, { type: "image" }>[];
    for (const img of images) {
      if (!img.alt || img.alt.length < 3) {
        issues.push({ contentId: content.id, contentTitle: content.title, contentSlug: content.slug, severity: "medium", category: "Alt Text", message: `รูปภาพไม่มี alt text หรือสั้นเกินไป` });
        break; // One issue per content for alt text
      }
    }

    // Check thin content
    const plainText = content.plainText || "";
    if (plainText.length < 200) {
      issues.push({ contentId: content.id, contentTitle: content.title, contentSlug: content.slug, severity: "high", category: "Thin Content", message: `เนื้อหาสั้นเกินไป (${plainText.length} ตัวอักษร) — ควรมีอย่างน้อย 200 ตัวอักษร` });
    }

    // Check sources
    if (content.sources.length === 0 && content.contentType !== "QUICK_NOTE") {
      issues.push({ contentId: content.id, contentTitle: content.title, contentSlug: content.slug, severity: "low", category: "Sources", message: "ไม่มีแหล่งอ้างอิง — เพิ่ม source เพื่อความน่าเชื่อถือ" });
    }

    // Check content freshness
    if (content.publishedAt) {
      const monthsSinceUpdate = monthsBetween(content.updatedAt, now);
      if (monthsSinceUpdate >= staleThresholdMonths) {
        freshnessIssues.push({
          contentId: content.id,
          contentTitle: content.title,
          contentSlug: content.slug,
          publishedAt: content.publishedAt.toISOString(),
          updatedAt: content.updatedAt.toISOString(),
          monthsSinceUpdate,
        });
      }
    }
  }

  const contentWithIssues = new Set(issues.map((i) => i.contentId)).size;

  return {
    issues,
    freshnessIssues: freshnessIssues.sort((a, b) => b.monthsSinceUpdate - a.monthsSinceUpdate),
    summary: {
      totalContent: contents.length,
      withIssues: contentWithIssues,
      staleContent: freshnessIssues.length,
      highSeverity: issues.filter((i) => i.severity === "high").length,
    },
  };
}

function monthsBetween(from: Date, to: Date): number {
  return (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
}