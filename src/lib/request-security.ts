export function hasTrustedOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return process.env.NODE_ENV !== "production";
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  const forwardedHost = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const forwardedProtocol = request.headers.get("x-forwarded-proto") ?? new URL(request.url).protocol.replace(":", "");
  const allowed = new Set([new URL(request.url).origin]);
  if (configured) {
    try { allowed.add(new URL(configured).origin); } catch { /* Invalid config is never trusted. */ }
  }
  if (forwardedHost) allowed.add(`${forwardedProtocol}://${forwardedHost}`);
  return allowed.has(origin);
}
