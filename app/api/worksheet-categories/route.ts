import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isValidSlug, slugFromNameOrInput } from "@/lib/slug";

export async function GET() {
  await requireAdmin();

  const categories = await prisma.worksheetCategory.findMany({
    include: {
      subcategories: {
        orderBy: {
          name: "asc",
        },
      },
      _count: {
        select: {
          worksheets: true,
          subcategories: true,
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

  const existingSlug = await prisma.worksheetCategory.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (existingSlug) {
    return NextResponse.json(
      { error: "This slug is already used. Please choose another slug." },
      { status: 409 }
    );
  }

  const existingName = await prisma.worksheetCategory.findUnique({
    where: { name },
    select: { id: true },
  });

  if (existingName) {
    return NextResponse.json(
      { error: "This worksheet category name is already used. Please choose another name." },
      { status: 409 }
    );
  }

  try {
    const category = await prisma.worksheetCategory.create({
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

    return NextResponse.json(category, { status: 201 });
  } catch (error: unknown) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return NextResponse.json(
        { error: "This slug or category name is already used. Please choose another value." },
        { status: 409 }
      );
    }

    throw error;
  }
}
