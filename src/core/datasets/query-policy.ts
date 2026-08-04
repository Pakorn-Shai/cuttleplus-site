const forbiddenSql = /\b(attach|call|copy|create|delete|detach|drop|export|import|insert|install|load|pragma|set|truncate|update|vacuum)\b/iu;
const externalSql = /\b(read_csv|read_csv_auto|read_json|read_json_auto|read_parquet|httpfs|postgres_scan|sqlite_scan)\s*\(|https?:\/\//iu;

export function validateSandboxQuery(value: string) {
  const query = value.trim().replace(/;+\s*$/u, "");
  if (!query) throw new Error("QUERY_REQUIRED");
  if (query.length > 20_000) throw new Error("QUERY_TOO_LARGE");
  if (!/^(select|with)\b/iu.test(query)) throw new Error("READ_ONLY_QUERY_REQUIRED");

  const withoutLiterals = query
    .replace(/--[^\n]*/gu, " ")
    .replace(/\/\*[\s\S]*?\*\//gu, " ")
    .replace(/'(?:''|[^'])*'/gu, "''")
    .replace(/"(?:""|[^"])*"/gu, '""');
  if (withoutLiterals.includes(";")) throw new Error("SINGLE_STATEMENT_REQUIRED");
  if (forbiddenSql.test(withoutLiterals) || externalSql.test(withoutLiterals)) throw new Error("UNSAFE_QUERY");
  return query;
}

export function limitedSandboxQuery(query: string, rowLimit = 200) {
  return `SELECT * FROM (${validateSandboxQuery(query)}) AS __knowledge_hub_result LIMIT ${rowLimit + 1}`;
}

