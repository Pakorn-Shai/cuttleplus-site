import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { sampleDatasets } from "@/core/datasets/registry";
import { limitedSandboxQuery, validateSandboxQuery } from "@/core/datasets/query-policy";

describe("sample dataset registry", () => {
  it("contains deterministic, versioned Sales, Inventory, and Employees/Supply Chain datasets", () => {
    expect(sampleDatasets.map((dataset) => dataset.id)).toEqual(["sales", "inventory", "employees-supply-chain"]);
    for (const dataset of sampleDatasets) {
      expect(dataset.version).toMatch(/^\d+\.\d+\.\d+$/u);
      expect(dataset.schema.length).toBeGreaterThan(0);
      expect(dataset.license).toBe("CC0-1.0");
      expect(dataset.checksum).toBe(`sha256:${createHash("sha256").update(dataset.initSql).digest("hex")}`);
    }
  });
});

describe("SQL sandbox policy", () => {
  it("allows one read-only SELECT or CTE and applies a hard result limit", () => {
    expect(validateSandboxQuery("WITH totals AS (SELECT 1 AS value) SELECT * FROM totals;")).toContain("WITH totals");
    expect(limitedSandboxQuery("SELECT * FROM sales_orders", 200)).toContain("LIMIT 201");
  });

  it.each([
    "DELETE FROM sales_orders",
    "SELECT * FROM sales_orders; SELECT 2",
    "SELECT * FROM read_csv_auto('https://example.com/private.csv')",
    "WITH changed AS (DELETE FROM sales_orders RETURNING *) SELECT * FROM changed",
    "INSTALL httpfs",
  ])("rejects unsafe query: %s", (query) => {
    expect(() => validateSandboxQuery(query)).toThrow();
  });

  it("does not treat forbidden words inside literals as commands", () => {
    expect(validateSandboxQuery("SELECT 'delete and https://example.com' AS note")).toContain("delete");
  });
});

