import { redirect } from "next/navigation";
import type { Route } from "next";

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string; type?: string; category?: string; tag?: string; sort?: string }> }) {
  const params = await searchParams;
  const qs = new URLSearchParams();
  if (params.q) qs.set("q", params.q);
  if (params.type) qs.set("type", params.type);
  if (params.category) qs.set("category", params.category);
  if (params.tag) qs.set("tag", params.tag);
  if (params.sort) qs.set("sort", params.sort);
  const queryString = qs.toString();
  redirect((queryString ? `/knowledge?${queryString}` : "/knowledge") as Route);
}