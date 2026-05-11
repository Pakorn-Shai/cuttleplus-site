import type { Metadata } from "next";
import { revalidatePath } from "next/cache";
import { CmsShell } from "@/app/_components/cms-shell";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Menu Management | Admin",
};

function validateMenuInput(formData: FormData) {
  const label = String(formData.get("label") ?? "").trim();
  const href = String(formData.get("href") ?? "").trim();
  const order = Number(formData.get("order") ?? 0);
  const visible = formData.get("visible") === "on";

  if (!label) {
    throw new Error("Label is required.");
  }

  if (!href) {
    throw new Error("Href is required.");
  }

  if (!href.startsWith("/") && !href.startsWith("http://") && !href.startsWith("https://")) {
    throw new Error("Href must start with /, http://, or https://.");
  }

  if (!Number.isInteger(order)) {
    throw new Error("Order must be a number.");
  }

  return { label, href, order, visible };
}

function revalidateMenuPaths() {
  revalidatePath("/");
  revalidatePath("/blog");
  revalidatePath("/worksheets");
  revalidatePath("/admin/menu");
}

async function createMenuItem(formData: FormData) {
  "use server";

  await requireAdmin();

  const data = validateMenuInput(formData);

  await prisma.menuItem.create({ data });

  revalidateMenuPaths();
}

async function updateMenuItem(formData: FormData) {
  "use server";

  await requireAdmin();

  const id = String(formData.get("id") ?? "").trim();
  if (!id) {
    throw new Error("A valid menu item id is required.");
  }

  const data = validateMenuInput(formData);

  await prisma.menuItem.update({
    where: { id },
    data,
  });

  revalidateMenuPaths();
}

async function toggleMenuItemVisibility(formData: FormData) {
  "use server";

  await requireAdmin();

  const id = String(formData.get("id") ?? "").trim();
  const visible = formData.get("visible") === "true";

  if (!id) {
    throw new Error("A valid menu item id is required.");
  }

  await prisma.menuItem.update({
    where: { id },
    data: { visible },
  });

  revalidateMenuPaths();
}

async function deleteMenuItem(formData: FormData) {
  "use server";

  await requireAdmin();

  const id = String(formData.get("id") ?? "").trim();
  const confirmed = formData.get("confirmDelete") === "on";

  if (!id) {
    throw new Error("A valid menu item id is required.");
  }

  if (!confirmed) {
    throw new Error("Please confirm before deleting this menu item.");
  }

  await prisma.menuItem.delete({ where: { id } });

  revalidateMenuPaths();
}

export default async function AdminMenuPage() {
  await requireAdmin();

  const menuItems = await prisma.menuItem.findMany({
    orderBy: [{ order: "asc" }, { label: "asc" }],
  });

  return (
    <CmsShell
      eyebrow="Admin"
      title="Menu Management"
      description="Create, edit, reorder, show, hide, and delete flat navigation menu items."
      links={[{ href: "/admin/dashboard", label: "Back to dashboard" }]}
    >
      <section className="space-y-8">
        <div className="rounded-xl border border-border bg-surface/70 p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Add menu item</h2>
          <form action={createMenuItem} className="mt-4 grid gap-4 md:grid-cols-[1fr_1fr_7rem_auto] md:items-end">
            <label className="grid gap-1 text-sm font-medium">
              Label
              <input
                name="label"
                required
                className="rounded-md border border-border bg-background px-3 py-2 text-sm"
                placeholder="Home"
              />
            </label>
            <label className="grid gap-1 text-sm font-medium">
              Href
              <input
                name="href"
                required
                className="rounded-md border border-border bg-background px-3 py-2 text-sm"
                placeholder="/"
              />
            </label>
            <label className="grid gap-1 text-sm font-medium">
              Order
              <input
                name="order"
                type="number"
                defaultValue={0}
                required
                className="rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
            </label>
            <label className="flex items-center gap-2 text-sm font-medium md:pb-2">
              <input name="visible" type="checkbox" defaultChecked />
              Visible
            </label>
            <button
              type="submit"
              className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary-hover md:col-span-4 md:w-fit"
            >
              Add Menu Item
            </button>
          </form>
        </div>

        {menuItems.length ? (
          <div className="space-y-4">
            {menuItems.map((item) => (
              <div key={item.id} className="rounded-xl border border-border bg-surface/70 p-5 shadow-sm">
                <form action={updateMenuItem} className="grid gap-4 lg:grid-cols-[1fr_1fr_7rem_auto_auto] lg:items-end">
                  <input type="hidden" name="id" value={item.id} />
                  <label className="grid gap-1 text-sm font-medium">
                    Label
                    <input
                      name="label"
                      required
                      defaultValue={item.label}
                      className="rounded-md border border-border bg-background px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="grid gap-1 text-sm font-medium">
                    Href
                    <input
                      name="href"
                      required
                      defaultValue={item.href}
                      className="rounded-md border border-border bg-background px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="grid gap-1 text-sm font-medium">
                    Order
                    <input
                      name="order"
                      type="number"
                      required
                      defaultValue={item.order}
                      className="rounded-md border border-border bg-background px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="flex items-center gap-2 text-sm font-medium lg:pb-2">
                    <input name="visible" type="checkbox" defaultChecked={item.visible} />
                    Visible
                  </label>
                  <button
                    type="submit"
                    className="rounded-md border border-border px-3 py-2 text-sm font-semibold transition hover:bg-surface-muted"
                  >
                    Save
                  </button>
                </form>

                <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-border pt-4">
                  <form action={toggleMenuItemVisibility}>
                    <input type="hidden" name="id" value={item.id} />
                    <input type="hidden" name="visible" value={item.visible ? "false" : "true"} />
                    <button
                      type="submit"
                      className="rounded-md border border-border px-3 py-2 text-xs font-semibold transition hover:bg-surface-muted"
                    >
                      {item.visible ? "Hide" : "Show"}
                    </button>
                  </form>
                  <form action={deleteMenuItem} className="flex flex-wrap items-center gap-2">
                    <input type="hidden" name="id" value={item.id} />
                    <label className="flex items-center gap-2 text-xs text-muted">
                      <input name="confirmDelete" type="checkbox" required />
                      Confirm delete
                    </label>
                    <button
                      type="submit"
                      className="rounded-md border border-red-500/30 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-500/10"
                    >
                      Delete
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-border bg-surface/60 p-6 text-sm text-muted">
            No menu items yet. The public navbar will use the fallback menu until at least one visible menu item exists.
          </p>
        )}
      </section>
    </CmsShell>
  );
}