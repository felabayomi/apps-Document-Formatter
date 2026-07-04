import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
} from "docx";

const FONT = "Times New Roman";
const SIZE = 24; // 12pt in half-points
const DOUBLE = { line: 480, lineRule: "auto" as const };
const INDENT_FIRST = { firstLine: 720 }; // 0.5 inch
const MARGINS = { top: 1440, bottom: 1440, left: 1440, right: 1440 };

function centered(text: string, opts: { bold?: boolean; size?: number; pageBreak?: boolean } = {}): Paragraph {
  return new Paragraph({
    pageBreakBefore: opts.pageBreak,
    alignment: AlignmentType.CENTER,
    spacing: DOUBLE,
    children: [
      new TextRun({
        text,
        font: FONT,
        size: opts.size ?? SIZE,
        bold: opts.bold,
      }),
    ],
  });
}

function body(text: string, indent = true): Paragraph {
  return new Paragraph({
    spacing: DOUBLE,
    indent: indent ? INDENT_FIRST : undefined,
    children: [new TextRun({ text, font: FONT, size: SIZE })],
  });
}

function sectionHeading(text: string, pageBreak = false): Paragraph {
  return new Paragraph({
    pageBreakBefore: pageBreak,
    alignment: AlignmentType.CENTER,
    spacing: DOUBLE,
    children: [new TextRun({ text: text.toUpperCase(), font: FONT, size: SIZE, bold: true })],
  });
}

function level1(text: string): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: DOUBLE,
    children: [new TextRun({ text, font: FONT, size: SIZE, bold: true })],
  });
}

function level2(text: string): Paragraph {
  return new Paragraph({
    spacing: DOUBLE,
    children: [new TextRun({ text, font: FONT, size: SIZE, bold: true })],
  });
}

function blank(pageBreak = false): Paragraph {
  return new Paragraph({ pageBreakBefore: pageBreak, children: [] });
}

// ── Content section detection ────────────────────────────────────────────────

interface DissertationSections {
  abstract?: string;
  acknowledgements?: string;
  chapters: { title: string; body: string }[];
  references?: string;
  appendices: { label: string; body: string }[];
}

const CHAPTER_RE = /^(CHAPTER\s+(?:I{1,3}V?|VI{0,3}|[1-9]|ONE|TWO|THREE|FOUR|FIVE)[:\s–-]*.*)/im;
const ABSTRACT_RE = /^ABSTRACT\s*$/im;
const ACK_RE = /^ACKNOWLEDG/im;
const REF_RE = /^REFERENCES?\s*$/im;
const APPENDIX_RE = /^APPENDIX[:\s]?(.*)/im;

function detectSections(rawText: string): DissertationSections {
  const lines = rawText.replace(/\r\n/g, "\n").split("\n");

  // Find line indices for major section markers
  const markers: { idx: number; type: string; label: string }[] = [];

  lines.forEach((line, i) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    if (ABSTRACT_RE.test(trimmed)) {
      markers.push({ idx: i, type: "abstract", label: "ABSTRACT" });
    } else if (ACK_RE.test(trimmed)) {
      markers.push({ idx: i, type: "acknowledgements", label: trimmed });
    } else if (CHAPTER_RE.test(trimmed)) {
      markers.push({ idx: i, type: "chapter", label: trimmed });
    } else if (REF_RE.test(trimmed)) {
      markers.push({ idx: i, type: "references", label: "References" });
    } else if (APPENDIX_RE.test(trimmed)) {
      markers.push({ idx: i, type: "appendix", label: trimmed });
    }
  });

  function extractBetween(start: number, end: number): string {
    return lines
      .slice(start + 1, end === -1 ? undefined : end)
      .join("\n")
      .trim();
  }

  const result: DissertationSections = { chapters: [], appendices: [] };

  for (let m = 0; m < markers.length; m++) {
    const cur = markers[m];
    const nextIdx = m + 1 < markers.length ? markers[m + 1].idx : -1;
    const sectionText = extractBetween(cur.idx, nextIdx);

    if (cur.type === "abstract") result.abstract = sectionText;
    else if (cur.type === "acknowledgements") result.acknowledgements = sectionText;
    else if (cur.type === "chapter") {
      result.chapters.push({ title: cur.label, body: sectionText });
    } else if (cur.type === "references") result.references = sectionText;
    else if (cur.type === "appendix") {
      result.appendices.push({ label: cur.label, body: sectionText });
    }
  }

  // If no chapters detected, treat everything as intro content
  if (result.chapters.length === 0) {
    result.chapters.push({ title: "CHAPTER I: INTRODUCTION", body: rawText.trim() });
  }

  return result;
}

function buildChapterParagraphs(text: string): Paragraph[] {
  if (!text.trim()) return [body("", false)];
  const paras: Paragraph[] = [];
  const blocks = text.split(/\n\n+/).map((b) => b.replace(/\n/g, " ").trim()).filter(Boolean);

  for (const block of blocks) {
    // Detect APA-style headings heuristically
    if (/^[A-Z][A-Za-z\s]{2,60}$/.test(block) && block.length < 80) {
      paras.push(level1(block));
    } else {
      paras.push(body(block));
    }
  }
  return paras;
}

function buildReferenceParagraphs(text: string): Paragraph[] {
  if (!text.trim()) return [];
  const entries = text.split(/\n\n+/).map((b) => b.replace(/\n/g, " ").trim()).filter(Boolean);
  return entries.map(
    (entry) =>
      new Paragraph({
        spacing: { line: 240, lineRule: "auto" as const, after: 240 },
        indent: { hanging: 720 },
        children: [new TextRun({ text: entry, font: FONT, size: SIZE })],
      })
  );
}

// ── Main builder ─────────────────────────────────────────────────────────────

export async function buildDissertationDocx(opts: {
  text: string;
  title?: string;
  author?: string;
  date?: string;
}): Promise<Buffer> {
  const title = (opts.title || "TITLE OF THE DISSERTATION").toUpperCase();
  const author = opts.author || "Student Legal Name";
  const date = opts.date || "Month Year";
  const year = new Date().getFullYear().toString();

  const sections = detectSections(opts.text);

  const children: Paragraph[] = [];

  // ── Title Page ────────────────────────────────────────────────────────────
  children.push(blank());
  children.push(blank());
  children.push(blank());
  children.push(centered(title, { bold: true }));
  children.push(blank());
  children.push(blank());
  children.push(blank());
  children.push(centered("A Dissertation"));
  children.push(blank());
  children.push(blank());
  children.push(blank());
  children.push(centered("Presented to the Faculty of"));
  children.push(blank());
  children.push(centered("Antioch University"));
  children.push(blank());
  children.push(blank());
  children.push(blank());
  children.push(centered("In partial fulfillment for the degree of"));
  children.push(blank());
  children.push(centered("DOCTOR OF EDUCATION", { bold: true }));
  children.push(blank());
  children.push(centered("by"));
  children.push(blank());
  children.push(blank());
  children.push(centered(author));
  children.push(blank());
  children.push(blank());
  children.push(blank());
  children.push(centered(date));

  // ── Approval Page ─────────────────────────────────────────────────────────
  children.push(centered(title, { bold: true, pageBreak: true }));
  children.push(blank());
  children.push(body(
    `This dissertation, by ${author}, has been approved by the committee members signed below who recommend that it be accepted by the faculty of Antioch University in partial fulfillment of requirements for the degree of`,
    false
  ));
  children.push(blank());
  children.push(blank());
  children.push(centered("DOCTOR OF EDUCATION", { bold: true }));
  children.push(blank());
  children.push(blank());
  children.push(centered("Dissertation Committee:"));
  children.push(blank());
  children.push(blank());
  children.push(new Paragraph({ spacing: DOUBLE, children: [new TextRun({ text: "Chairperson Name, Degree, Chairperson", font: FONT, size: SIZE })] }));
  children.push(blank());
  children.push(blank());
  children.push(new Paragraph({ spacing: DOUBLE, children: [new TextRun({ text: "Committee Member Name, Degree", font: FONT, size: SIZE })] }));
  children.push(blank());
  children.push(blank());
  children.push(new Paragraph({ spacing: DOUBLE, children: [new TextRun({ text: "Committee Member Name, Degree", font: FONT, size: SIZE })] }));

  // ── Copyright Page ────────────────────────────────────────────────────────
  children.push(blank(true));
  children.push(blank());
  children.push(blank());
  children.push(blank());
  children.push(blank());
  children.push(blank());
  children.push(blank());
  children.push(blank());
  children.push(blank());
  children.push(centered(`Copyright ©  ${year}  by ${author}`));
  children.push(centered("All Rights Reserved"));

  // ── Abstract ──────────────────────────────────────────────────────────────
  children.push(sectionHeading("ABSTRACT", true));
  children.push(centered(title));
  children.push(blank());
  children.push(centered(author));
  children.push(centered("Antioch University"));
  children.push(centered("Yellow Springs, OH"));
  children.push(blank());

  if (sections.abstract) {
    const abstractParas = sections.abstract.split(/\n\n+/).map(p => p.replace(/\n/g, " ").trim()).filter(Boolean);
    for (const p of abstractParas) {
      children.push(body(p));
    }
  } else {
    children.push(body("[Add abstract text here. The final sentence should read: This dissertation is available in open access at AURA (https://aura.antioch.edu) and OhioLINK ETD Center (https://etd.ohiolink.edu).]"));
    children.push(blank());
    children.push(body("Keywords: keyword one, keyword two, keyword three", false));
  }

  // ── Acknowledgements ──────────────────────────────────────────────────────
  children.push(sectionHeading("Acknowledgements", true));
  if (sections.acknowledgements) {
    const ackParas = sections.acknowledgements.split(/\n\n+/).map(p => p.replace(/\n/g, " ").trim()).filter(Boolean);
    for (const p of ackParas) children.push(body(p));
  } else {
    children.push(body("[Place acknowledgements text here.]"));
  }

  // ── Table of Contents placeholder ─────────────────────────────────────────
  children.push(sectionHeading("Table of Contents", true));
  children.push(body("[Add automated Table of Contents here using Microsoft Word heading styles.]", false));

  // ── List of Tables ────────────────────────────────────────────────────────
  children.push(sectionHeading("List of Tables", true));
  children.push(body("[Add list of tables here.]", false));

  // ── List of Figures ───────────────────────────────────────────────────────
  children.push(sectionHeading("List of Figures", true));
  children.push(body("[Add list of figures here.]", false));

  // ── Chapters ──────────────────────────────────────────────────────────────
  for (const chapter of sections.chapters) {
    children.push(sectionHeading(chapter.title, true));
    children.push(blank());
    children.push(...buildChapterParagraphs(chapter.body));
  }

  // Default chapter stubs if only generic content was detected
  const defaultChapters = [
    "CHAPTER II: LITERATURE REVIEW",
    "CHAPTER III: METHOD",
    "CHAPTER IV: RESULTS",
    "CHAPTER V: DISCUSSION",
  ];
  if (sections.chapters.length === 1 && sections.chapters[0].title.match(/CHAPTER\s+I/i)) {
    for (const ch of defaultChapters) {
      children.push(sectionHeading(ch, true));
      children.push(blank());
      children.push(body("[Chapter content begins here.]"));
    }
  }

  // ── References ────────────────────────────────────────────────────────────
  children.push(sectionHeading("References", true));
  children.push(blank());
  if (sections.references) {
    children.push(...buildReferenceParagraphs(sections.references));
  } else {
    children.push(new Paragraph({
      spacing: { line: 240, lineRule: "auto" as const, after: 240 },
      indent: { hanging: 720 },
      children: [new TextRun({ text: "[Add references here in APA 7th Edition format, single-spaced with a blank line between entries.]", font: FONT, size: SIZE })],
    }));
  }

  // ── Appendices ────────────────────────────────────────────────────────────
  if (sections.appendices.length > 0) {
    for (const app of sections.appendices) {
      children.push(sectionHeading(app.label, true));
      children.push(blank());
      if (app.body) {
        const appParas = app.body.split(/\n\n+/).map(p => p.replace(/\n/g, " ").trim()).filter(Boolean);
        for (const p of appParas) children.push(body(p));
      }
    }
  } else {
    children.push(sectionHeading("APPENDIX", true));
    children.push(blank());
    children.push(body("[Add appendix content here.]", false));
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: { margin: MARGINS },
        },
        children,
      },
    ],
  });

  return await Packer.toBuffer(doc);
}
