import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { assertCategorySlugNotPost } from "@/lib/blog-validation";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireAdmin();

  const { id } = await params;
  const categoryId = parseInt(id);

  if (!Number.isInteger(categoryId)) {
    return NextResponse.json(
      { error: "Invalid category ID" },
      { status: 400 }
    );
  }

  const body = await request.json();
  const { name, slug } = body;

  if (!name?.trim() || !slug?.trim()) {
    return NextResponse.json(
      { error: "Name and slug are required" },
      { status: 400 }
    );
  }

  try {
    await assertCategorySlugNotPost(slug.trim());

    const existingCategory = await prisma.category.findUnique({
      where: { id: categoryId },
      select: { slug: true },
    });

    const category = await prisma.category.update({
      where: { id: categoryId },
      data: {
        name: name.trim(),
        slug: slug.trim(),
      },
      include: {
        subcategories: true,
      },
    });

    revalidatePath("/");
    revalidatePath("/sitemap.xml");
    revalidatePath(`/blog/${category.slug}`);

    if (existingCategory && existingCategory.slug !== category.slug) {
      revalidatePath(`/blog/${existingCategory.slug}`);
    }

    return NextResponse.json(category);
  } catch (error: unknown) {
    if (error && typeof error === "object" && "code" in error) {
      if (error.code === "P2002") {
        return NextResponse.json(
          { error: "A category with this name or slug already exists" },
          { status: 409 }
        );
      }
      if (error.code === "P2025") {
        return NextResponse.json(
          { error: "Category not found" },
          { status: 404 }
        );
      }
    }
    if (error instanceof Error && error.message === "Slug already used by a blog post.") {
      return NextResponse.json(
        { error: "Slug already used by a blog post" },
        { status: 409 }
      );
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
  const categoryId = parseInt(id);

  if (!Number.isInteger(categoryId)) {
    return NextResponse.json(
      { error: "Invalid category ID" },
      { status: 400 }
    );
  }

  try {
    await prisma.category.delete({
      where: { id: categoryId },
    });

    revalidatePath("/");
    revalidatePath("/sitemap.xml");
    revalidatePath("/blog");

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2025") {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }
    throw error;
  }
}
