/**
 * Structured logging utility with request correlation.
 *
 * Every log entry is a single JSON line making it easy for log aggregators
 * (CloudWatch, Datadog, Loki, etc.) to parse and filter.
 *
 * A request-scoped `correlationId` can be threaded through the call stack
 * so that all logs for a single HTTP request are linkable.
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogContext {
  /** Unique identifier for the current request – set by middleware. */
  correlationId?: string;
  /** HTTP method + path for API routes. */
  route?: string;
  /** Owner user id when available. */
  userId?: string;
  /** Arbitrary structured data. */
  meta?: Record<string, unknown>;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  correlationId?: string;
  route?: string;
  userId?: string;
  meta?: Record<string, unknown>;
  stack?: string;
}

/* ------------------------------------------------------------------ */
/*  Global correlation-id store (AsyncLocalStorage when available,     */
/*  falls back to a WeakMap keyed by the current async context).      */
/* ------------------------------------------------------------------ */

let als: import("node:async_hooks").AsyncLocalStorage<LogContext> | undefined;

try {
  // AsyncLocalStorage is available in Node ≥ 16 and the project targets modern runtimes.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { AsyncLocalStorage } = require("node:async_hooks") as typeof import("node:async_hooks");
  als = new AsyncLocalStorage<LogContext>();
} catch {
  // Fallback: no-op; correlationId must be passed manually.
}

/**
 * Run the given callback inside a request-scoped log context.
 * Typically called once per HTTP request in middleware.
 */
export function runWithLogContext<T>(context: LogContext, fn: () => T): T {
  if (als) return als.run(context, fn);
  // Without ALS the context is best-effort – just run the callback.
  return fn();
}

/** Retrieve the current request-scoped log context (if any). */
export function getLogContext(): LogContext {
  return als?.getStore() ?? {};
}

/* ------------------------------------------------------------------ */
/*  Core logger                                                       */
/* ------------------------------------------------------------------ */

const LEVEL_WEIGHT: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };
const minLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) ?? "info";

function shouldLog(level: LogLevel): boolean {
  return LEVEL_WEIGHT[level] >= LEVEL_WEIGHT[minLevel];
}

function formatEntry(entry: LogEntry): string {
  // In development a pretty-printed line is easier to read.
  if (process.env.NODE_ENV !== "production") {
    const parts = [`${entry.timestamp} [${entry.level.toUpperCase()}]`];
    if (entry.correlationId) parts.push(`(${entry.correlationId.slice(0, 8)})`);
    if (entry.route) parts.push(entry.route);
    parts.push(entry.message);
    if (entry.meta) parts.push(JSON.stringify(entry.meta));
    if (entry.stack) parts.push(`\n${entry.stack}`);
    return parts.join(" ");
  }
  return JSON.stringify(entry);
}

function emit(level: LogLevel, message: string, context?: LogContext, meta?: Record<string, unknown>, error?: unknown) {
  if (!shouldLog(level)) return;
  const ctx = context ?? getLogContext();
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(ctx.correlationId && { correlationId: ctx.correlationId }),
    ...(ctx.route && { route: ctx.route }),
    ...(ctx.userId && { userId: ctx.userId }),
    ...(meta && { meta }),
  };
  if (error instanceof Error) {
    entry.stack = error.stack;
  }
  const output = formatEntry(entry);
  if (level === "error") {
    process.stderr.write(output + "\n");
  } else {
    process.stdout.write(output + "\n");
  }
}

export const logger = {
  debug: (message: string, meta?: Record<string, unknown>) => emit("debug", message, undefined, meta),
  info: (message: string, meta?: Record<string, unknown>) => emit("info", message, undefined, meta),
  warn: (message: string, meta?: Record<string, unknown>) => emit("warn", message, undefined, meta),
  error: (message: string, error?: unknown, meta?: Record<string, unknown>) => emit("error", message, undefined, meta, error),
};

/**
 * Create a child logger that always includes the given context fields.
 * Useful for request-scoped logging without passing context every time.
 */
export function createRequestLogger(correlationId: string, route?: string) {
  const ctx: LogContext = { correlationId, route };
  return {
    debug: (message: string, meta?: Record<string, unknown>) => emit("debug", message, ctx, meta),
    info: (message: string, meta?: Record<string, unknown>) => emit("info", message, ctx, meta),
    warn: (message: string, meta?: Record<string, unknown>) => emit("warn", message, ctx, meta),
    error: (message: string, error?: unknown, meta?: Record<string, unknown>) => emit("error", message, ctx, meta, error),
  };
}