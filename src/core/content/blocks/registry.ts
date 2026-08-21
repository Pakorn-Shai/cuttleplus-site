import type { ContentBlock, StructuredOutput } from "../types";

interface BlockHandlers<T extends ContentBlock> {
  plainText(block: T): string;
  safeHtml(block: T): string;
  markdown(block: T): string;
}

interface RuntimeBlockDefinition {
  plainText(block: ContentBlock): string;
  safeHtml(block: ContentBlock): string;
  markdown(block: ContentBlock): string;
}

function defineBlock<T extends ContentBlock>(handlers: BlockHandlers<T>): RuntimeBlockDefinition {
  return {
    plainText: (block) => handlers.plainText(block as T),
    safeHtml: (block) => handlers.safeHtml(block as T),
    markdown: (block) => handlers.markdown(block as T),
  };
}

const blockRegistry: Record<ContentBlock["type"], RuntimeBlockDefinition> = {
  paragraph: defineBlock<Extract<ContentBlock, { type: "paragraph" }>>({
    plainText: (block) => block.text,
    safeHtml: (block) => `<p>${escapeText(block.text)}</p>`,
    markdown: (block) => block.text,
  }),
  heading: defineBlock<Extract<ContentBlock, { type: "heading" }>>({
    plainText: (block) => block.text,
    safeHtml: (block) => `<h${block.level} id="${escapeAttribute(block.id)}">${escapeText(block.text)}</h${block.level}>`,
    markdown: (block) => `${"#".repeat(block.level)} ${block.text}`,
  }),
  list: defineBlock<Extract<ContentBlock, { type: "list" }>>({
    plainText: (block) => block.items.join(" "),
    safeHtml: (block) => `<ul>${block.items.map((item) => `<li>${escapeText(item)}</li>`).join("")}</ul>`,
    markdown: (block) => block.items.map((item) => `- ${item}`).join("\n"),
  }),
  callout: defineBlock<Extract<ContentBlock, { type: "callout" }>>({
    plainText: (block) => `${block.title} ${block.text}`,
    safeHtml: (block) => `<aside class="callout ${block.tone}"><strong>${escapeText(block.title)}</strong><p>${escapeText(block.text)}</p></aside>`,
    markdown: (block) => [`> **${block.title}** (${block.tone})`, ...block.text.split(/\r?\n/).map((line) => `> ${line}`)].join("\n"),
  }),
  toggle: defineBlock<Extract<ContentBlock, { type: "toggle" }>>({
    plainText: (block) => `${block.title} ${block.text}`,
    safeHtml: (block) => `<details${block.open ? " open" : ""}><summary>${escapeText(block.title)}</summary><p>${escapeText(block.text)}</p></details>`,
    markdown: (block) => `<details${block.open ? " open" : ""}>\n<summary>${block.title}</summary>\n\n${block.text}\n\n</details>`,
  }),
  quote: defineBlock<Extract<ContentBlock, { type: "quote" }>>({
    plainText: (block) => `"${block.text}"${block.attribution ? ` — ${block.attribution}` : ""}`,
    safeHtml: (block) => `<blockquote><p>${escapeText(block.text)}</p>${block.attribution ? `<cite>${escapeText(block.attribution)}</cite>` : ""}</blockquote>`,
    markdown: (block) => `> ${block.text.replace(/\n/g, "\n> ")}${block.attribution ? `\n>\n> — ${block.attribution}` : ""}`,
  }),
  image: defineBlock<Extract<ContentBlock, { type: "image" }>>({
    plainText: (block) => `[Image: ${block.alt}]`,
    safeHtml: (block) => {
      const sizeAttrs = block.width && block.height ? ` width="${block.width}" height="${block.height}"` : "";
      return `<figure><img src="${escapeAttribute(block.src)}" alt="${escapeAttribute(block.alt)}" loading="lazy"${sizeAttrs}>${block.caption ? `<figcaption>${escapeText(block.caption)}</figcaption>` : ""}</figure>`;
    },
    markdown: (block) => `![${block.alt}](${block.src})${block.caption ? `\n*${block.caption}*` : ""}`,
  }),
  embed: defineBlock<Extract<ContentBlock, { type: "embed" }>>({
    plainText: (block) => `[Embed: ${block.url}]`,
    safeHtml: (block) => {
      const caption = block.caption ? `<figcaption>${escapeText(block.caption)}</figcaption>` : "";
      if (block.embedType === "youtube") {
        const videoId = extractYoutubeId(block.url);
        if (!videoId) return `<figure><p><a href="${escapeAttribute(block.url)}" rel="noopener noreferrer" target="_blank">${escapeText(block.url)}</a></p>${caption}</figure>`;
        return `<figure><div class="embed-responsive"><iframe src="https://www.youtube-nocookie.com/embed/${videoId}" title="YouTube video player" allow="accelerometer; encrypted-media; picture-in-picture" allowfullscreen loading="lazy" referrerpolicy="strict-origin-when-cross-origin"></iframe></div>${caption}</figure>`;
      }
      return `<figure><p><a href="${escapeAttribute(block.url)}" rel="noopener noreferrer" target="_blank">${escapeText(block.url)}</a></p>${caption}</figure>`;
    },
    markdown: (block) => `[${block.embedType}: ${block.url}](${block.url})${block.caption ? `\n*${block.caption}*` : ""}`,
  }),
  code: defineBlock<Extract<ContentBlock, { type: "code" }>>({
    plainText: (block) => block.code,
    safeHtml: (block) => {
      const language = block.language.toLowerCase().replace(/[^a-z0-9_-]/g, "") || "text";
      return `<pre><code class="language-${language}">${escapeHtml(block.code)}</code></pre>`;
    },
    markdown: (block) => {
      const fence = markdownFence(block.code);
      const language = block.language.toLowerCase().replace(/[^a-z0-9_+-]/g, "");
      const filename = block.filename ? `\n<!-- ${block.filename.replace(/-->/g, "--&gt;")} -->` : "";
      return `${fence}${language}${filename}\n${block.code}\n${fence}`;
    },
  }),
  "executable-code": defineBlock<Extract<ContentBlock, { type: "executable-code" }>>({
    plainText: (block) => `${block.code}\n${outputPlainText(block.output)}`,
    safeHtml: (block) => learningBlockHtml({ label: block.dialect ?? block.language, title: "Executable example", code: block.code, output: block.output, metadata: executableMetadata(block) }),
    markdown: (block) => learningBlockMarkdown("Executable example", block.dialect ?? block.language, block.code, block.output, executableMetadata(block)),
  }),
  "formula-example": defineBlock<Extract<ContentBlock, { type: "formula-example" }>>({
    plainText: (block) => `${block.title}\n${block.expression}\n${block.prerequisites.join(" ")}\n${outputPlainText(block.input)}\n${outputPlainText(block.output)}`,
    safeHtml: (block) => learningBlockHtml({ label: block.engine, title: block.title, code: block.expression, input: block.input, output: block.output, metadata: formulaMetadata(block) }),
    markdown: (block) => learningBlockMarkdown(block.title, block.engine, block.expression, block.output, formulaMetadata(block), block.input),
  }),
  "automation-script": defineBlock<Extract<ContentBlock, { type: "automation-script" }>>({
    plainText: (block) => `${block.title}\n${block.code}\n${block.hostRequirements.join(" ")}\n${outputPlainText(block.input)}\n${outputPlainText(block.output)}`,
    safeHtml: (block) => learningBlockHtml({ label: block.platform, title: block.title, code: block.code, input: block.input, output: block.output, metadata: automationMetadata(block) }),
    markdown: (block) => learningBlockMarkdown(block.title, block.platform, block.code, block.output, automationMetadata(block), block.input),
  }),
  // AEO blocks
  summary: defineBlock<Extract<ContentBlock, { type: "summary" }>>({
    plainText: (block) => block.text,
    safeHtml: (block) => `<section class="aeo-summary"><h2>Summary</h2><p>${escapeText(block.text)}</p></section>`,
    markdown: (block) => `## Summary\n\n${block.text}`,
  }),
  "direct-answer": defineBlock<Extract<ContentBlock, { type: "direct-answer" }>>({
    plainText: (block) => block.text,
    safeHtml: (block) => `<section class="aeo-direct-answer"><p>${escapeText(block.text)}</p></section>`,
    markdown: (block) => `> ${block.text.replace(/\n/g, "\n> ")}`,
  }),
  takeaways: defineBlock<Extract<ContentBlock, { type: "takeaways" }>>({
    plainText: (block) => block.items.join(" "),
    safeHtml: (block) => `<section class="aeo-takeaways"><h2>Key Takeaways</h2><ul>${block.items.map((item) => `<li>${escapeText(item)}</li>`).join("")}</ul></section>`,
    markdown: (block) => `## Key Takeaways\n\n${block.items.map((item) => `- ${item}`).join("\n")}`,
  }),
  definition: defineBlock<Extract<ContentBlock, { type: "definition" }>>({
    plainText: (block) => `${block.term}: ${block.text}`,
    safeHtml: (block) => `<section class="aeo-definition"><dl><dt>${escapeText(block.term)}</dt><dd>${escapeText(block.text)}</dd></dl></section>`,
    markdown: (block) => `**${block.term}**: ${block.text}`,
  }),
  steps: defineBlock<Extract<ContentBlock, { type: "steps" }>>({
    plainText: (block) => block.items.map((item) => `${item.step}${item.detail ? ` — ${item.detail}` : ""}`).join(" "),
    safeHtml: (block) => `<section class="aeo-steps">${block.title ? `<h2>${escapeText(block.title)}</h2>` : ""}<ol>${block.items.map((item) => `<li><strong>${escapeText(item.step)}</strong>${item.detail ? `<p>${escapeText(item.detail)}</p>` : ""}</li>`).join("")}</ol></section>`,
    markdown: (block) => `${block.title ? `## ${block.title}\n\n` : ""}${block.items.map((item, i) => `${i + 1}. **${item.step}**${item.detail ? `\n   ${item.detail}` : ""}`).join("\n")}`,
  }),
  faq: defineBlock<Extract<ContentBlock, { type: "faq" }>>({
    plainText: (block) => block.items.map((item) => `${item.question} ${item.answer}`).join(" "),
    safeHtml: (block) => `<section class="aeo-faq">${block.items.map((item) => `<details><summary>${escapeText(item.question)}</summary><p>${escapeText(item.answer)}</p></details>`).join("")}</section>`,
    markdown: (block) => block.items.map((item) => `### ${item.question}\n\n${item.answer}`).join("\n\n"),
  }),
  mistakes: defineBlock<Extract<ContentBlock, { type: "mistakes" }>>({
    plainText: (block) => block.items.join(" "),
    safeHtml: (block) => `<section class="aeo-mistakes">${block.title ? `<h2>${escapeText(block.title)}</h2>` : "<h2>Common Mistakes</h2>"}<ul>${block.items.map((item) => `<li>${escapeText(item)}</li>`).join("")}</ul></section>`,
    markdown: (block) => `## ${block.title || "Common Mistakes"}\n\n${block.items.map((item) => `- ❌ ${item}`).join("\n")}`,
  }),
  limitations: defineBlock<Extract<ContentBlock, { type: "limitations" }>>({
    plainText: (block) => block.items.join(" "),
    safeHtml: (block) => `<section class="aeo-limitations">${block.title ? `<h2>${escapeText(block.title)}</h2>` : "<h2>Limitations</h2>"}<ul>${block.items.map((item) => `<li>${escapeText(item)}</li>`).join("")}</ul></section>`,
    markdown: (block) => `## ${block.title || "Limitations"}\n\n${block.items.map((item) => `- ⚠️ ${item}`).join("\n")}`,
  }),
  // Table block
  table: defineBlock<Extract<ContentBlock, { type: "table" }>>({
    plainText: (block) => [block.headers.join("\t"), ...block.rows.map((row) => row.join("\t"))].join("\n"),
    safeHtml: (block) => {
      const head = `<thead><tr>${block.headers.map((header) => `<th>${escapeText(header)}</th>`).join("")}</tr></thead>`;
      const body = `<tbody>${block.rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeText(cell)}</td>`).join("")}</tr>`).join("")}</tbody>`;
      return `<div class="article-table-wrap"><table class="article-table">${head}${body}</table></div>`;
    },
    markdown: (block) => {
      const escapeCell = (value: string) => value.replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
      const head = `| ${block.headers.map(escapeCell).join(" | ")} |`;
      const divider = `| ${block.headers.map(() => "---").join(" | ")} |`;
      const rows = block.rows.map((row) => `| ${row.map(escapeCell).join(" | ")} |`).join("\n");
      return [head, divider, rows].join("\n");
    },
  }),
  // Bookmark and attachment blocks
  bookmark: defineBlock<Extract<ContentBlock, { type: "bookmark" }>>({
    plainText: (block) => `[Bookmark: ${block.title}](${block.url})`,
    safeHtml: (block) => `<a class="bookmark-card" href="${escapeAttribute(block.url)}" target="_blank" rel="noopener noreferrer">${block.favicon ? `<img src="${escapeAttribute(block.favicon)}" alt="" width="16" height="16" loading="lazy">` : ""}<div><strong>${escapeText(block.title)}</strong>${block.description ? `<span>${escapeText(block.description)}</span>` : ""}</div></a>`,
    markdown: (block) => `[${block.title}](${block.url})${block.description ? `\n> ${block.description}` : ""}`,
  }),
  attachment: defineBlock<Extract<ContentBlock, { type: "attachment" }>>({
    plainText: (block) => `[Attachment: ${block.fileName}](${block.url})`,
    safeHtml: (block) => `<a class="attachment-card" href="${escapeAttribute(block.url)}" target="_blank" rel="noopener noreferrer"><strong>${escapeText(block.fileName)}</strong>${block.fileSize ? `<span>${formatFileSize(block.fileSize)}</span>` : ""}${block.mimeType ? `<span>${escapeText(block.mimeType)}</span>` : ""}</a>`,
    markdown: (block) => `[${block.fileName}](${block.url})${block.fileSize ? ` (${formatFileSize(block.fileSize)})` : ""}`,
  }),
};

export function blockToPlainText(block: ContentBlock) {
  return blockRegistry[block.type].plainText(block);
}

export function blockToSafeHtml(block: ContentBlock) {
  return blockRegistry[block.type].safeHtml(block);
}

export function blockToMarkdown(block: ContentBlock) {
  return blockRegistry[block.type].markdown(block);
}

function outputPlainText(output?: StructuredOutput) {
  if (!output) return "";
  if (output.type !== "table") return output.value;
  return [output.columns.join("\t"), ...output.rows.map((row) => row.map((value) => value === null ? "NULL" : String(value)).join("\t"))].join("\n");
}

function learningBlockHtml(input: { label: string; title: string; code: string; input?: StructuredOutput; output?: StructuredOutput; metadata?: string[] }) {
  const metadata = input.metadata?.length ? `<ul>${input.metadata.map((item) => `<li>${escapeText(item)}</li>`).join("")}</ul>` : "";
  const structuredInput = input.input ? `<h4>Input</h4>${outputSafeHtml(input.input)}` : "";
  return `<section class="learning-example"><header><span>${escapeText(input.label)}</span><strong>${escapeText(input.title)}</strong></header><pre><code>${escapeHtml(input.code)}</code></pre>${metadata}${structuredInput}${outputSafeHtml(input.output)}</section>`;
}

function learningBlockMarkdown(title: string, language: string, code: string, output?: StructuredOutput, metadata: string[] = [], input?: StructuredOutput) {
  const fence = markdownFence(code);
  const safeLanguage = language.replace(/[^a-z0-9_+-]/g, "");
  const details = metadata.length ? `\n\n${metadata.map((item) => `- ${item}`).join("\n")}` : "";
  const structuredInput = input ? `\n\n**Input (${input.type})**\n\n${outputMarkdown(input)}` : "";
  const savedOutput = output ? `\n\n**Saved output (${output.type})**\n\n${outputMarkdown(output)}` : "";
  return `**${title}** · \`${language}\`${details}\n\n${fence}${safeLanguage}\n${code}\n${fence}${structuredInput}${savedOutput}`;
}

function executableMetadata(block: Extract<ContentBlock, { type: "executable-code" }>) {
  return [block.datasetId && `Dataset: ${block.datasetId}`, block.datasetVersion && `Dataset version: ${block.datasetVersion}`, block.datasetChecksum && `Dataset checksum: ${block.datasetChecksum}`, block.runtimeVersion && `Runtime: ${block.runtimeVersion}`, block.executedAt && `Executed: ${block.executedAt}`].filter(Boolean) as string[];
}

function formulaMetadata(block: Extract<ContentBlock, { type: "formula-example" }>) {
  return [block.artifactType && `Artifact: ${block.artifactType}`, block.locale && `Locale: ${block.locale}`, ...block.compatibility.map((item) => `Compatibility: ${item}`), ...block.prerequisites.map((item) => `Prerequisite: ${item}`), block.verifiedAt && `Verified: ${block.verifiedAt}`].filter(Boolean) as string[];
}

function automationMetadata(block: Extract<ContentBlock, { type: "automation-script" }>) {
  return [block.entryPoint && `Entry point: ${block.entryPoint}`, ...block.hostRequirements.map((item) => `Host: ${item}`), ...(block.permissions ?? []).map((item) => `Permission: ${item}`), ...(block.triggers ?? []).map((item) => `Trigger: ${item}`), block.verifiedAt && `Verified: ${block.verifiedAt}`].filter(Boolean) as string[];
}

function outputSafeHtml(output?: StructuredOutput) {
  if (!output) return "";
  if (output.type !== "table") return `<div class="example-output ${output.type}"><pre>${escapeHtml(output.value)}</pre></div>`;
  const head = `<thead><tr>${output.columns.map((column) => `<th>${escapeText(column)}</th>`).join("")}</tr></thead>`;
  const body = `<tbody>${output.rows.map((row) => `<tr>${row.map((value) => `<td>${escapeText(value === null ? "NULL" : String(value))}</td>`).join("")}</tr>`).join("")}</tbody>`;
  return `<div class="example-output table"><table>${head}${body}</table>${output.truncated ? "<p>Result truncated</p>" : ""}</div>`;
}

function outputMarkdown(output: StructuredOutput) {
  if (output.type !== "table") return `\`\`\`text\n${output.value}\n\`\`\``;
  const escapeCell = (value: string | number | boolean | null) => String(value ?? "NULL").replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
  const head = `| ${output.columns.map(escapeCell).join(" | ")} |`;
  const divider = `| ${output.columns.map(() => "---").join(" | ")} |`;
  const rows = output.rows.map((row) => `| ${row.map(escapeCell).join(" | ")} |`).join("\n");
  return [head, divider, rows, output.truncated ? "\n_Result truncated_" : ""].filter(Boolean).join("\n");
}

function markdownFence(code: string) {
  const longest = Math.max(0, ...Array.from(code.matchAll(/`+/g), (match) => match[0].length));
  return "`".repeat(Math.max(3, longest + 1));
}

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function escapeText(value: string) {
  return escapeHtml(value).replace(/\r?\n/g, "<br>");
}

function escapeAttribute(value: string) {
  return escapeHtml(value).replace(/\s+/g, "-");
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
