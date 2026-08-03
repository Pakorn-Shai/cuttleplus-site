import { z } from "zod";

const outputScalarSchema = z.union([z.string().max(10_000), z.number(), z.boolean(), z.null()]);

export const structuredOutputSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("table"), columns: z.array(z.string().max(200)).max(50), rows: z.array(z.array(outputScalarSchema).max(50)).max(500), truncated: z.boolean().optional() }),
  z.object({ type: z.enum(["text", "json", "error"]), value: z.string().max(100_000) }),
]);

export const contentBlockSchema = z.discriminatedUnion("type", [
  z.object({ id: z.string(), type: z.literal("paragraph"), text: z.string() }),
  z.object({ id: z.string(), type: z.literal("heading"), level: z.union([z.literal(2), z.literal(3)]), text: z.string() }),
  z.object({ id: z.string(), type: z.literal("callout"), tone: z.enum(["note", "tip", "warning"]), title: z.string(), text: z.string() }),
  z.object({ id: z.string(), type: z.literal("code"), language: z.string(), filename: z.string().optional(), code: z.string() }),
  z.object({ id: z.string(), type: z.literal("toggle"), title: z.string(), text: z.string(), open: z.boolean().optional() }),
  z.object({ id: z.string(), type: z.literal("list"), items: z.array(z.string()) }),
  z.object({
    id: z.string(), type: z.literal("executable-code"), language: z.enum(["sql", "javascript"]),
    dialect: z.enum(["duckdb", "sqlite", "tsql", "tsql-compatible"]).optional(),
    executionMode: z.enum(["admin-sandbox", "saved-output", "preview-only"]), code: z.string().max(200_000), compatibleCode: z.string().max(200_000).optional(),
    datasetId: z.string().max(160).optional(), datasetVersion: z.string().max(80).optional(), output: structuredOutputSchema.optional(), executedAt: z.string().datetime().optional(),
  }),
  z.object({
    id: z.string(), type: z.literal("formula-example"), engine: z.enum(["dax", "power-query-m", "excel", "google-sheets"]),
    artifactType: z.enum(["measure", "calculated-column", "calculated-table", "query", "cell-formula", "array-formula"]).optional(),
    title: z.string().max(240), expression: z.string().max(200_000), prerequisites: z.array(z.string().max(500)).max(50), compatibility: z.array(z.string().max(200)).max(30), locale: z.string().max(40).optional(),
    output: structuredOutputSchema.optional(), executionMode: z.enum(["saved-output", "preview-only"]), verifiedAt: z.string().datetime().optional(),
  }),
  z.object({
    id: z.string(), type: z.literal("automation-script"), platform: z.enum(["excel-vba", "word-vba", "outlook-vba", "google-apps-script"]),
    title: z.string().max(240), code: z.string().max(200_000), entryPoint: z.string().max(240).optional(), hostRequirements: z.array(z.string().max(500)).max(50),
    permissions: z.array(z.string().max(500)).max(50).optional(), triggers: z.array(z.string().max(500)).max(50).optional(), output: structuredOutputSchema.optional(),
    executionMode: z.enum(["saved-output", "preview-only"]), verifiedAt: z.string().datetime().optional(),
  }),
]);
