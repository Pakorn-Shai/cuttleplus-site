import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { PREVIEW_THEME_COOKIE } from "@/core/themes/preview";
import { getOwnerSession } from "@/lib/auth";
import { hasTheme } from "@/themes/registry";

const PREVIEW_MAX_AGE_SECONDS = 60 * 60; // 1 hour

function homeUrl(request: NextRequest) {
  return new URL("/", request.url);
}

/**
 * GET /api/theme-preview?theme=<id>  → enables preview mode for a theme and redirects home.
 * GET /api/theme-preview?exit=1      → clears preview mode and returns to the Theme Manager.
 *
 * Preview mode only affects the browser that carries the cookie, so visitors
 * always see the activated theme while the owner can walk through the whole
 * public site rendered in any registered theme.
 */
export async function GET(request: NextRequest) {
  const owner = await getOwnerSession();
  if (!owner) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const { searchParams } = request.nextUrl;
  const store = await cookies();

  if (searchParams.get("exit")) {
    store.delete(PREVIEW_THEME_COOKIE);
    return NextResponse.redirect(new URL("/admin/themes", request.url));
  }

  const themeId = searchParams.get("theme") ?? "";
  if (!hasTheme(themeId)) {
    return NextResponse.redirect(new URL("/admin/themes?result=invalid", request.url));
  }

  store.set(PREVIEW_THEME_COOKIE, themeId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: PREVIEW_MAX_AGE_SECONDS,
  });

  return NextResponse.redirect(homeUrl(request));
}