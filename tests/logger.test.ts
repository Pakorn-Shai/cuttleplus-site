import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { logger, createRequestLogger, runWithLogContext, getLogContext } from "@/lib/logger";

describe("logger", () => {
  let stdoutSpy: ReturnType<typeof vi.spyOn>;
  let stderrSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    stdoutSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    stderrSpy = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
  });

  afterEach(() => {
    stdoutSpy.mockRestore();
    stderrSpy.mockRestore();
  });

  it("writes info messages to stdout", () => {
    logger.info("test message");
    expect(stdoutSpy).toHaveBeenCalledOnce();
    const output = stdoutSpy.mock.calls[0][0] as string;
    expect(output).toContain("test message");
    expect(output).toContain("[INFO]");
  });

  it("writes error messages to stderr", () => {
    logger.error("something broke");
    expect(stderrSpy).toHaveBeenCalledOnce();
    const output = stderrSpy.mock.calls[0][0] as string;
    expect(output).toContain("something broke");
    expect(output).toContain("[ERROR]");
  });

  it("includes timestamp in output", () => {
    logger.info("timestamped");
    const output = stdoutSpy.mock.calls[0][0] as string;
    // ISO 8601 format: YYYY-MM-DDTHH:mm:ss.sssZ
    expect(output).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  it("includes meta in output", () => {
    logger.info("with meta", { key: "value", count: 42 });
    const output = stdoutSpy.mock.calls[0][0] as string;
    expect(output).toContain('"key":"value"');
    expect(output).toContain('"count":42');
  });

  it("includes error stack when error is provided", () => {
    const error = new Error("test error");
    logger.error("failed", error);
    const output = stderrSpy.mock.calls[0][0] as string;
    expect(output).toContain("test error");
    expect(output).toContain("Error: test error");
  });
});

describe("createRequestLogger", () => {
  let stdoutSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    stdoutSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
  });

  afterEach(() => {
    stdoutSpy.mockRestore();
  });

  it("includes correlationId in output", () => {
    const reqLogger = createRequestLogger("test-req-id-123", "GET /api/test");
    reqLogger.info("request processed");
    const output = stdoutSpy.mock.calls[0][0] as string;
    // In development mode, correlationId is truncated to 8 chars for display.
    expect(output).toContain("test-req");
    expect(output).toContain("GET /api/test");
  });
});

describe("runWithLogContext", () => {
  it("makes context available via getLogContext", () => {
    const result = runWithLogContext({ correlationId: "ctx-abc", route: "POST /api/x" }, () => {
      return getLogContext();
    });
    expect(result).toMatchObject({ correlationId: "ctx-abc", route: "POST /api/x" });
  });

  it("returns the callback return value", () => {
    const result = runWithLogContext({ correlationId: "x" }, () => 42);
    expect(result).toBe(42);
  });
});