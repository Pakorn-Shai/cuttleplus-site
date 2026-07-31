import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireAdmin();

  const { id } = await params;
  const subcategoryId = parseInt(id);

  if (!Number.isInteger(subcategoryId)) {
    return NextResponse.json(
      { error: "Invalid subcategory ID" },
      { status: 400 }
    );
  }

  const body = await request.json();
  const { name, slug, categoryId } = body;

  if (!name?.trim() || !slug?.trim() || !categoryId) {
    return NextResponse.json(
      { error: "Name, slug, and category are required" },
      { status: 400 }
    );
  }

  const categoryIdNum = parseInt(categoryId);
  if (!Number.isInteger(categoryIdNum)) {
    return NextResponse.json(
      { error: "Invalid category ID" },
      { status: 400 }
    );
  }

  try {
    const existingSubcategory = await prisma.subcategory.findUnique({
      where: { id: subcategoryId },
      include: {
        category: true,
      },
    });

    const subcategory = await prisma.subcategory.update({
      where: { id: subcategoryId },
      data: {
        name: name.trim(),
        slug: slug.trim(),
        categoryId: categoryIdNum,
      },
      include: {
        category: true,
      },
    });

    revalidatePath("/");
    revalidatePath("/sitemap.xml");
    revalidatePath(`/blog/${subcategory.category.slug}`);
    revalidatePath(`/blog/${subcategory.category.slug}/${subcategory.slug}`);

    if (existingSubcategory) {
      revalidatePath(`/blog/${existingSubcategory.category.slug}`);
      revalidatePath(`/blog/${existingSubcategory.category.slug}/${existingSubcategory.slug}`);
    }

    return NextResponse.json(subcategory);
  } catch (error: unknown) {
    if (error && typeof error === "object" && "code" in error) {
      if (error.code === "P2002") {
        return NextResponse.json(
          { error: "A subcategory with this slug already exists in this category" },
          { status: 409 }
        );
      }
      if (error.code === "P2003") {
        return NextResponse.json(
          { error: "Category not found" },
          { status: 404 }
        );
      }
      if (error.code === "P2025") {
        return NextResponse.json(
          { error: "Subcategory not found" },
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
  const subcategoryId = parseInt(id);

  if (!Number.isInteger(subcategoryId)) {
    return NextResponse.json(
      { error: "Invalid subcategory ID" },
      { status: 400 }
    );
  }

  try {
    await prisma.subcategory.delete({
      where: { id: subcategoryId },
    });

    revalidatePath("/");
    revalidatePath("/sitemap.xml");
    revalidatePath("/blog");

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2025") {
      return NextResponse.json(
        { error: "Subcategory not found" },
        { status: 404 }
      );
    }
    throw error;
  }
}
