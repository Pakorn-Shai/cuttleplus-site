"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Route } from "next";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { createSlug } from "@/core/content/slug";
import { requireOwner } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const optionalId = z.union([z.string().cuid(), z.literal("")]).transform((value) => value || undefined);
const baseSchema = z.object({
  id: optionalId,
  name: z.string().trim().min(1).max(120),
  slug: z.string().trim().max(140),
  description: z.string().trim().max(600),
});
const categorySchema = baseSchema.extend({
  color: z.string().regex(/^#[0-9a-f]{6}$/i),
  sortOrder: z.coerce.number().int().min(0).max(9999),
  parentId: optionalId,
});
const tagSchema = baseSchema;
const collectionSchema = baseSchema.extend({ visibility: z.enum(["PRIVATE", "UNLISTED", "PUBLIC"]) });

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

function pathWithError(path: "/admin/categories" | "/admin/tags" | "/admin/collections", error: string): never {
  redirect(`${path}?error=${encodeURIComponent(error)}` as Route);
}

function isUniqueError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

async function categoryParentIsValid(id: string | undefined, parentId: string | undefined) {
  if (!parentId) return true;
  if (!id) return Boolean(await prisma.category.findUnique({ where: { id: parentId }, select: { id: true } }));
  let cursor: string | null = parentId;
  const visited = new Set<string>();
  while (cursor) {
    if (cursor === id || visited.has(cursor)) return false;
    visited.add(cursor);
    const category: { parentId: string | null } | null = await prisma.category.findUnique({ where: { id: cursor }, select: { parentId: true } });
    if (!category) return false;
    cursor = category.parentId;
  }
  return true;
}

export async function saveCategoryAction(formData: FormData) {
  const owner = await requireOwner();
  const parsed = categorySchema.safeParse({
    id: value(formData, "id"), name: value(formData, "name"), slug: value(formData, "slug"),
    description: value(formData, "description"), color: value(formData, "color"),
    sortOrder: value(formData, "sortOrder"), parentId: value(formData, "parentId"),
  });
  if (!parsed.success) pathWithError("/admin/categories", "invalid");
  const slug = createSlug(parsed.data.slug || parsed.data.name);
  if (!slug) pathWithError("/admin/categories", "invalid");
  if (!(await categoryParentIsValid(parsed.data.id, parsed.data.parentId))) pathWithError("/admin/categories", "invalid_parent");
  try {
    const category = await prisma.category.upsert({
      where: { id: parsed.data.id ?? "__new__" },
      update: { name: parsed.data.name, slug, description: parsed.data.description || null, color: parsed.data.color, sortOrder: parsed.data.sortOrder, parentId: parsed.data.parentId ?? null },
      create: { name: parsed.data.name, slug, description: parsed.data.description || null, color: parsed.data.color, sortOrder: parsed.data.sortOrder, parentId: parsed.data.parentId ?? null },
    });
    await prisma.auditLog.create({ data: { userId: owner.id, action: parsed.data.id ? "CATEGORY_UPDATED" : "CATEGORY_CREATED", entityType: "Category", entityId: category.id } });
  } catch (error) {
    if (isUniqueError(error)) pathWithError("/admin/categories", "duplicate");
    throw error;
  }
  revalidatePath("/");
  revalidatePath("/categories");
  revalidatePath("/admin/categories");
  redirect("/admin/categories");
}

export async function deleteCategoryAction(formData: FormData) {
  const owner = await requireOwner();
  const id = z.string().cuid().safeParse(value(formData, "id"));
  if (!id.success) pathWithError("/admin/categories", "invalid");
  const category = await prisma.category.findUnique({ where: { id: id.data }, include: { _count: { select: { contents: true, children: true } } } });
  if (!category) redirect("/admin/categories");
  if (category._count.contents || category._count.children) pathWithError("/admin/categories", "in_use");
  await prisma.$transaction([
    prisma.category.delete({ where: { id: category.id } }),
    prisma.auditLog.create({ data: { userId: owner.id, action: "CATEGORY_DELETED", entityType: "Category", entityId: category.id } }),
  ]);
  revalidatePath("/");
  revalidatePath("/categories");
  revalidatePath("/admin/categories");
  redirect("/admin/categories");
}

export async function saveTagAction(formData: FormData) {
  const owner = await requireOwner();
  const parsed = tagSchema.safeParse({ id: value(formData, "id"), name: value(formData, "name"), slug: value(formData, "slug"), description: value(formData, "description") });
  if (!parsed.success) pathWithError("/admin/tags", "invalid");
  const slug = createSlug(parsed.data.slug || parsed.data.name);
  if (!slug) pathWithError("/admin/tags", "invalid");
  try {
    const tag = await prisma.tag.upsert({
      where: { id: parsed.data.id ?? "__new__" },
      update: { name: parsed.data.name, slug, description: parsed.data.description || null },
      create: { name: parsed.data.name, slug, description: parsed.data.description || null },
    });
    await prisma.auditLog.create({ data: { userId: owner.id, action: parsed.data.id ? "TAG_UPDATED" : "TAG_CREATED", entityType: "Tag", entityId: tag.id } });
  } catch (error) {
    if (isUniqueError(error)) pathWithError("/admin/tags", "duplicate");
    throw error;
  }
  revalidatePath("/admin/tags");
  redirect("/admin/tags");
}

export async function deleteTagAction(formData: FormData) {
  const owner = await requireOwner();
  const id = z.string().cuid().safeParse(value(formData, "id"));
  if (!id.success) pathWithError("/admin/tags", "invalid");
  const tag = await prisma.tag.findUnique({ where: { id: id.data }, include: { _count: { select: { contents: true } } } });
  if (!tag) redirect("/admin/tags");
  if (tag._count.contents) pathWithError("/admin/tags", "in_use");
  await prisma.$transaction([
    prisma.tag.delete({ where: { id: tag.id } }),
    prisma.auditLog.create({ data: { userId: owner.id, action: "TAG_DELETED", entityType: "Tag", entityId: tag.id } }),
  ]);
  revalidatePath("/admin/tags");
  redirect("/admin/tags");
}

export async function saveCollectionAction(formData: FormData) {
  const owner = await requireOwner();
  const parsed = collectionSchema.safeParse({ id: value(formData, "id"), name: value(formData, "name"), slug: value(formData, "slug"), description: value(formData, "description"), visibility: value(formData, "visibility") });
  if (!parsed.success) pathWithError("/admin/collections", "invalid");
  const slug = createSlug(parsed.data.slug || parsed.data.name);
  if (!slug) pathWithError("/admin/collections", "invalid");
  const requestedIds = [...new Set(formData.getAll("contentIds").map(String))];
  const contentIds = z.array(z.string().cuid()).safeParse(requestedIds);
  if (!contentIds.success) pathWithError("/admin/collections", "invalid");
  const validContents = await prisma.content.findMany({ where: { id: { in: contentIds.data }, deletedAt: null }, select: { id: true } });
  if (validContents.length !== contentIds.data.length) pathWithError("/admin/collections", "invalid");
  try {
    await prisma.$transaction(async (tx) => {
      const collection = await tx.collection.upsert({
        where: { id: parsed.data.id ?? "__new__" },
        update: { name: parsed.data.name, slug, description: parsed.data.description || null, visibility: parsed.data.visibility },
        create: { name: parsed.data.name, slug, description: parsed.data.description || null, visibility: parsed.data.visibility },
      });
      await tx.collectionItem.deleteMany({ where: { collectionId: collection.id } });
      if (validContents.length) await tx.collectionItem.createMany({ data: validContents.map((content, position) => ({ collectionId: collection.id, contentId: content.id, position })) });
      await tx.auditLog.create({ data: { userId: owner.id, action: parsed.data.id ? "COLLECTION_UPDATED" : "COLLECTION_CREATED", entityType: "Collection", entityId: collection.id } });
    });
  } catch (error) {
    if (isUniqueError(error)) pathWithError("/admin/collections", "duplicate");
    throw error;
  }
  revalidatePath("/admin/collections");
  redirect("/admin/collections");
}

export async function deleteCollectionAction(formData: FormData) {
  const owner = await requireOwner();
  const id = z.string().cuid().safeParse(value(formData, "id"));
  if (!id.success) pathWithError("/admin/collections", "invalid");
  const collection = await prisma.collection.findUnique({ where: { id: id.data } });
  if (!collection) redirect("/admin/collections");
  await prisma.$transaction([
    prisma.collection.delete({ where: { id: collection.id } }),
    prisma.auditLog.create({ data: { userId: owner.id, action: "COLLECTION_DELETED", entityType: "Collection", entityId: collection.id } }),
  ]);
  revalidatePath("/admin/collections");
  redirect("/admin/collections");
}
