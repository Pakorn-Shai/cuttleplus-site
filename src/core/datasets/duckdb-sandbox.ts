import type { StructuredOutput } from "@/core/content/types";
import { getSampleDataset } from "./registry";
import { limitedSandboxQuery } from "./query-policy";

const ROW_LIMIT = 200;
const COLUMN_LIMIT = 50;
const TIMEOUT_MS = 4_000;

export interface SandboxRunResult {
  output: StructuredOutput;
  runtimeVersion: string;
  datasetVersion: string;
  datasetChecksum: string;
  executedAt: string;
}

function outputValue(value: unknown): string | number | boolean | null {
  if (value === null || typeof value === "string" || typeof value === "boolean") return value;
  if (typeof value === "number") return Number.isFinite(value) ? value : String(value);
  if (typeof value === "bigint") return value <= Number.MAX_SAFE_INTEGER && value >= Number.MIN_SAFE_INTEGER ? Number(value) : value.toString();
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object" && value && "toString" in value) return String(value);
  return String(value);
}

export async function runDuckDbSandbox(input: { datasetId: string; datasetVersion?: string; query: string }): Promise<SandboxRunResult> {
  const dataset = getSampleDataset(input.datasetId, input.datasetVersion);
  if (!dataset) throw new Error("DATASET_NOT_FOUND");
  const query = limitedSandboxQuery(input.query, ROW_LIMIT);
  const duckdb = await import("@duckdb/duckdb-wasm");
  const worker = new Worker("/duckdb/duckdb-browser-eh.worker.js");
  const database = new duckdb.AsyncDuckDB(new duckdb.VoidLogger(), worker);
  let timedOut = false;
  const timeout = window.setTimeout(() => {
    timedOut = true;
    worker.terminate();
  }, TIMEOUT_MS);

  try {
    await database.instantiate("/duckdb/duckdb-eh.wasm");
    const connection = await database.connect();
    try {
      await connection.query("SET memory_limit='128MB'; SET threads=1;");
      await connection.query(dataset.initSql);
      await connection.query("SET enable_external_access=false; SET allow_unsigned_extensions=false;");
      const result = await connection.query(query);
      const columns = result.schema.fields.map((field) => field.name);
      if (columns.length > COLUMN_LIMIT) throw new Error("TOO_MANY_COLUMNS");
      const allRows = result.toArray();
      const rows = allRows.slice(0, ROW_LIMIT).map((row) => columns.map((column) => outputValue(row[column])));
      return {
        output: { type: "table", columns, rows, truncated: allRows.length > ROW_LIMIT },
        runtimeVersion: duckdb.PACKAGE_VERSION,
        datasetVersion: dataset.version,
        datasetChecksum: dataset.checksum,
        executedAt: new Date().toISOString(),
      };
    } finally {
      await connection.close().catch(() => undefined);
    }
  } catch (error) {
    if (timedOut) throw new Error("QUERY_TIMEOUT");
    throw error;
  } finally {
    window.clearTimeout(timeout);
    await database.terminate().catch(() => undefined);
    worker.terminate();
  }
}

