import "server-only";

import { cookies } from "next/headers";
import { hasTheme } from "@/themes/registry";

export const PREVIEW_THEME_COOKIE = "kh_theme_preview";

/**
 * Returns the theme id currently being previewed by the owner, or null when
 * preview mode is inactive. Only registered theme ids are accepted so the
 * cookie can never force an unknown theme onto the public site.
 */
export async function getPreviewThemeId(): Promise<string | null> {
  const candidate = (await cookies()).get(PREVIEW_THEME_COOKIE)?.value;
  if (!candidate || !hasTheme(candidate)) return null;
  return candidate;
}