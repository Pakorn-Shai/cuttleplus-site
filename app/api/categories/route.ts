import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  await requireAdmin();

  const categories = await prisma.category.findMany({
    include: {
      subcategories: true,
      _count: {
        select: {
          posts: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  return NextResponse.json(categories);
}

export async function POST(request: Request) {
  await requireAdmin();

  const body = await request.json();
  const { name, slug } = body;

  if (!name?.trim() || !slug?.trim()) {
    return NextResponse.json(
      { error: "Name and slug are required" },
      { status: 400 }
    );
  }

  try {
    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        slug: slug.trim(),
      },
      include: {
        subcategories: true,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error: unknown) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return NextResponse.json(
        { error: "A category with this name or slug already exists" },
        { status: 409 }
      );
    }
    throw error;
  }
}
