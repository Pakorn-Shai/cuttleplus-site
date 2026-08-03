import { NextResponse } from "next/server";
import { parseStoredDocument } from "@/core/content/document";
import { contentToJson, contentToMarkdown, type ExportableContent } from "@/core/content/export";
import { getOwnerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function attachmentHeaders(filename: string, contentType: string) {
  const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, "-");
  return {
    "Content-Type": contentType,
    "Content-Disposition": `attachment; filename="${safeFilename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
  };
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await getOwnerSession()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const format = new URL(request.url).searchParams.get("format");
  if (format !== "markdown" && format !== "json") return NextResponse.json({ error: "Unsupported export format" }, { status: 400 });

  const content = await prisma.content.findFirst({
    where: { id: (await params).id, deletedAt: null },
    include: { category: { select: { name: true, slug: true } }, tags: { include: { tag: { select: { name: true } } } } },
  });
  if (!content) return NextResponse.json({ error: "Content not found" }, { status: 404 });

  const document = parseStoredDocument(content.contentJson);
  const exportable: ExportableContent = {
    id: content.id,
    title: content.title,
    subtitle: content.subtitle,
    slug: content.slug,
    excerpt: content.excerpt,
    contentType: content.contentType,
    status: content.status,
    visibility: content.visibility,
    featured: content.featured,
    readingTime: content.readingTime,
    publishedAt: content.publishedAt,
    createdAt: content.createdAt,
    updatedAt: content.updatedAt,
    category: content.category,
    tags: content.tags.map(({ tag }) => tag.name),
    blocks: document.readerBlocks,
  };

  if (format === "markdown") {
    return new NextResponse(contentToMarkdown(exportable), { headers: attachmentHeaders(`${content.slug}.md`, "text/markdown; charset=utf-8") });
  }
  return new NextResponse(contentToJson(exportable), { headers: attachmentHeaders(`${content.slug}.json`, "application/json; charset=utf-8") });
}
