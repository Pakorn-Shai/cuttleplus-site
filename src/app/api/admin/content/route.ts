import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { saveEditorDraft } from "@/core/content/editor-service";
import { contentBlockSchema } from "@/core/content/document";
import { getOwnerSession } from "@/lib/auth";
import { consumeRateLimit } from "@/lib/rate-limit";
import { hasTrustedOrigin } from "@/lib/request-security";

const draftSchema = z.object({
  id: z.string().cuid().optional(),
  title: z.string().max(240),
  slug: z.string().max(240),
  excerpt: z.string().max(500),
  categorySlug: z.string().max(160),
  tags: z.array(z.string().max(80)).max(20),
  visibility: z.enum(["private", "unlisted", "public"]),
  contentType: z.enum(["QUICK_NOTE", "KNOWLEDGE_NOTE", "TUTORIAL", "ARTICLE", "CODE_SNIPPET", "TROUBLESHOOTING", "CHEAT_SHEET", "REFERENCE", "LEARNING_LOG", "PROJECT_NOTE", "CASE_STUDY", "CHECKLIST"]),
  editorBlocks: z.array(z.unknown()).max(2000),
  learningBlocks: z.array(contentBlockSchema).max(100).refine((blocks) => blocks.every((block) => block.type === "executable-code" || block.type === "formula-example" || block.type === "automation-script"), "Only learning blocks are allowed").default([]),
  createRevision: z.boolean().optional(),
});

export async function POST(request: Request) {
  const owner = await getOwnerSession();
  if (!owner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasTrustedOrigin(request)) return NextResponse.json({ error: "Untrusted origin" }, { status: 403 });
  const rateLimit = await consumeRateLimit("content-write", owner.id, 180, 60);
  if (!rateLimit.allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": String(rateLimit.retryAfter) } });
  const parsed = draftSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid draft", details: parsed.error.flatten() }, { status: 400 });

  try {
    const saved = await saveEditorDraft(parsed.data, owner.id);
    revalidatePath("/");
    revalidatePath("/knowledge");
    revalidatePath(`/knowledge/${saved.slug}`);
    revalidatePath("/categories");
    revalidatePath("/categories/[slug]", "page");
    revalidatePath("/tags");
    revalidatePath("/tags/[slug]", "page");
    revalidatePath("/series");
    revalidatePath("/series/[slug]", "page");
    revalidatePath("/collections");
    revalidatePath("/collections/[slug]", "page");
    revalidatePath("/sitemap.xml");
    revalidatePath("/admin");
    revalidatePath("/admin/content");
    return NextResponse.json(saved);
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_SLUG") return NextResponse.json({ error: "Slug is required" }, { status: 400 });
    if (error instanceof Error && error.message === "SENSITIVE_LEARNING_BLOCK") return NextResponse.json({ error: "Sensitive data detected in learning block" }, { status: 400 });
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
    console.error("Unable to save content draft", error);
    return NextResponse.json({ error: "Unable to save draft" }, { status: 500 });
  }
}
