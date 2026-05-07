import "server-only";

import { prisma } from "@/lib/prisma";

export async function assertPostSlugNotCategory(slug: string) {
  const category = await prisma.category.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (category) {
    throw new Error("Slug already used by a blog category.");
  }
}

export async function assertCategorySlugNotPost(slug: string) {
  const post = await prisma.post.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (post) {
    throw new Error("Slug already used by a blog post.");
  }
}

export async function validatePostTaxonomy(
  categoryId: number | null,
  subcategoryId: number | null
) {
  if (categoryId !== null && !Number.isInteger(categoryId)) {
    throw new Error("A valid category id is required.");
  }

  if (subcategoryId !== null && !Number.isInteger(subcategoryId)) {
    throw new Error("A valid subcategory id is required.");
  }

  if (subcategoryId !== null && categoryId === null) {
    throw new Error("Select a category before selecting a subcategory.");
  }

  if (categoryId !== null) {
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      select: { id: true },
    });

    if (!category) {
      throw new Error("Category not found.");
    }
  }

  if (subcategoryId !== null) {
    const subcategory = await prisma.subcategory.findUnique({
      where: { id: subcategoryId },
      select: { categoryId: true },
    });

    if (!subcategory) {
      throw new Error("Subcategory not found.");
    }

    if (subcategory.categoryId !== categoryId) {
      throw new Error("Subcategory must belong to the selected category.");
    }
  }
}
