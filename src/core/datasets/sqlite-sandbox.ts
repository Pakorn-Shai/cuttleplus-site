import type { StructuredOutput } from "@/core/content/types";
import { getSampleDataset } from "./registry";
import { limitedSandboxQuery } from "./query-policy";

const ROW_LIMIT = 200;
const COLUMN_LIMIT = 50;
const TIMEOUT_MS = 4_000;

type SqliteResult = { columns: string[]; values: Array<Array<string | number | null | Uint8Array>> };
type WorkerResponse = { id: number; results?: SqliteResult[]; error?: string };

function scalar(value: string | number | null | Uint8Array): string | number | null {
  if (value instanceof Uint8Array) return `[binary ${value.byteLength} bytes]`;
  return value;
}

export async function runSqliteSandbox(input: { datasetId: string; datasetVersion?: string; query: string }) {
  const dataset = getSampleDataset(input.datasetId, input.datasetVersion);
  if (!dataset) throw new Error("DATASET_NOT_FOUND");
  const query = limitedSandboxQuery(input.query, ROW_LIMIT);
  const worker = new Worker("/sqlite/worker.sql-wasm.js");
  let requestId = 0;
  let timedOut = false;

  const execute = (sql: string) => new Promise<SqliteResult[]>((resolve, reject) => {
    const id = ++requestId;
    const onMessage = (event: MessageEvent<WorkerResponse>) => {
      if (event.data.id !== id) return;
      worker.removeEventListener("message", onMessage);
      if (event.data.error) reject(new Error(event.data.error));
      else resolve(event.data.results ?? []);
    };
    worker.addEventListener("message", onMessage);
    worker.postMessage({ id, action: "exec", sql });
  });

  const timeout = window.setTimeout(() => {
    timedOut = true;
    worker.terminate();
  }, TIMEOUT_MS);

  try {
    await execute(dataset.initSql);
    const results = await execute(query);
    const result = results.at(-1) ?? { columns: [], values: [] };
    if (result.columns.length > COLUMN_LIMIT) throw new Error("TOO_MANY_COLUMNS");
    const rows = result.values.slice(0, ROW_LIMIT).map((row) => row.map(scalar));
    const output: StructuredOutput = { type: "table", columns: result.columns, rows, truncated: result.values.length > ROW_LIMIT };
    return {
      output,
      runtimeVersion: "sql.js-1.14.1",
      datasetVersion: dataset.version,
      datasetChecksum: dataset.checksum,
      executedAt: new Date().toISOString(),
    };
  } catch (error) {
    if (timedOut) throw new Error("QUERY_TIMEOUT");
    throw error;
  } finally {
    window.clearTimeout(timeout);
    worker.terminate();
  }
}
