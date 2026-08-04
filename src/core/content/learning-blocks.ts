import type { ContentBlock } from "./types";
import { sampleDatasets } from "../datasets/registry";

export type LearningBlock = Extract<ContentBlock, { type: "executable-code" | "formula-example" | "automation-script" }>;

export function createLearningBlock(type: LearningBlock["type"]): LearningBlock {
  const id = crypto.randomUUID();
  if (type === "executable-code") {
    const dataset = sampleDatasets[0];
    return { id, type, language: "sql", dialect: "duckdb", executionMode: "admin-sandbox", datasetId: dataset.id, datasetVersion: dataset.version, datasetChecksum: dataset.checksum, code: dataset.sampleQuery };
  }
  if (type === "formula-example") {
    return { id, type, engine: "excel", artifactType: "cell-formula", title: "Formula Example", expression: "=SUM(B2:B10)", prerequisites: [], compatibility: ["Microsoft Excel 365"], executionMode: "preview-only" };
  }
  return { id, type, platform: "excel-vba", title: "Automation Script", code: "Sub Run()\n    ' Add reviewed automation code here\nEnd Sub", hostRequirements: ["Excel Desktop"], permissions: [], triggers: [], executionMode: "preview-only" };
}

export function nativeLearningBlockType(type: LearningBlock["type"]) {
  if (type === "executable-code") return "executableCode";
  if (type === "formula-example") return "formulaExample";
  return "automationScript";
}

