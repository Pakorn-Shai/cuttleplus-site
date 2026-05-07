import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function isValidSlug(slug: string) {
  return SLUG_PATTERN.test(slug);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireAdmin();

  const { id } = await params;
  const categoryId = Number(id);

  if (!Number.isInteger(categoryId)) {
    return NextResponse.json(
      { error: "Invalid worksheet category ID" },
      { status: 400 }
    );
  }

  const body = await request.json();
  const name = String(body.name ?? "").trim();
  const slug = String(body.slug ?? "").trim();

  if (!name || !slug) {
    return NextResponse.json(
      { error: "Name and slug are required" },
      { status: 400 }
    );
  }

  if (!isValidSlug(slug)) {
    return NextResponse.json(
      { error: "Slug must use lowercase letters, numbers, and hyphens only" },
      { status: 400 }
    );
  }

  try {
    const existingCategory = await prisma.worksheetCategory.findUnique({
      where: { id: categoryId },
      select: { slug: true },
    });

    const category = await prisma.worksheetCategory.update({
      where: { id: categoryId },
      data: {
        name,
        slug,
      },
      include: {
        subcategories: true,
      },
    });

    revalidatePath("/worksheets");
    revalidatePath("/sitemap.xml");
    revalidatePath(`/worksheets/${category.slug}`);

    if (existingCategory && existingCategory.slug !== category.slug) {
      revalidatePath(`/worksheets/${existingCategory.slug}`);
    }

    return NextResponse.json(category);
  } catch (error: unknown) {
    if (error && typeof error === "object" && "code" in error) {
      if (error.code === "P2002") {
        return NextResponse.json(
          { error: "A worksheet category with this name or slug already exists" },
          { status: 409 }
        );
      }

      if (error.code === "P2025") {
        return NextResponse.json(
          { error: "Worksheet category not found" },
          { status: 404 }
        );
      }
    }

    throw error;
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireAdmin();

  const { id } = await params;
  const categoryId = Number(id);

  if (!Number.isInteger(categoryId)) {
    return NextResponse.json(
      { error: "Invalid worksheet category ID" },
      { status: 400 }
    );
  }

  try {
    await prisma.worksheetCategory.delete({
      where: { id: categoryId },
    });

    revalidatePath("/worksheets");
    revalidatePath("/sitemap.xml");

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2025") {
      return NextResponse.json(
        { error: "Worksheet category not found" },
        { status: 404 }
      );
    }

    throw error;
  }
}
