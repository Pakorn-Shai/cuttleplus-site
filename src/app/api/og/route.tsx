import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get("title") || "Knowledge Hub";
  const category = searchParams.get("category") || "";
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "Knowledge Hub";

  return new ImageResponse(
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "center",
        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
        padding: "80px 100px",
        fontFamily: "Noto Sans Thai, Inter, sans-serif",
      }}
    >
      {/* Accent bar */}
      <div style={{ display: "flex", width: "100%", marginBottom: 40 }}>
        <div style={{ width: 80, height: 6, borderRadius: 3, background: "#6d5dfc" }} />
      </div>

      {/* Category badge */}
      {category && (
        <div
          style={{
            display: "flex",
            padding: "8px 20px",
            borderRadius: 999,
            background: "rgba(109, 93, 252, 0.15)",
            color: "#a89eff",
            fontSize: 24,
            fontWeight: 700,
            marginBottom: 30,
          }}
        >
          {category}
        </div>
      )}

      {/* Title */}
      <div
        style={{
          display: "flex",
          fontSize: 64,
          fontWeight: 800,
          color: "#f0f0ff",
          lineHeight: 1.15,
          letterSpacing: "-0.03em",
          maxWidth: "1000px",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {title.length > 80 ? title.slice(0, 80) + "..." : title}
      </div>

      {/* Site name footer */}
      <div
        style={{
          display: "flex",
          position: "absolute",
          bottom: 60,
          left: 100,
          alignItems: "center",
          gap: 12,
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: "#6d5dfc",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontSize: 22,
            fontWeight: 800,
          }}
        >
          K
        </div>
        <span style={{ color: "#8888aa", fontSize: 28, fontWeight: 600 }}>{siteName}</span>
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
    },
  );
}