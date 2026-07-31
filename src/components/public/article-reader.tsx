"use client";

import { Check, Copy, Maximize2, Minus, Moon, Plus, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import type { ContentBlock } from "@/core/content/types";
import { applyColorMode } from "@/lib/color-mode";

export function ArticleReader({ blocks }: { blocks: ContentBlock[] }) {
  const [fontSize, setFontSize] = useState(17);
  const [progress, setProgress] = useState(0);
  const [copied, setCopied] = useState<string | null>(null);

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

  return (
    <>
      <div className="reading-progress" style={{ width: `${progress}%` }} />
      <aside className="reader-controls" aria-label="ตั้งค่าการอ่าน">
        <button onClick={() => setFontSize((value) => Math.min(value + 1, 21))} aria-label="เพิ่มขนาดตัวอักษร"><Plus size={16} /></button>
        <button onClick={() => setFontSize((value) => Math.max(value - 1, 15))} aria-label="ลดขนาดตัวอักษร"><Minus size={16} /></button>
        <button onClick={() => document.querySelector(".article-shell")?.classList.toggle("focus-reading")} aria-label="โหมดโฟกัส"><Maximize2 size={16} /></button>
        <button onClick={toggleTheme} aria-label="สลับสี"><Moon size={16} /><Sun className="sr-only" /></button>
      </aside>
      <div className="article-body" style={{ "--reader-font-size": `${fontSize}px` } as React.CSSProperties}>
        {blocks.map((block) => {
          if (block.type === "paragraph") return <p key={block.id}>{block.text}</p>;
          if (block.type === "heading") return block.level === 2 ? <h2 id={block.id} key={block.id}>{block.text}</h2> : <h3 id={block.id} key={block.id}>{block.text}</h3>;
          if (block.type === "list") return <ul key={block.id}>{block.items.map((item) => <li key={item}>{item}</li>)}</ul>;
          if (block.type === "callout") return <aside className={`callout ${block.tone}`} key={block.id}><span>{block.tone === "warning" ? "!" : "✦"}</span><div><strong>{block.title}</strong><p>{block.text}</p></div></aside>;
          if (block.type === "toggle") return <details className="toggle-block" open={block.open} key={block.id}><summary>{block.title}</summary><p>{block.text}</p></details>;
          return <div className="code-block" key={block.id}><div className="code-head"><span>{block.filename ?? block.language}</span><button className="copy-code" onClick={() => copyCode(block.id, block.code)}>{copied === block.id ? <><Check size={13} /> คัดลอกแล้ว</> : <><Copy size={13} /> คัดลอก</>}</button></div><pre><code>{block.code}</code></pre></div>;
        })}
      </div>
    </>
  );
}
