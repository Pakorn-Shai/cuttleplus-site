import { NextResponse } from "next/server";
import { getOwnerSession } from "@/lib/auth";

const MAX_RESPONSE_SIZE = 512 * 1024; // 512 KB
const TIMEOUT_MS = 5_000;
const BLOCKED_HOSTS = ["127.0.0.1", "localhost", "0.0.0.0", "::1", "10.", "172.16.", "172.17.", "172.18.", "172.19.", "172.20.", "172.21.", "172.22.", "172.23.", "172.24.", "172.25.", "172.26.", "172.27.", "172.28.", "172.29.", "172.30.", "172.31.", "192.168.", "169.254."];

function isPrivateHost(hostname: string): boolean {
  return BLOCKED_HOSTS.some((prefix) => hostname === prefix || hostname.startsWith(prefix));
}

export async function GET(request: Request) {
  const owner = await getOwnerSession();
  if (!owner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");
  if (!url) return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    return NextResponse.json({ error: "Only HTTP(S) URLs are allowed" }, { status: 400 });
  }

  if (isPrivateHost(parsed.hostname)) {
    return NextResponse.json({ error: "Private/internal hosts are not allowed" }, { status: 403 });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "KnowledgeHub/1.0 EmbedPreview" },
    });
    clearTimeout(timeout);

    const contentType = response.headers.get("content-type") || "";
    const isHtml = contentType.includes("text/html");

    // Read up to MAX_RESPONSE_SIZE
    const reader = response.body?.getReader();
    if (!reader) return NextResponse.json({ error: "No response body" }, { status: 502 });

    let body = "";
    let totalBytes = 0;
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.length;
      if (totalBytes > MAX_RESPONSE_SIZE) {
        reader.cancel();
        break;
      }
      body += decoder.decode(value, { stream: true });
    }

    // Extract basic metadata
    const titleMatch = body.match(/<title[^>]*>([^<]+)<\/title>/i);
    const descMatch = body.match(/<meta[^>]+name="description"[^>]+content="([^"]+)"/i)
      || body.match(/<meta[^>]+property="og:description"[^>]+content="([^"]+)"/i);
    const imageMatch = body.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i);
    const faviconMatch = body.match(/<link[^>]+rel="(?:shortcut )?icon"[^>]+href="([^"]+)"/i);

    return NextResponse.json({
      url,
      title: titleMatch?.[1]?.trim() || null,
      description: descMatch?.[1]?.trim() || null,
      image: imageMatch?.[1] || null,
      favicon: faviconMatch?.[1] || null,
      truncated: totalBytes > MAX_RESPONSE_SIZE,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json({ error: "Request timed out" }, { status: 504 });
    }
    return NextResponse.json({ error: "Failed to fetch URL" }, { status: 502 });
  }
}