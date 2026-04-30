import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  await requireAdmin();

  const subcategories = await prisma.subcategory.findMany({
    include: {
      category: true,
      _count: {
        select: {
          posts: true,
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
    const subcategory = await prisma.subcategory.create({
      data: {
        name: name.trim(),
        slug: slug.trim(),
        categoryId: categoryIdNum,
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json(subcategory, { status: 201 });
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
    }
    throw error;
  }
}