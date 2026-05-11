import { prisma } from "@/lib/prisma";

export type PublicMenuItem = {
  id: string;
  label: string;
  href: string;
  order: number;
};

export const fallbackMenuItems: PublicMenuItem[] = [
  { id: "fallback-home", label: "Home", href: "/", order: 0 },
  { id: "fallback-blog", label: "Blog", href: "/blog", order: 10 },
  { id: "fallback-worksheets", label: "Worksheets", href: "/worksheets", order: 20 },
];

function normalizeMenuItems(items: PublicMenuItem[]) {
  return [...items].sort((a, b) => {
    if (a.order !== b.order) {
      return a.order - b.order;
    }

    return a.label.localeCompare(b.label);
  });
}

export async function getMenuItems(): Promise<PublicMenuItem[]> {
  try {
    const menuItems = await prisma.menuItem.findMany({
      where: { visible: true },
      select: {
        id: true,
        label: true,
        href: true,
        order: true,
      },
      orderBy: [{ order: "asc" }, { label: "asc" }],
    });

    if (!menuItems.length) {
      return fallbackMenuItems;
    }

    return normalizeMenuItems(menuItems);
  } catch (error) {
    console.error("Failed to load menu items", error);
    return fallbackMenuItems;
  }
}