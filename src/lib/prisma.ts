import "server-only";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { logger } from "@/lib/logger";

/**
 * Slow-query threshold in milliseconds.
 * Queries exceeding this are logged at WARN level for investigation.
 */
const SLOW_QUERY_THRESHOLD_MS = Number(process.env.SLOW_QUERY_THRESHOLD_MS ?? "500");

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required.");
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString });

  const client = new PrismaClient({
    adapter,
    log: [
      { level: "query", emit: "event" },
      { level: "error", emit: "event" },
    ],
  });

  // Log slow queries for performance monitoring.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (client as any).$on("query", (e: { query: string; duration: number; params?: string }) => {
    if (e.duration >= SLOW_QUERY_THRESHOLD_MS) {
      logger.warn("Slow query detected", {
        query: e.query.slice(0, 500),
        durationMs: e.duration,
        params: e.params,
      });
    }
  });

  // Log Prisma errors with structured context.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (client as any).$on("error", (e: { message: string; target?: string }) => {
    logger.error("Prisma error", undefined, {
      message: e.message,
      target: e.target,
    });
  });

  return client;
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
