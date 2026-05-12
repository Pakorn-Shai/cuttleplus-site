import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isValidSlug, slugFromNameOrInput } from "@/lib/slug";

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
  const slug = slugFromNameOrInput(name, String(body.slug ?? ""), "worksheet-category");

  if (!name) {
    return NextResponse.json(
      { error: "Worksheet category name is required" },
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

    if (!existingCategory) {
      return NextResponse.json(
        { error: "Worksheet category not found" },
        { status: 404 }
      );
    }

    const duplicateSlug = await prisma.worksheetCategory.findFirst({
      where: { slug, NOT: { id: categoryId } },
      select: { id: true },
    });

    if (duplicateSlug) {
      return NextResponse.json(
        { error: "This slug is already used. Please choose another slug." },
        { status: 409 }
      );
    }

    const duplicateName = await prisma.worksheetCategory.findFirst({
      where: { name, NOT: { id: categoryId } },
      select: { id: true },
    });

    if (duplicateName) {
      return NextResponse.json(
        { error: "This worksheet category name is already used. Please choose another name." },
        { status: 409 }
      );
    }

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
    category.subcategories.forEach((subcategory) => {
      revalidatePath(`/worksheets/${category.slug}/${subcategory.slug}`);
    });

    if (existingCategory && existingCategory.slug !== category.slug) {
      revalidatePath(`/worksheets/${existingCategory.slug}`);
      category.subcategories.forEach((subcategory) => {
        revalidatePath(`/worksheets/${existingCategory.slug}/${subcategory.slug}`);
      });
    }

    return NextResponse.json(category);
  } catch (error: unknown) {
    if (error && typeof error === "object" && "code" in error) {
      if (error.code === "P2002") {
        return NextResponse.json(
          { error: "This slug or category name is already used. Please choose another value." },
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
    const category = await prisma.worksheetCategory.findUnique({
      where: { id: categoryId },
      include: {
        subcategories: true,
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Worksheet category not found" },
        { status: 404 }
      );
    }

    await prisma.$transaction([
      prisma.worksheet.updateMany({
        where: { categoryId },
        data: {
          categoryId: null,
          subcategoryId: null,
        },
      }),
      prisma.worksheetCategory.delete({
        where: { id: categoryId },
      }),
    ]);

    revalidatePath("/worksheets");
    revalidatePath("/sitemap.xml");
    revalidatePath(`/worksheets/${category.slug}`);
    category.subcategories.forEach((subcategory) => {
      revalidatePath(`/worksheets/${category.slug}/${subcategory.slug}`);
    });

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
