export type DocumentType =
  | "academic"
  | "business"
  | "apa"
  | "mla"
  | "chicago"
  | "general"
  | "edd_dissertation"
  | "professional_resume";

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

export type ResumeBlock =
  | { kind: "heading"; text: string }
  | { kind: "bullet"; text: string }
  | { kind: "text"; text: string };

const RESUME_SECTION_HEADINGS = new Set([
  "contact information",
  "profile",
  "professional summary",
  "summary",
  "career objective",
  "objective",
  "career highlights",
  "key achievements",
  "selected achievements",
  "core competencies",
  "work experience",
  "professional experience",
  "work history",
  "experience",
  "employment history",
  "education",
  "skills",
  "technical skills",
  "certifications",
  "licenses",
  "projects",
  "volunteer experience",
  "professional development",
  "additional information",
  "awards",
  "honors",
  "publications",
  "languages",
  "leadership",
  "references",
]);

export function splitIntoResumeBlocks(text: string): ResumeBlock[] {
  return text
    .split(/\r?\n/)
    .map((rawLine) => {
      const trimmedLine = rawLine.trim();
      if (!trimmedLine) return null;

      const isMarkdownHeading = /^#{1,6}\s+/.test(trimmedLine);
      const line = trimmedLine
        .replace(/^#{1,6}\s+/, "")
        .replace(/\*\*(.*?)\*\*/g, "$1")
        .replace(/\*(.*?)\*/g, "$1")
        .replace(/__(.*?)__/g, "$1")
        .replace(/_(.*?)_/g, "$1")
        .replace(/`{1,3}(.*?)`{1,3}/g, "$1")
        .trim();

      if (isMarkdownHeading || RESUME_SECTION_HEADINGS.has(line.toLowerCase().replace(/:$/, ""))) {
        return { kind: "heading", text: line.replace(/:$/, "") } satisfies ResumeBlock;
      }

      const bullet = line.match(/^(?:[-*+•▪]\s+|\d+[.)]\s+)/);
      if (bullet) {
        return { kind: "bullet", text: line.slice(bullet[0].length).trim() } satisfies ResumeBlock;
      }

      return { kind: "text", text: line } satisfies ResumeBlock;
    })
    .filter((block): block is ResumeBlock => block !== null && block.text.length > 0);
}

export function formatAsPlainText(opts: FormatOptions): string {
  if (opts.documentType === "professional_resume") {
    const lines: string[] = [];
    if (opts.author) lines.push(opts.author.toUpperCase());
    if (opts.author && opts.title) lines.push("");
    if (opts.title) lines.push(opts.title);
    if (lines.length > 0) lines.push("");

    for (const block of splitIntoResumeBlocks(opts.text)) {
      if (block.kind === "heading") {
        if (lines.length > 0 && lines[lines.length - 1] !== "") lines.push("");
        lines.push(block.text.toUpperCase());
        lines.push("");
      } else if (block.kind === "bullet") {
        lines.push(`- ${block.text}`);
      } else {
        lines.push(block.text);
      }
    }

    return lines.join("\n").trim();
  }

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
