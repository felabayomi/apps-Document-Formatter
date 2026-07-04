export type DocumentType = "academic" | "business" | "apa" | "mla" | "chicago" | "general" | "edd_dissertation";

export interface FormatOptions {
  text: string;
  documentType: DocumentType;
  title?: string;
  author?: string;
  date?: string;
}

function stripFormatting(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/_(.*?)_/g, "$1")
    .replace(/#{1,6}\s+/g, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/`{1,3}(.*?)`{1,3}/gs, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function splitIntoParagraphs(text: string): string[] {
  const cleaned = stripFormatting(text);
  return cleaned
    .split(/\n\n+/)
    .map((p) => p.replace(/\n/g, " ").replace(/\s+/g, " ").trim())
    .filter((p) => p.length > 0);
}

export function formatAsPlainText(opts: FormatOptions): string {
  const paragraphs = splitIntoParagraphs(opts.text);
  const lines: string[] = [];

  const today = opts.date || new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  if (opts.documentType === "academic" || opts.documentType === "apa") {
    if (opts.title) lines.push(opts.title.toUpperCase());
    if (opts.author) lines.push(`Author: ${opts.author}`);
    lines.push(today);
    lines.push("");
    lines.push("");
  } else if (opts.documentType === "mla") {
    if (opts.author) lines.push(opts.author);
    lines.push("Professor [Name]");
    lines.push("[Course Name]");
    lines.push(today);
    lines.push("");
    if (opts.title) lines.push(opts.title);
    lines.push("");
  } else if (opts.documentType === "chicago") {
    if (opts.title) lines.push(opts.title);
    lines.push("");
    if (opts.author) lines.push(opts.author);
    lines.push(today);
    lines.push("");
  } else if (opts.documentType === "business") {
    if (opts.title) lines.push(opts.title);
    if (opts.author) lines.push(`Prepared by: ${opts.author}`);
    lines.push(today);
    lines.push("");
    lines.push("─".repeat(60));
    lines.push("");
  } else {
    if (opts.title) lines.push(opts.title);
    if (opts.author) lines.push(opts.author);
    lines.push(today);
    lines.push("");
  }

  for (const para of paragraphs) {
    lines.push(para);
    lines.push("");
  }

  return lines.join("\n");
}

export { splitIntoParagraphs, stripFormatting };
