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

export const knowledgeEditorBlockSpecs = {
  ...defaultBlockSpecs,
  executableCode: executableCodeSpec,
  formulaExample: formulaExampleSpec,
  automationScript: automationScriptSpec,
};

