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
  const subcategoryId = Number(id);

  if (!Number.isInteger(subcategoryId)) {
    return NextResponse.json(
      { error: "Invalid worksheet subcategory ID" },
      { status: 400 }
    );
  }

  const body = await request.json();
  const name = String(body.name ?? "").trim();
  const slug = String(body.slug ?? "").trim();
  const categoryId = Number(body.categoryId);

  if (!name || !slug || !body.categoryId) {
    return NextResponse.json(
      { error: "Name, slug, and category are required" },
      { status: 400 }
    );
  }

  if (!Number.isInteger(categoryId)) {
    return NextResponse.json(
      { error: "Invalid worksheet category ID" },
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
    const existingSubcategory = await prisma.worksheetSubcategory.findUnique({
      where: { id: subcategoryId },
      include: {
        category: true,
      },
    });

    const subcategory = await prisma.worksheetSubcategory.update({
      where: { id: subcategoryId },
      data: {
        name,
        slug,
        categoryId,
      },
      include: {
        category: true,
      },
    });

    revalidatePath("/worksheets");
    revalidatePath("/sitemap.xml");
    revalidatePath(`/worksheets/${subcategory.category.slug}`);
    revalidatePath(`/worksheets/${subcategory.category.slug}/${subcategory.slug}`);

    if (existingSubcategory) {
      revalidatePath(`/worksheets/${existingSubcategory.category.slug}`);
      revalidatePath(`/worksheets/${existingSubcategory.category.slug}/${existingSubcategory.slug}`);
    }

    return NextResponse.json(subcategory);
  } catch (error: unknown) {
    if (error && typeof error === "object" && "code" in error) {
      if (error.code === "P2002") {
        return NextResponse.json(
          { error: "A worksheet subcategory with this slug already exists in this category" },
          { status: 409 }
        );
      }

      if (error.code === "P2003") {
        return NextResponse.json(
          { error: "Worksheet category not found" },
          { status: 404 }
        );
      }

      if (error.code === "P2025") {
        return NextResponse.json(
          { error: "Worksheet subcategory not found" },
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
  const subcategoryId = Number(id);

  if (!Number.isInteger(subcategoryId)) {
    return NextResponse.json(
      { error: "Invalid worksheet subcategory ID" },
      { status: 400 }
    );
  }

  try {
    await prisma.worksheetSubcategory.delete({
      where: { id: subcategoryId },
    });

    revalidatePath("/worksheets");
    revalidatePath("/sitemap.xml");

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2025") {
      return NextResponse.json(
        { error: "Worksheet subcategory not found" },
        { status: 404 }
      );
    }

    throw error;
  }
}
