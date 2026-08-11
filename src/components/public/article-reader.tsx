"use client";

import { Check, Copy, Maximize2, Minimize2, Moon, Sun, Share2, ArrowUp, ChevronDown, ChevronUp, Columns2, Columns3 } from "lucide-react";
import { useEffect, useState } from "react";
import type { ContentBlock, StructuredOutput } from "@/core/content/types";
import { applyColorMode } from "@/lib/color-mode";

const SETTINGS_KEY = "kh-reader-settings";

interface ReaderSettings {
  fontSize: number;
  focusReading: boolean;
  contentWidth: "narrow" | "normal" | "wide";
  lineHeight: "compact" | "normal" | "relaxed";
}

function loadSettings(): ReaderSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<ReaderSettings>;
      const cw = parsed.contentWidth;
      const lh = parsed.lineHeight;
      return {
        fontSize: typeof parsed.fontSize === "number" ? parsed.fontSize : 17,
        focusReading: Boolean(parsed.focusReading),
        contentWidth: cw === "narrow" || cw === "wide" ? cw : "normal",
        lineHeight: lh === "compact" || lh === "relaxed" ? lh : "normal",
      };
    }
  } catch {}
  return { fontSize: 17, focusReading: false, contentWidth: "normal", lineHeight: "normal" };
}

function saveSettings(settings: ReaderSettings) {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch {}
}

export function ArticleReader({ blocks }: { blocks: ContentBlock[] }) {
  const [fontSize, setFontSize] = useState(() => loadSettings().fontSize);
  const [progress, setProgress] = useState(0);
  const [copied, setCopied] = useState<string | null>(null);
  const [focusReading, setFocusReading] = useState(() => loadSettings().focusReading);
  const [contentWidth, setContentWidth] = useState<"narrow" | "normal" | "wide">(() => loadSettings().contentWidth);
  const [lineHeight, setLineHeight] = useState<"compact" | "normal" | "relaxed">(() => loadSettings().lineHeight);
  const [allExpanded, setAllExpanded] = useState<boolean | null>(null);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [shareStatus, setShareStatus] = useState<"idle" | "copied" | "shared">("idle");

  useEffect(() => {
    if (focusReading) {
      document.querySelector(".article-shell, .admin-preview-paper")?.classList.add("focus-reading");
    }
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? (window.scrollY / max) * 100 : 0);
      setShowBackToTop(window.scrollY > 400);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => { saveSettings({ fontSize, focusReading, contentWidth, lineHeight }); }, [fontSize, focusReading, contentWidth, lineHeight]);

  useEffect(() => {
    if (allExpanded !== null) {
      document.querySelectorAll(".toggle-block").forEach((el) => {
        if (el instanceof HTMLDetailsElement) el.open = allExpanded;
      });
    }
  }, [allExpanded]);

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

  async function shareLink() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: document.title, url });
        setShareStatus("shared");
      } catch { return; }
    } else {
      await navigator.clipboard.writeText(url);
      setShareStatus("copied");
    }
    window.setTimeout(() => setShareStatus("idle"), 2000);
  }

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function changeFontSize(delta: number) {
    setFontSize((value) => Math.min(Math.max(value + delta, 15), 21));
  }

  const contentWidthMap = { narrow: "680px", normal: "760px", wide: "960px" };
  const lineHeightMap = { compact: "1.6", normal: "1.85", relaxed: "2.1" };

  return (
    <>
      <div className="reading-progress" style={{ width: `${progress}%` }} />
      <aside className="reader-controls" aria-label="ตั้งค่าการอ่าน">
        <button onClick={() => changeFontSize(1)} aria-label="เพิ่มขนาดตัวอักษร" title="เพิ่มขนาดตัวอักษร"><span aria-hidden="true">A+</span></button>
        <button onClick={() => changeFontSize(-1)} aria-label="ลดขนาดตัวอักษร" title="ลดขนาดตัวอักษร"><span aria-hidden="true">A−</span></button>
        <button className={focusReading ? "active" : undefined} onClick={toggleFocusReading} aria-label={focusReading ? "ออกจากโหมดโฟกัส" : "เปิดโหมดโฟกัส"} aria-pressed={focusReading} title={focusReading ? "ออกจากโหมดโฟกัส" : "เปิดโหมดโฟกัส"}>{focusReading ? <Minimize2 size={16} /> : <Maximize2 size={16} />}</button>
        <button onClick={() => setContentWidth((w) => w === "narrow" ? "normal" : w === "normal" ? "wide" : "narrow")} aria-label={`ความกว้างเนื้อหา: ${contentWidth}`} title={`ความกว้าง: ${contentWidth}`}>{contentWidth === "wide" ? <Columns3 size={16} /> : <Columns2 size={16} />}</button>
        <button onClick={() => setLineHeight((l) => l === "compact" ? "normal" : l === "normal" ? "relaxed" : "compact")} aria-label={`ระยะห่างบรรทัด: ${lineHeight}`} title={`ระยะห่าง: ${lineHeight}`}><span aria-hidden="true" style={{ fontSize: ".7rem", fontWeight: 800 }}>≡</span></button>
        <button onClick={() => setAllExpanded((prev) => prev === null ? false : !prev)} aria-label={allExpanded ? "ปิด Toggle ทั้งหมด" : "เปิด Toggle ทั้งหมด"} title={allExpanded ? "ปิด Toggle ทั้งหมด" : "เปิด Toggle ทั้งหมด"}>{allExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</button>
        <button onClick={toggleTheme} aria-label="สลับธีมสว่างและมืด" title="สลับธีมสว่างและมืด"><Moon size={16} /><Sun className="sr-only" /></button>
        <button onClick={shareLink} aria-label="แชร์หรือคัดลอกลิงก์" title="แชร์หรือคัดลอกลิงก์">{shareStatus === "copied" ? <><Check size={16} /><span className="sr-only">คัดลอกแล้ว</span></> : shareStatus === "shared" ? <><Check size={16} /><span className="sr-only">แชร์แล้ว</span></> : <Share2 size={16} />}</button>
      </aside>
      {showBackToTop && <button className="back-to-top" onClick={scrollToTop} aria-label="กลับด้านบน" title="กลับด้านบน"><ArrowUp size={18} /></button>}
      <div className="article-body" style={{ "--reader-font-size": `${fontSize}px`, "--content-width": contentWidthMap[contentWidth], "--reader-line-height": lineHeightMap[lineHeight] } as React.CSSProperties}>
        {blocks.map((block) => {
          if (block.type === "paragraph") return <p key={block.id}>{block.text}</p>;
          if (block.type === "heading") return block.level === 2 ? <h2 id={block.id} key={block.id}>{block.text}</h2> : <h3 id={block.id} key={block.id}>{block.text}</h3>;
          if (block.type === "list") return <ul key={block.id}>{block.items.map((item) => <li key={item}>{item}</li>)}</ul>;
          if (block.type === "callout") return <aside className={`callout ${block.tone}`} key={block.id}><span>{block.tone === "warning" ? "!" : "✦"}</span><div><strong>{block.title}</strong><p>{block.text}</p></div></aside>;
          if (block.type === "toggle") return <details className="toggle-block" open={block.open} key={block.id}><summary>{block.title}</summary><p>{block.text}</p></details>;
          if (block.type === "quote") return <blockquote className="article-quote" key={block.id}><p>{block.text}</p>{block.attribution && <cite>— {block.attribution}</cite>}</blockquote>;
          if (block.type === "image") return <figure className="article-figure" key={block.id}><img src={block.src} alt={block.alt} loading="lazy" />{block.caption && <figcaption>{block.caption}</figcaption>}</figure>;
          if (block.type === "embed") {
            if (block.embedType === "youtube") {
              const videoId = extractYoutubeId(block.url);
              if (videoId) return <figure className="article-embed" key={block.id}><div className="embed-responsive"><iframe src={`https://www.youtube-nocookie.com/embed/${videoId}`} title="YouTube video player" allow="accelerometer; encrypted-media; picture-in-picture" allowFullScreen loading="lazy" referrerPolicy="strict-origin-when-cross-origin" /></div>{block.caption && <figcaption>{block.caption}</figcaption>}</figure>;
            }
            return <figure className="article-embed" key={block.id}><a href={block.url} target="_blank" rel="noopener noreferrer">{block.url}</a>{block.caption && <figcaption>{block.caption}</figcaption>}</figure>;
          }
          if (block.type === "summary") return <section className="aeo-summary" key={block.id}><h2>Summary</h2><p>{block.text}</p></section>;
          if (block.type === "direct-answer") return <section className="aeo-direct-answer" key={block.id}><p>{block.text}</p></section>;
          if (block.type === "takeaways") return <section className="aeo-takeaways" key={block.id}><h2>Key Takeaways</h2><ul>{block.items.map((item) => <li key={item}>{item}</li>)}</ul></section>;
          if (block.type === "definition") return <section className="aeo-definition" key={block.id}><dl><dt>{block.term}</dt><dd>{block.text}</dd></dl></section>;
          if (block.type === "steps") return <section className="aeo-steps" key={block.id}>{block.title && <h2>{block.title}</h2>}<ol>{block.items.map((item, i) => <li key={i}><strong>{item.step}</strong>{item.detail && <p>{item.detail}</p>}</li>)}</ol></section>;
          if (block.type === "faq") return <section className="aeo-faq" key={block.id}>{block.items.map((item, i) => <details key={i}><summary>{item.question}</summary><p>{item.answer}</p></details>)}</section>;
          if (block.type === "mistakes") return <section className="aeo-mistakes" key={block.id}><h2>{block.title || "Common Mistakes"}</h2><ul>{block.items.map((item) => <li key={item}>{item}</li>)}</ul></section>;
          if (block.type === "limitations") return <section className="aeo-limitations" key={block.id}><h2>{block.title || "Limitations"}</h2><ul>{block.items.map((item) => <li key={item}>{item}</li>)}</ul></section>;
          if (block.type === "bookmark") return <a className="bookmark-card" href={block.url} target="_blank" rel="noopener noreferrer" key={block.id}>{block.favicon && <img src={block.favicon} alt="" width={16} height={16} loading="lazy" />}<div><strong>{block.title}</strong>{block.description && <span>{block.description}</span>}</div></a>;
          if (block.type === "attachment") return <a className="attachment-card" href={block.url} target="_blank" rel="noopener noreferrer" key={block.id}><strong>{block.fileName}</strong>{block.fileSize && <span>{block.fileSize < 1024 ? `${block.fileSize} B` : block.fileSize < 1048576 ? `${(block.fileSize / 1024).toFixed(1)} KB` : `${(block.fileSize / 1048576).toFixed(1)} MB`}</span>}{block.mimeType && <span>{block.mimeType}</span>}</a>;
          if (block.type === "executable-code" || block.type === "formula-example" || block.type === "automation-script") {
            const source = block.type === "formula-example" ? block.expression : block.code;
            const label = block.type === "formula-example" ? block.engine : block.type === "automation-script" ? block.platform : block.dialect ?? block.language;
            const title = block.type === "executable-code" ? "ตัวอย่างโค้ด" : block.title;
            const metadata = block.type === "formula-example" ? [
              block.artifactType && `Artifact: ${block.artifactType}`,
              block.locale && `Locale: ${block.locale}`,
              ...block.compatibility.map((item) => `Compatibility: ${item}`),
              ...block.prerequisites.map((item) => `Prerequisite: ${item}`),
              block.verifiedAt && `Verified: ${new Date(block.verifiedAt).toLocaleString("th-TH")}`,
            ].filter(Boolean) as string[] : block.type === "automation-script" ? [
              block.entryPoint && `Entry point: ${block.entryPoint}`,
              ...block.hostRequirements.map((item) => `Host: ${item}`),
              ...(block.permissions ?? []).map((item) => `Permission: ${item}`),
              ...(block.triggers ?? []).map((item) => `Trigger: ${item}`),
              block.verifiedAt && `Verified: ${new Date(block.verifiedAt).toLocaleString("th-TH")}`,
            ].filter(Boolean) as string[] : [
              block.datasetId && `Dataset: ${block.datasetId}`,
              block.datasetVersion && `Dataset version: ${block.datasetVersion}`,
              block.runtimeVersion && `Runtime: ${block.runtimeVersion}`,
              block.executedAt && `Executed: ${new Date(block.executedAt).toLocaleString("th-TH")}`,
            ].filter(Boolean) as string[];
            return <section className="learning-example-block" key={block.id}>
              <header><div><span className="pill">{label}</span><strong>{title}</strong></div><span className="learning-readonly">Saved example · Read only</span></header>
              <div className="code-block"><div className="code-head"><span>{label}</span><button className="copy-code" aria-live="polite" onClick={() => copyCode(block.id, source)}>{copied === block.id ? <><Check size={13} /> คัดลอกแล้ว</> : <><Copy size={13} /> คัดลอก</>}</button></div><pre><code>{source}</code></pre></div>
              {metadata.length > 0 && <ul className="learning-example-meta">{metadata.map((item) => <li key={item}>{item}</li>)}</ul>}
              {(block.type === "formula-example" || block.type === "automation-script") && block.input && <StructuredOutputDisplay output={block.input} label="Input" />}
              {block.output && <StructuredOutputDisplay output={block.output} />}
            </section>;
          }
          return <div className="code-block" key={block.id}><div className="code-head"><span>{block.filename ?? block.language}</span><button className="copy-code" onClick={() => copyCode(block.id, block.code)}>{copied === block.id ? <><Check size={13} /> คัดลอกแล้ว</> : <><Copy size={13} /> คัดลอก</>}</button></div><pre><code>{block.code}</code></pre></div>;
        })}
      </div>
    </>
  );
}

function extractYoutubeId(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === "youtu.be") return parsed.pathname.slice(1).split("/")[0] || null;
    if (parsed.hostname.includes("youtube.com")) return parsed.searchParams.get("v");
    return null;
  } catch {
    return null;
  }
}

function StructuredOutputDisplay({ output, label = "Saved output" }: { output: StructuredOutput; label?: string }) {
  if (output.type !== "table") return <div className={`learning-output ${output.type}`}><header>{label}</header><pre>{output.value}</pre></div>;
  return <div className="learning-output table"><header>{label}</header><div className="learning-output-table" role="region" aria-label={`${label} แบบตาราง`} tabIndex={0}><table><thead><tr>{output.columns.map((column) => <th scope="col" key={column}>{column}</th>)}</tr></thead><tbody>{output.rows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((value, columnIndex) => <td key={columnIndex}>{value === null ? <span className="muted">NULL</span> : String(value)}</td>)}</tr>)}</tbody></table></div>{output.truncated && <small>ผลลัพธ์ถูกจำกัดจำนวนแถว</small>}</div>;
}