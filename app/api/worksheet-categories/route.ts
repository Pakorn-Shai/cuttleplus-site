import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function isValidSlug(slug: string) {
  return SLUG_PATTERN.test(slug);
}

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
        { error: "A worksheet category with this name or slug already exists" },
        { status: 409 }
      );
    }

    throw error;
  }
}
