import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CmsShell } from "@/app/_components/cms-shell";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "New Game | Admin",
};

async function createGame(formData: FormData) {
  "use server";

  await requireAdmin();

  const title = String(formData.get("title") ?? "").trim();
  const thumbnail = String(formData.get("thumbnail") ?? "").trim();
  const url = String(formData.get("url") ?? "").trim();

  if (!title || !thumbnail || !url) {
    throw new Error("Title, thumbnail, and URL are required.");
  }

  await prisma.game.create({
    data: { title, thumbnail, url },
  });

  redirect("/admin/games");
}

export default async function NewGamePage() {
  await requireAdmin();

  return (
    <CmsShell
      eyebrow="Admin"
      title="Add Game"
      description="Create a new game entry with thumbnail and URL."
      links={[
        { href: "/admin/games", label: "Back to games" },
      ]}
    >
      <form action={createGame} className="grid gap-5">
        <label className="grid gap-2 text-sm">
          <span className="font-medium">Title</span>
          <input
            name="title"
            type="text"
            required
            placeholder="Snake Game"
            className="rounded-lg border border-border bg-surface px-4 py-3 text-sm outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </label>

        <label className="grid gap-2 text-sm">
          <span className="font-medium">Thumbnail URL</span>
          <input
            name="thumbnail"
            type="url"
            required
            placeholder="https://example.com/thumbnail.jpg"
            className="rounded-lg border border-border bg-surface px-4 py-3 text-sm outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </label>

        <label className="grid gap-2 text-sm">
          <span className="font-medium">Game URL</span>
          <input
            name="url"
            type="url"
            required
            placeholder="https://example.com/game"
            className="rounded-lg border border-border bg-surface px-4 py-3 text-sm outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <span className="text-xs text-muted">
            URL where the game is hosted (external link or embed page).
          </span>
        </label>

        <div className="flex flex-wrap items-center gap-3 border-t border-border pt-5">
          <button
            type="submit"
            className="rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
          >
            Save game
          </button>
        </div>
      </form>
    </CmsShell>
  );
}