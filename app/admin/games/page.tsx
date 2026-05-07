import type { Metadata } from "next";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { CmsShell } from "@/app/_components/cms-shell";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Games | Admin",
};

async function deleteGame(formData: FormData) {
  "use server";

  await requireAdmin();

  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) {
    throw new Error("A valid game id is required.");
  }

  await prisma.game.delete({
    where: { id },
  });

  revalidatePath("/admin/games");
  revalidatePath("/game");
  revalidatePath("/");
  revalidatePath("/sitemap.xml");
}

export default async function GamesPage() {
  await requireAdmin();

  const games = await prisma.game.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <CmsShell
      eyebrow="Admin"
      title="Games"
      description="Manage game links and thumbnails."
      links={[{ href: "/admin/dashboard", label: "Back to dashboard" }]}
    >
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/admin/games/new"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary-hover"
        >
          Add Game
        </Link>
      </div>

      {games.length ? (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {games.map((game) => (
            <li
              key={game.id}
              className="rounded-xl border border-border bg-surface/60 overflow-hidden"
            >
              <img
                src={game.thumbnail}
                alt={game.title}
                className="h-40 w-full object-cover"
              />
              <div className="p-4">
                <h3 className="text-sm font-semibold">{game.title}</h3>
                <a
                  href={game.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 block truncate text-xs text-primary hover:underline"
                >
                  {game.url}
                </a>
                <div className="mt-3 flex items-center gap-2">
                  <Link
                    href={`/admin/games/${game.id}/edit`}
                    className="rounded-md border border-border px-3 py-1.5 text-xs font-medium transition hover:bg-surface-muted"
                  >
                    Edit
                  </Link>
                  <form action={deleteGame}>
                    <input type="hidden" name="id" value={game.id} />
                    <button
                      type="submit"
                      className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50"
                      onClick={(e) => {
                        if (!confirm("Delete this game?")) {
                          e.preventDefault();
                        }
                      }}
                    >
                      Delete
                    </button>
                  </form>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-xl border border-border bg-surface/60 p-5 text-sm text-muted">
          No games have been added yet.
        </p>
      )}
    </CmsShell>
  );
}
