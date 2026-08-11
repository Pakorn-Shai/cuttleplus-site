import "server-only";

import { AsyncLocalStorage } from "node:async_hooks";

const requestContext = new AsyncLocalStorage<{ requestId?: string }>();

export function withRequestContext<T>(context: { requestId?: string }, fn: () => T): T {
  return requestContext.run(context, fn);
}

export function getRequestId(): string | undefined {
  return requestContext.getStore()?.requestId;
}

type LogLevel = "debug" | "info" | "warn" | "error";

function log(level: LogLevel, message: string, error?: Error, meta?: Record<string, unknown>) {
  const timestamp = new Date().toISOString();
  const requestId = getRequestId();
  const entry: Record<string, unknown> = { timestamp, level, message, ...(requestId ? { requestId } : {}), ...(meta ?? {}) };
  if (error) {
    entry.error = error.message;
    if (process.env.NODE_ENV !== "production") entry.stack = error.stack;
  }
  const output = JSON.stringify(entry);
  if (level === "error") console.error(output);
  else if (level === "warn") console.warn(output);
  else console.log(output);
}

export const logger = {
  debug: (message: string, meta?: Record<string, unknown>) => log("debug", message, undefined, meta),
  info: (message: string, meta?: Record<string, unknown>) => log("info", message, undefined, meta),
  warn: (message: string, meta?: Record<string, unknown>) => log("warn", message, undefined, meta),
  error: (message: string, error?: Error, meta?: Record<string, unknown>) => log("error", message, error, meta),
};