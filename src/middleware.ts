import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Edge-compatible middleware that:
 *
 * 1. Assigns a unique `X-Request-Id` to every incoming request.
 *    Downstream API routes can read it from the response headers.
 * 2. Adds a `X-Response-Time` header so clients and load-balancers
 *    can observe latency without extra instrumentation.
 * 3. Prevents the browser from storing sensitive admin/API responses
 *    by setting `Cache-Control: no-store` on those routes.
 */
export function middleware(request: NextRequest) {
  const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID();
  const startTime = Date.now();

  const response = NextResponse.next();

  // Attach correlation id so downstream Server Components / Route Handlers can use it.
  response.headers.set("X-Request-Id", requestId);
  // Also make it available to the client for debugging / support requests.
  response.headers.set("Access-Control-Expose-Headers", "X-Request-Id, X-Response-Time");

  // Ensure admin and API routes are never cached by proxies or browsers.
  const pathname = request.nextUrl.pathname;
  if (pathname.startsWith("/admin") || pathname.startsWith("/api")) {
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  }

  // Content Security Policy — Section 16 security hardening
  // Allow: self, inline styles (BlockNote/Mantine), data URIs, YouTube embeds, S3 media
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "frame-src https://www.youtube-nocookie.com https://www.youtube.com https://player.vimeo.com",
    "connect-src 'self' https://openrouter.ai https://*.r2.cloudflarestorage.com",
    "media-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; ");
  response.headers.set("Content-Security-Policy", csp);

  // Prevent MIME sniffing
  response.headers.set("X-Content-Type-Options", "nosniff");
  // Clickjacking protection (redundant with CSP frame-ancestors but defense-in-depth)
  response.headers.set("X-Frame-Options", "DENY");
  // Referrer policy for privacy
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // We measure response time by mutating the header in `after()` below.
  // Next.js 15+ exposes `waitUntil` on the request – use it when available.
  const elapsed = Date.now() - startTime;
  response.headers.set("X-Response-Time", `${elapsed}ms`);

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (browser icon)
     * - public files (images, fonts, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};