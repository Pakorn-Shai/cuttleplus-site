"use client";

import { Braces, Save, Trash2 } from "lucide-react";
import { useState } from "react";
import { structuredOutputSchema } from "@/core/content/document";
import { createLearningBlock, type LearningBlock } from "@/core/content/learning-blocks";
import type { StructuredOutput } from "@/core/content/types";

type FormulaBlock = Extract<LearningBlock, { type: "formula-example" }>;
type AutomationBlock = Extract<LearningBlock, { type: "automation-script" }>;

function lines(value: string) {
  return value.split(/\r?\n/u).map((item) => item.trim()).filter(Boolean);
}

export function ManualOutputEditor({ label = "Output", output, onSave }: { label?: string; output?: StructuredOutput; onSave(output: StructuredOutput): void }) {
  const [type, setType] = useState<StructuredOutput["type"]>(output?.type ?? "table");
  const [value, setValue] = useState(() => output?.type === "table" ? JSON.stringify(output, null, 2) : output?.value ?? JSON.stringify({ type: "table", columns: ["Result"], rows: [[1]], truncated: false }, null, 2));
  const [error, setError] = useState("");

  function save() {
    try {
      const candidate = type === "table"
        ? JSON.parse(value)
        : { type, value: type === "json" ? JSON.stringify(JSON.parse(value), null, 2) : value };
      const parsed = structuredOutputSchema.safeParse(candidate);
      if (!parsed.success) throw new Error("รูปแบบ output ไม่ผ่าน schema หรือมีข้อมูลเกินขีดจำกัด");
      onSave(parsed.data);
      setError("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Structured output ไม่ถูกต้อง");
    }
  }

  return <div className="manual-output-editor"><div><label>{label} type<select value={type} onChange={(event) => { const next = event.target.value as StructuredOutput["type"]; setType(next); setValue(next === "table" ? JSON.stringify({ type: "table", columns: ["Result"], rows: [[1]], truncated: false }, null, 2) : ""); }}><option value="table">Table</option><option value="text">Text</option><option value="json">JSON</option><option value="error">Error</option></select></label><button className="secondary-button" type="button" onClick={save}><Save size={14} /> Save structured {label.toLowerCase()}</button></div><textarea rows={6} spellCheck={false} value={value} onChange={(event) => setValue(event.target.value)} aria-label={`Structured ${label.toLowerCase()} value`} />{error && <p className="upload-error" role="alert">{error}</p>}</div>;
}

export function LearningBlockAuthoring({ blocks, onChange }: { blocks: Array<FormulaBlock | AutomationBlock>; onChange(blocks: Array<FormulaBlock | AutomationBlock>): void }) {
  function replace<T extends FormulaBlock | AutomationBlock>(block: T, values: Partial<T>, invalidateOutput = true) {
    onChange(blocks.map((item) => item.id === block.id ? { ...item, ...values, ...(invalidateOutput ? { output: undefined, verifiedAt: undefined, executionMode: "preview-only" as const } : {}) } as T : item));
  }

  return <section className="learning-authoring secondary-learning-authoring">
    <header className="learning-authoring-head"><div><h3><Braces size={16} /> Formula & Automation Examples</h3><p>Owner-authored source พร้อม context และ saved structured output ที่ตรวจแล้ว</p></div><div className="learning-add-actions"><button className="secondary-button" type="button" onClick={() => onChange([...blocks, createLearningBlock("formula-example") as FormulaBlock])}>+ Formula</button><button className="secondary-button" type="button" onClick={() => onChange([...blocks, createLearningBlock("automation-script") as AutomationBlock])}>+ Automation</button></div></header>
    {blocks.map((block, index) => block.type === "formula-example"
      ? <article className="learning-author-card" key={block.id}><header><strong>Formula Example {index + 1}</strong><button className="icon-button" type="button" aria-label="ลบ Formula Example" onClick={() => onChange(blocks.filter((item) => item.id !== block.id))}><Trash2 size={14} /></button></header><div className="learning-fields"><label>Engine<select value={block.engine} onChange={(event) => replace(block, { engine: event.target.value as FormulaBlock["engine"] })}><option value="dax">DAX</option><option value="power-query-m">Power Query M</option><option value="excel">Excel Formula</option><option value="google-sheets">Google Sheets Formula</option></select></label><label>Artifact type<select value={block.artifactType ?? "cell-formula"} onChange={(event) => replace(block, { artifactType: event.target.value as FormulaBlock["artifactType"] })}><option value="measure">Measure</option><option value="calculated-column">Calculated column</option><option value="calculated-table">Calculated table</option><option value="query">Query</option><option value="cell-formula">Cell formula</option><option value="array-formula">Array formula</option></select></label><label>Title<input value={block.title} onChange={(event) => replace(block, { title: event.target.value })} /></label><label>Locale<input value={block.locale ?? ""} placeholder="เช่น th-TH" onChange={(event) => replace(block, { locale: event.target.value || undefined })} /></label></div><label className="learning-code-field">Expression<textarea rows={7} spellCheck={false} value={block.expression} onChange={(event) => replace(block, { expression: event.target.value })} /></label><div className="learning-fields"><label>Prerequisites<textarea rows={4} value={block.prerequisites.join("\n")} onChange={(event) => replace(block, { prerequisites: lines(event.target.value) })} /></label><label>Compatibility<textarea rows={4} value={block.compatibility.join("\n")} onChange={(event) => replace(block, { compatibility: lines(event.target.value) })} /></label><label>Execution mode<select value={block.executionMode} onChange={(event) => replace(block, { executionMode: event.target.value as FormulaBlock["executionMode"] }, false)}><option value="preview-only">Preview only</option><option value="saved-output" disabled={!block.output}>Saved output</option></select></label><label>Verified date<input type="datetime-local" value={block.verifiedAt?.slice(0, 16) ?? ""} onChange={(event) => replace(block, { verifiedAt: event.target.value ? new Date(event.target.value).toISOString() : undefined }, false)} /></label></div><ManualOutputEditor output={block.output} onSave={(output) => replace(block, { output, executionMode: "saved-output", verifiedAt: new Date().toISOString() }, false)} /></article>
      : <article className="learning-author-card" key={block.id}><header><strong>Automation Script {index + 1}</strong><button className="icon-button" type="button" aria-label="ลบ Automation Script" onClick={() => onChange(blocks.filter((item) => item.id !== block.id))}><Trash2 size={14} /></button></header><div className="learning-fields"><label>Platform<select value={block.platform} onChange={(event) => replace(block, { platform: event.target.value as AutomationBlock["platform"] })}><option value="excel-vba">Excel VBA</option><option value="word-vba">Word VBA</option><option value="outlook-vba">Outlook VBA</option><option value="google-apps-script">Google Apps Script</option></select></label><label>Title<input value={block.title} onChange={(event) => replace(block, { title: event.target.value })} /></label><label>Entry point<input value={block.entryPoint ?? ""} placeholder="เช่น RunReport" onChange={(event) => replace(block, { entryPoint: event.target.value || undefined })} /></label><label>Execution mode<select value={block.executionMode} onChange={(event) => replace(block, { executionMode: event.target.value as AutomationBlock["executionMode"] }, false)}><option value="preview-only">Preview only</option><option value="saved-output" disabled={!block.output}>Saved output</option></select></label></div><label className="learning-code-field">Script<textarea rows={10} spellCheck={false} value={block.code} onChange={(event) => replace(block, { code: event.target.value })} /></label><div className="learning-fields"><label>Host requirements<textarea rows={4} value={block.hostRequirements.join("\n")} onChange={(event) => replace(block, { hostRequirements: lines(event.target.value) })} /></label><label>Permissions<textarea rows={4} value={block.permissions?.join("\n") ?? ""} onChange={(event) => replace(block, { permissions: lines(event.target.value) })} /></label><label>Triggers<textarea rows={4} value={block.triggers?.join("\n") ?? ""} onChange={(event) => replace(block, { triggers: lines(event.target.value) })} /></label><label>Verified date<input type="datetime-local" value={block.verifiedAt?.slice(0, 16) ?? ""} onChange={(event) => replace(block, { verifiedAt: event.target.value ? new Date(event.target.value).toISOString() : undefined }, false)} /></label></div><ManualOutputEditor output={block.output} onSave={(output) => replace(block, { output, executionMode: "saved-output", verifiedAt: new Date().toISOString() }, false)} /></article>)}
    {blocks.map((block) => <aside className="learning-author-card learning-input-card" key={`${block.id}-input`}><header><strong>Structured input · {block.title}</strong></header><p className="muted">ตัวอย่าง input แบบ Table, Text, JSON หรือ Error ที่ผู้อ่านใช้ทำความเข้าใจตัวอย่างนี้</p><ManualOutputEditor label="Input" output={block.input} onSave={(input) => replace(block, { input }, false)} /></aside>)}
    {!blocks.length && <div className="learning-empty">ยังไม่มี Formula หรือ Automation Example</div>}
  </section>;
}
