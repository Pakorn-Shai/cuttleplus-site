"use client";

import { Check, Copy, Maximize2, Minimize2, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import type { ContentBlock, StructuredOutput } from "@/core/content/types";
import { applyColorMode } from "@/lib/color-mode";

export function ArticleReader({ blocks }: { blocks: ContentBlock[] }) {
  const [fontSize, setFontSize] = useState(17);
  const [progress, setProgress] = useState(0);
  const [copied, setCopied] = useState<string | null>(null);
  const [focusReading, setFocusReading] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? (window.scrollY / max) * 100 : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  async function copyCode(id: string, code: string) {
    await navigator.clipboard.writeText(code);
    setCopied(id);
    window.setTimeout(() => setCopied(null), 1500);
  }

  function toggleTheme() {
    const isDark = document.querySelector(".public-theme")?.classList.contains("dark");
    applyColorMode(isDark ? "light" : "dark");
  }

  function toggleFocusReading() {
    const next = !focusReading;
    setFocusReading(next);
    document.querySelector(".article-shell, .admin-preview-paper")?.classList.toggle("focus-reading", next);
  }

  return (
    <>
      <div className="reading-progress" style={{ width: `${progress}%` }} />
      <aside className="reader-controls" aria-label="ตั้งค่าการอ่าน">
        <button onClick={() => setFontSize((value) => Math.min(value + 1, 21))} aria-label="เพิ่มขนาดตัวอักษร" title="เพิ่มขนาดตัวอักษร"><span aria-hidden="true">A+</span></button>
        <button onClick={() => setFontSize((value) => Math.max(value - 1, 15))} aria-label="ลดขนาดตัวอักษร" title="ลดขนาดตัวอักษร"><span aria-hidden="true">A−</span></button>
        <button className={focusReading ? "active" : undefined} onClick={toggleFocusReading} aria-label={focusReading ? "ออกจากโหมดโฟกัส" : "เปิดโหมดโฟกัส"} aria-pressed={focusReading} title={focusReading ? "ออกจากโหมดโฟกัส" : "เปิดโหมดโฟกัส"}>{focusReading ? <Minimize2 size={16} /> : <Maximize2 size={16} />}</button>
        <button onClick={toggleTheme} aria-label="สลับธีมสว่างและมืด" title="สลับธีมสว่างและมืด"><Moon size={16} /><Sun className="sr-only" /></button>
      </aside>
      <div className="article-body" style={{ "--reader-font-size": `${fontSize}px` } as React.CSSProperties}>
        {blocks.map((block) => {
          if (block.type === "paragraph") return <p key={block.id}>{block.text}</p>;
          if (block.type === "heading") return block.level === 2 ? <h2 id={block.id} key={block.id}>{block.text}</h2> : <h3 id={block.id} key={block.id}>{block.text}</h3>;
          if (block.type === "list") return <ul key={block.id}>{block.items.map((item) => <li key={item}>{item}</li>)}</ul>;
          if (block.type === "callout") return <aside className={`callout ${block.tone}`} key={block.id}><span>{block.tone === "warning" ? "!" : "✦"}</span><div><strong>{block.title}</strong><p>{block.text}</p></div></aside>;
          if (block.type === "toggle") return <details className="toggle-block" open={block.open} key={block.id}><summary>{block.title}</summary><p>{block.text}</p></details>;
          if (block.type === "executable-code" || block.type === "formula-example" || block.type === "automation-script") {
            const source = block.type === "formula-example" ? block.expression : block.code;
            const label = block.type === "formula-example" ? block.engine : block.type === "automation-script" ? block.platform : block.dialect ?? block.language;
            const title = block.type === "executable-code" ? "ตัวอย่างโค้ด" : block.title;
            const metadata = block.type === "formula-example" ? [...block.compatibility, ...block.prerequisites] : block.type === "automation-script" ? block.hostRequirements : [block.datasetId, block.datasetVersion].filter(Boolean) as string[];
            return <section className="learning-example-block" key={block.id}>
              <header><div><span className="pill">{label}</span><strong>{title}</strong></div><span className="learning-readonly">Saved example · Read only</span></header>
              <div className="code-block"><div className="code-head"><span>{label}</span><button className="copy-code" onClick={() => copyCode(block.id, source)}>{copied === block.id ? <><Check size={13} /> คัดลอกแล้ว</> : <><Copy size={13} /> คัดลอก</>}</button></div><pre><code>{source}</code></pre></div>
              {metadata.length > 0 && <ul className="learning-example-meta">{metadata.map((item) => <li key={item}>{item}</li>)}</ul>}
              {block.output && <StructuredOutputDisplay output={block.output} />}
            </section>;
          }
          return <div className="code-block" key={block.id}><div className="code-head"><span>{block.filename ?? block.language}</span><button className="copy-code" onClick={() => copyCode(block.id, block.code)}>{copied === block.id ? <><Check size={13} /> คัดลอกแล้ว</> : <><Copy size={13} /> คัดลอก</>}</button></div><pre><code>{block.code}</code></pre></div>;
        })}
      </div>
    </>
  );
}

function StructuredOutputDisplay({ output }: { output: StructuredOutput }) {
  if (output.type !== "table") return <div className={`learning-output ${output.type}`}><header>Saved output</header><pre>{output.value}</pre></div>;
  return <div className="learning-output table"><header>Saved output</header><div className="learning-output-table"><table><thead><tr>{output.columns.map((column) => <th key={column}>{column}</th>)}</tr></thead><tbody>{output.rows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((value, columnIndex) => <td key={columnIndex}>{value === null ? <span className="muted">NULL</span> : String(value)}</td>)}</tr>)}</tbody></table></div>{output.truncated && <small>ผลลัพธ์ถูกจำกัดจำนวนแถว</small>}</div>;
}
