"use client";

import { Database, Play, Save, Trash2 } from "lucide-react";
import { useState } from "react";
import type { ContentBlock } from "@/core/content/types";
import type { SandboxRunResult } from "@/core/datasets/duckdb-sandbox";
import { sampleDatasets } from "@/core/datasets/registry";

type ExecutableBlock = Extract<ContentBlock, { type: "executable-code" }>;

const runErrors: Record<string, string> = {
  QUERY_REQUIRED: "กรุณาเขียน query ก่อนรัน",
  QUERY_TOO_LARGE: "Query ยาวเกินขีดจำกัด 20,000 ตัวอักษร",
  READ_ONLY_QUERY_REQUIRED: "Sandbox อนุญาตเฉพาะ SELECT หรือ WITH",
  SINGLE_STATEMENT_REQUIRED: "รันได้ครั้งละหนึ่ง statement เท่านั้น",
  UNSAFE_QUERY: "Query ใช้คำสั่งหรือแหล่งข้อมูลภายนอกที่ sandbox ไม่อนุญาต",
  QUERY_TIMEOUT: "Query ใช้เวลาเกิน 4 วินาทีและ worker ถูกหยุดแล้ว",
  TOO_MANY_COLUMNS: "ผลลัพธ์มีมากกว่า 50 columns",
};

function defaultBlock(): ExecutableBlock {
  const dataset = sampleDatasets[0];
  return {
    id: crypto.randomUUID(),
    type: "executable-code",
    language: "sql",
    dialect: "duckdb",
    executionMode: "admin-sandbox",
    datasetId: dataset.id,
    datasetVersion: dataset.version,
    datasetChecksum: dataset.checksum,
    code: dataset.sampleQuery,
  };
}

export function ExecutableCodeAuthoring({ blocks, onChange }: { blocks: ExecutableBlock[]; onChange(blocks: ExecutableBlock[]): void }) {
  const [pending, setPending] = useState<Record<string, SandboxRunResult>>({});
  const [runningId, setRunningId] = useState<string>();
  const [errors, setErrors] = useState<Record<string, string>>({});

  function replace(id: string, values: Partial<ExecutableBlock>, invalidateOutput = false) {
    onChange(blocks.map((block) => block.id === id ? {
      ...block,
      ...values,
      ...(invalidateOutput ? { output: undefined, executedAt: undefined, runtimeVersion: undefined, executionMode: "admin-sandbox" as const } : {}),
    } : block));
    if (invalidateOutput) setPending((current) => { const next = { ...current }; delete next[id]; return next; });
  }

  async function run(block: ExecutableBlock) {
    const query = block.dialect === "tsql-compatible" ? block.compatibleCode ?? "" : block.code;
    setRunningId(block.id);
    setErrors((current) => ({ ...current, [block.id]: "" }));
    try {
      const result = block.dialect === "sqlite"
        ? await import("@/core/datasets/sqlite-sandbox").then(({ runSqliteSandbox }) => runSqliteSandbox({ datasetId: block.datasetId ?? "", datasetVersion: block.datasetVersion, query }))
        : await import("@/core/datasets/duckdb-sandbox").then(({ runDuckDbSandbox }) => runDuckDbSandbox({ datasetId: block.datasetId ?? "", datasetVersion: block.datasetVersion, query }));
      setPending((current) => ({ ...current, [block.id]: result }));
    } catch (error) {
      const code = error instanceof Error ? error.message : "UNKNOWN";
      setErrors((current) => ({ ...current, [block.id]: runErrors[code] ?? `รันไม่สำเร็จ: ${code}` }));
    } finally {
      setRunningId(undefined);
    }
  }

  function chooseDataset(block: ExecutableBlock, datasetId: string) {
    const dataset = sampleDatasets.find((item) => item.id === datasetId) ?? sampleDatasets[0];
    replace(block.id, { datasetId: dataset.id, datasetVersion: dataset.version, datasetChecksum: dataset.checksum, code: dataset.sampleQuery }, true);
  }

  return <section className="learning-authoring">
    <header className="learning-authoring-head"><div><h3><Database size={16} /> SQL Learning Examples</h3><p>รัน DuckDB ใน Browser Worker แล้วบันทึกเฉพาะผลที่ตรวจแล้วลงบทความ</p></div><button className="secondary-button" type="button" onClick={() => onChange([...blocks, defaultBlock()])}>+ เพิ่ม SQL Example</button></header>
    {blocks.map((block, index) => {
      const dataset = sampleDatasets.find((item) => item.id === block.datasetId) ?? sampleDatasets[0];
      const canRun = block.dialect === "duckdb" || block.dialect === "sqlite" || block.dialect === "tsql-compatible";
      const result = pending[block.id];
      return <article className="learning-author-card" key={block.id}>
        <header><strong>SQL Example {index + 1}</strong><button className="icon-button" type="button" aria-label="ลบ SQL Example" onClick={() => onChange(blocks.filter((item) => item.id !== block.id))}><Trash2 size={14} /></button></header>
        <div className="learning-fields">
          <label>Dialect<select value={block.dialect ?? "duckdb"} onChange={(event) => { const dialect = event.target.value as ExecutableBlock["dialect"]; replace(block.id, { dialect, compatibleCode: dialect === "tsql-compatible" ? block.compatibleCode ?? dataset.sampleQuery : block.compatibleCode }, true); }}><option value="duckdb">DuckDB · Run ได้</option><option value="sqlite">SQLite · Run ได้</option><option value="tsql-compatible">T-SQL + DuckDB compatible query</option><option value="tsql">T-SQL · Preview only</option></select></label>
          <label>Sample dataset<select value={dataset.id} onChange={(event) => chooseDataset(block, event.target.value)}>{sampleDatasets.map((item) => <option value={item.id} key={item.id}>{item.name} · v{item.version}</option>)}</select></label>
          <label>Execution mode<select value={block.executionMode} onChange={(event) => replace(block.id, { executionMode: event.target.value as ExecutableBlock["executionMode"] }, false)}><option value="admin-sandbox">Admin sandbox</option><option value="saved-output" disabled={!block.output}>Saved output</option><option value="preview-only">Preview only</option></select></label>
        </div>
        <details className="dataset-details"><summary>ดู schema และ data dictionary</summary><p>{dataset.description}</p>{dataset.schema.map((table) => <div key={table.name}><strong>{table.name}</strong><span>{table.description}</span><ul>{table.columns.map((column) => <li key={column.name}><code>{column.name}</code> {column.type} — {column.description}</li>)}</ul></div>)}<small>{dataset.license} · {dataset.checksum}</small></details>
        <label className="learning-code-field">{block.dialect === "tsql-compatible" ? "T-SQL ต้นฉบับ" : "SQL query"}<textarea value={block.code} rows={8} spellCheck={false} onChange={(event) => replace(block.id, { code: event.target.value }, true)} /></label>
        {block.dialect === "tsql-compatible" && <label className="learning-code-field">DuckDB-compatible query<textarea value={block.compatibleCode ?? dataset.sampleQuery} rows={8} spellCheck={false} onChange={(event) => replace(block.id, { compatibleCode: event.target.value }, true)} /></label>}
        {!canRun && <p className="admin-notice">Dialect นี้เก็บ source และ saved output ได้ แต่ยังไม่อ้างว่ารันใน sandbox จนกว่าจะมี runtime ตรง dialect</p>}
        <div className="learning-run-actions"><button className="primary-button" type="button" disabled={!canRun || runningId === block.id} onClick={() => void run(block)}><Play size={14} /> {runningId === block.id ? "กำลังรัน..." : "Run ใน Browser"}</button>{block.output && <span className="save-status">มี Saved output · {block.runtimeVersion ?? "runtime เดิม"}</span>}</div>
        {errors[block.id] && <p className="upload-error" role="alert">{errors[block.id]}</p>}
        {result && <div className="learning-review"><header><strong>Review output</strong><span>{result.output.type === "table" ? `${result.output.rows.length} rows` : result.output.type}</span></header>{result.output.type === "table" ? <div className="learning-output-table"><table><thead><tr>{result.output.columns.map((column) => <th key={column}>{column}</th>)}</tr></thead><tbody>{result.output.rows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((value, columnIndex) => <td key={columnIndex}>{value === null ? "NULL" : String(value)}</td>)}</tr>)}</tbody></table></div> : <pre>{result.output.value}</pre>}<button className="secondary-button" type="button" onClick={() => { replace(block.id, { ...result, executionMode: "saved-output" }); setPending((current) => { const next = { ...current }; delete next[block.id]; return next; }); }}><Save size={14} /> บันทึกผลลัพธ์นี้ในบทความ</button></div>}
      </article>;
    })}
    {!blocks.length && <div className="learning-empty">ยังไม่มี SQL Example — เพิ่ม block เมื่อบทความต้องมีตัวอย่างที่รันและตรวจผลได้</div>}
  </section>;
}
