import { describe, expect, it } from "vitest";
import { detectImageType } from "@/core/media/validation";

describe("media signature validation", () => {
  it("detects supported image types from magic bytes", () => {
    expect(detectImageType(Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe("image/png");
    expect(detectImageType(Uint8Array.from([0xff, 0xd8, 0xff, 0x00]))).toBe("image/jpeg");
    expect(detectImageType(new TextEncoder().encode("GIF89a"))).toBe("image/gif");
  });

  it("rejects SVG, HTML, and files with only a forged content type", () => {
    expect(detectImageType(new TextEncoder().encode("<svg><script>alert(1)</script></svg>"))).toBeNull();
    expect(detectImageType(new TextEncoder().encode("<!doctype html>"))).toBeNull();
  });
});
