import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isValidSlug, slugFromNameOrInput } from "@/lib/slug";

export async function GET() {
  await requireAdmin();

  const subcategories = await prisma.worksheetSubcategory.findMany({
    include: {
      category: true,
      _count: {
        select: {
          worksheets: true,
        },
      },
    },
    orderBy: [
      { category: { name: "asc" } },
      { name: "asc" },
    ],
  });

  return NextResponse.json(subcategories);
}

export async function POST(request: Request) {
  await requireAdmin();

  const body = await request.json();
  const name = String(body.name ?? "").trim();
  const slug = slugFromNameOrInput(name, String(body.slug ?? ""), "worksheet-subcategory");
  const categoryId = Number(body.categoryId);

  if (!name || !body.categoryId) {
    return NextResponse.json(
      { error: "Worksheet subcategory name and category are required" },
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
    const category = await prisma.worksheetCategory.findUnique({
      where: { id: categoryId },
      select: { id: true, slug: true },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Worksheet category not found" },
        { status: 404 }
      );
    }

    const duplicateSlug = await prisma.worksheetSubcategory.findFirst({
      where: { categoryId, slug },
      select: { id: true },
    });

    if (duplicateSlug) {
      return NextResponse.json(
        { error: "This slug is already used in the selected category. Please choose another slug." },
        { status: 409 }
      );
    }

    const subcategory = await prisma.worksheetSubcategory.create({
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

    return NextResponse.json(subcategory, { status: 201 });
  } catch (error: unknown) {
    if (error && typeof error === "object" && "code" in error) {
      if (error.code === "P2002") {
        return NextResponse.json(
          { error: "This slug is already used in the selected category. Please choose another slug." },
          { status: 409 }
        );
      }

      if (error.code === "P2003") {
        return NextResponse.json(
          { error: "Worksheet category not found" },
          { status: 404 }
        );
      }
    }

    throw error;
  }
}
