import type { Metadata } from "next";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { CmsShell } from "@/app/_components/cms-shell";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Edit Game | Admin",
};

type EditGamePageProps = {
  params: Promise<{
    id: string;
  }>;
};

async function updateGame(formData: FormData) {
  "use server";

  await requireAdmin();

  const id = Number(formData.get("id"));
  const title = String(formData.get("title") ?? "").trim();
  const thumbnail = String(formData.get("thumbnail") ?? "").trim();
  const url = String(formData.get("url") ?? "").trim();

  if (!Number.isInteger(id)) {
    throw new Error("A valid game id is required.");
  }

  if (!title || !thumbnail || !url) {
    throw new Error("Title, thumbnail, and URL are required.");
  }

  await prisma.game.update({
    where: { id },
    data: { title, thumbnail, url },
  });

  revalidatePath("/admin/games");
  revalidatePath("/game");
  revalidatePath("/");
  revalidatePath("/sitemap.xml");
  redirect("/admin/games");
}

export default async function EditGamePage({ params }: EditGamePageProps) {
  await requireAdmin();

  const { id } = await params;
  const gameId = Number(id);

  if (!Number.isInteger(gameId)) {
    notFound();
  }

  const game = await prisma.game.findUnique({
    where: { id: gameId },
  });

  if (!game) {
    notFound();
  }

  return (
    <CmsShell
      eyebrow="Admin"
      title="Edit Game"
      description="Update game details."
      links={[
        { href: "/admin/games", label: "Back to games" },
      ]}
    >
      <form action={updateGame} className="grid gap-5">
        <input type="hidden" name="id" value={game.id} />

        <label className="grid gap-2 text-sm">
          <span className="font-medium">Title</span>
          <input
            name="title"
            type="text"
            required
            defaultValue={game.title}
            className="rounded-lg border border-border bg-surface px-4 py-3 text-sm outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </label>

        <label className="grid gap-2 text-sm">
          <span className="font-medium">Thumbnail URL</span>
          <input
            name="thumbnail"
            type="url"
            required
            defaultValue={game.thumbnail}
            className="rounded-lg border border-border bg-surface px-4 py-3 text-sm outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </label>

        <label className="grid gap-2 text-sm">
          <span className="font-medium">Game URL</span>
          <input
            name="url"
            type="url"
            required
            defaultValue={game.url}
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
            Save changes
          </button>
          <Link
            href="/admin/games"
            className="rounded-lg border border-border px-5 py-3 text-sm font-semibold transition hover:bg-surface-muted"
          >
            Cancel
          </Link>
        </div>
      </form>
    </CmsShell>
  );
}
