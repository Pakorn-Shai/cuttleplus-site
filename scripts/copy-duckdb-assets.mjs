import { copyFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = resolve(root, "node_modules/@duckdb/duckdb-wasm/dist");
const destination = resolve(root, "public/duckdb");
const assets = ["duckdb-eh.wasm", "duckdb-browser-eh.worker.js"];
const sqliteSource = resolve(root, "node_modules/sql.js/dist");
const sqliteDestination = resolve(root, "public/sqlite");
const sqliteAssets = ["sql-wasm.wasm", "worker.sql-wasm.js"];

await mkdir(destination, { recursive: true });
await mkdir(sqliteDestination, { recursive: true });
await Promise.all(assets.map((asset) => copyFile(resolve(source, asset), resolve(destination, asset))));
await Promise.all(sqliteAssets.map((asset) => copyFile(resolve(sqliteSource, asset), resolve(sqliteDestination, asset))));
