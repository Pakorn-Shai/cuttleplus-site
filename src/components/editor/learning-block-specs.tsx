"use client";

import { defaultBlockSpecs } from "@blocknote/core";
import { createReactBlockSpec } from "@blocknote/react";
import { contentBlockSchema } from "@/core/content/document";

const learningPropSchema = { data: { default: "" } } as const;

function LearningBlockPreview({ data, kind }: { data: string; kind: string }) {
  let title = kind;
  let detail = "ตั้งค่าผ่าน Learning Example inspector ใต้ Editor";
  try {
    const parsed = contentBlockSchema.safeParse(JSON.parse(data));
    if (parsed.success) {
      const block = parsed.data;
      if (block.type === "executable-code") { title = `Executable SQL · ${block.dialect ?? block.language}`; detail = block.code.split("\n")[0] || detail; }
      if (block.type === "formula-example") { title = `Formula · ${block.engine}`; detail = block.title; }
      if (block.type === "automation-script") { title = `Automation · ${block.platform}`; detail = block.title; }
    }
  } catch {}
  return <div className="native-learning-block" contentEditable={false}><strong>{title}</strong><span>{detail}</span><small>Metadata อยู่ใน BlockNote document · แก้ไขใน inspector ด้านล่าง</small></div>;
}

const executableCodeSpec = createReactBlockSpec(
  { type: "executableCode", propSchema: learningPropSchema, content: "none" },
  { render: ({ block }) => <LearningBlockPreview data={block.props.data} kind="Executable Code" /> },
)();

const formulaExampleSpec = createReactBlockSpec(
  { type: "formulaExample", propSchema: learningPropSchema, content: "none" },
  { render: ({ block }) => <LearningBlockPreview data={block.props.data} kind="Formula Example" /> },
)();

const automationScriptSpec = createReactBlockSpec(
  { type: "automationScript", propSchema: learningPropSchema, content: "none" },
  { render: ({ block }) => <LearningBlockPreview data={block.props.data} kind="Automation Script" /> },
)();

// Rich block specs — callout, toggle, quote, image, embed
// These use inline content so they survive save/reload without flattening.

const calloutPropSchema = {
  tone: { default: "note" as "note" | "tip" | "warning" },
  title: { default: "" },
} as const;

const calloutSpec = createReactBlockSpec(
  { type: "calloutBlock", propSchema: calloutPropSchema, content: "inline" },
  {
    render: ({ block, contentRef }) => (
      <div className={`bn-callout bn-callout-${block.props.tone}`} ref={contentRef}>
        {block.props.title && <strong className="bn-callout-title">{block.props.title}</strong>}
        <div className="bn-callout-body" />
      </div>
    ),
  },
)();

const togglePropSchema = {
  title: { default: "" },
  open: { default: false },
} as const;

const toggleSpec = createReactBlockSpec(
  { type: "toggleBlock", propSchema: togglePropSchema, content: "inline" },
  {
    render: ({ block, contentRef }) => (
      <details className="bn-toggle" open={block.props.open} ref={contentRef}>
        <summary className="bn-toggle-summary">{block.props.title || "Toggle"}</summary>
        <div className="bn-toggle-body" />
      </details>
    ),
  },
)();

const quotePropSchema = {
  attribution: { default: "" },
} as const;

const quoteSpec = createReactBlockSpec(
  { type: "quoteBlock", propSchema: quotePropSchema, content: "inline" },
  {
    render: ({ block, contentRef }) => (
      <blockquote className="bn-quote" ref={contentRef}>
        <div className="bn-quote-body" />
        {block.props.attribution && <cite className="bn-quote-cite">— {block.props.attribution}</cite>}
      </blockquote>
    ),
  },
)();

const imagePropSchema = {
  src: { default: "" },
  alt: { default: "" },
  caption: { default: "" },
  width: { default: 0 },
  height: { default: 0 },
} as const;

const imageSpec = createReactBlockSpec(
  { type: "imageBlock", propSchema: imagePropSchema, content: "none" },
  {
    render: ({ block }) => {
      if (!block.props.src) {
        return <div className="bn-image-placeholder" contentEditable={false}>🖼 ยังไม่ได้เลือกภาพ — ตั้งค่า src ใน properties</div>;
      }
      return (
        <figure className="bn-image-figure" contentEditable={false}>
          <img src={block.props.src} alt={block.props.alt} loading="lazy" />
          {block.props.caption && <figcaption>{block.props.caption}</figcaption>}
        </figure>
      );
    },
  },
)();

const embedPropSchema = {
  url: { default: "" },
  embedType: { default: "youtube" as "youtube" | "vimeo" | "other" },
  caption: { default: "" },
} as const;

const embedSpec = createReactBlockSpec(
  { type: "embedBlock", propSchema: embedPropSchema, content: "none" },
  {
    render: ({ block }) => {
      if (!block.props.url) {
        return <div className="bn-embed-placeholder" contentEditable={false}>🔗 ยังไม่ได้ใส่ URL — ตั้งค่า url ใน properties</div>;
      }
      return (
        <figure className="bn-embed-figure" contentEditable={false}>
          <div className="bn-embed-preview">
            <span className="pill">{block.props.embedType}</span>
            <a href={block.props.url} target="_blank" rel="noopener noreferrer">{block.props.url}</a>
          </div>
          {block.props.caption && <figcaption>{block.props.caption}</figcaption>}
        </figure>
      );
    },
  },
)();

const { quote: _defaultQuote, image: _defaultImage, ...baseBlockSpecs } = defaultBlockSpecs;

export const knowledgeEditorBlockSpecs = {
  ...baseBlockSpecs,
  executableCode: executableCodeSpec,
  formulaExample: formulaExampleSpec,
  automationScript: automationScriptSpec,
  calloutBlock: calloutSpec,
  toggleBlock: toggleSpec,
  quoteBlock: quoteSpec,
  imageBlock: imageSpec,
  embedBlock: embedSpec,
};
