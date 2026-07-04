import { Router, type IRouter, type Request, type Response } from "express";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
} from "docx";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { FormatDocxBody, FormatPdfBody, FormatTxtBody } from "@workspace/api-zod";
import { formatAsPlainText, splitIntoParagraphs, type DocumentType } from "../lib/formatter.js";
import { buildDissertationDocx } from "../lib/dissertation.js";

const router: IRouter = Router();

type FontFamily = "Times New Roman" | "Arial" | "Georgia" | "Courier New";
type LineSpacing = "single" | "1.5" | "double";

function getDocxSpacing(lineSpacing: LineSpacing) {
  const map = { single: 240, "1.5": 360, double: 480 };
  return { line: map[lineSpacing], lineRule: "auto" as const };
}

// pdf-lib only ships standard PDF fonts; map to closest available
function getPdfFonts(pdfDoc: PDFDocument, fontFamily: FontFamily) {
  if (fontFamily === "Courier New") {
    return {
      regular: pdfDoc.embedFont(StandardFonts.Courier),
      bold: pdfDoc.embedFont(StandardFonts.CourierBold),
    };
  }
  if (fontFamily === "Arial") {
    return {
      regular: pdfDoc.embedFont(StandardFonts.Helvetica),
      bold: pdfDoc.embedFont(StandardFonts.HelveticaBold),
    };
  }
  // Times New Roman and Georgia both map to Times Roman
  return {
    regular: pdfDoc.embedFont(StandardFonts.TimesRoman),
    bold: pdfDoc.embedFont(StandardFonts.TimesRomanBold),
  };
}

function buildDocxDocument(
  paragraphs: string[],
  documentType: DocumentType,
  title?: string,
  author?: string,
  date?: string,
  fontFamily: FontFamily = "Times New Roman",
  fontSizePt: number = 12,
  lineSpacing: LineSpacing = "double"
): Document {
  const today = date || new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const children: Paragraph[] = [];
  const font = fontFamily;
  const fontSize = fontSizePt * 2; // docx uses half-points
  const spacing = getDocxSpacing(lineSpacing);

  if (documentType === "apa" || documentType === "academic") {
    if (title) {
      children.push(new Paragraph({
        children: [new TextRun({ text: title, bold: false, font, size: fontSize })],
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing,
      }));
    }
    if (author) {
      children.push(new Paragraph({
        children: [new TextRun({ text: author, font, size: fontSize })],
        alignment: AlignmentType.CENTER,
        spacing,
      }));
    }
    children.push(new Paragraph({
      children: [new TextRun({ text: today, font, size: fontSize })],
      alignment: AlignmentType.CENTER,
      spacing,
    }));
    children.push(new Paragraph({ children: [] }));
  } else if (documentType === "mla") {
    if (author) {
      children.push(new Paragraph({ children: [new TextRun({ text: author, font, size: fontSize })], spacing }));
    }
    children.push(new Paragraph({ children: [new TextRun({ text: "Professor [Name]", font, size: fontSize })], spacing }));
    children.push(new Paragraph({ children: [new TextRun({ text: "[Course Name]", font, size: fontSize })], spacing }));
    children.push(new Paragraph({ children: [new TextRun({ text: today, font, size: fontSize })], spacing }));
    if (title) {
      children.push(new Paragraph({
        children: [new TextRun({ text: title, font, size: fontSize })],
        alignment: AlignmentType.CENTER,
        spacing,
      }));
    }
  } else if (documentType === "chicago") {
    children.push(new Paragraph({ children: [] }));
    children.push(new Paragraph({ children: [] }));
    if (title) {
      children.push(new Paragraph({
        children: [new TextRun({ text: title, font, size: fontSize })],
        alignment: AlignmentType.CENTER,
        spacing,
      }));
    }
    children.push(new Paragraph({ children: [] }));
    if (author) {
      children.push(new Paragraph({
        children: [new TextRun({ text: author, font, size: fontSize })],
        alignment: AlignmentType.CENTER,
        spacing,
      }));
    }
    children.push(new Paragraph({
      children: [new TextRun({ text: today, font, size: fontSize })],
      alignment: AlignmentType.CENTER,
      spacing,
    }));
    children.push(new Paragraph({ children: [] }));
  } else if (documentType === "business") {
    if (title) {
      children.push(new Paragraph({
        children: [new TextRun({ text: title, bold: false, font, size: fontSize + 4 })],
        alignment: AlignmentType.CENTER,
        spacing,
      }));
    }
    if (author) {
      children.push(new Paragraph({
        children: [new TextRun({ text: `Prepared by: ${author}`, font, size: fontSize })],
        alignment: AlignmentType.CENTER,
        spacing,
      }));
    }
    children.push(new Paragraph({
      children: [new TextRun({ text: today, font, size: fontSize })],
      alignment: AlignmentType.CENTER,
      spacing,
    }));
    children.push(new Paragraph({ children: [] }));
  } else {
    if (title) {
      children.push(new Paragraph({
        children: [new TextRun({ text: title, font, size: fontSize })],
        alignment: AlignmentType.CENTER,
        spacing,
      }));
    }
    if (author) {
      children.push(new Paragraph({ children: [new TextRun({ text: author, font, size: fontSize })], spacing }));
    }
    if (title || author) children.push(new Paragraph({ children: [] }));
  }

  for (const para of paragraphs) {
    children.push(new Paragraph({
      children: [new TextRun({ text: para, font, size: fontSize })],
      spacing,
      indent: { firstLine: 720 },
    }));
  }

  return new Document({
    sections: [{
      properties: {
        page: { margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } },
      },
      children,
    }],
  });
}

async function buildPdfDocument(
  paragraphs: string[],
  documentType: DocumentType,
  title?: string,
  author?: string,
  date?: string,
  fontFamily: FontFamily = "Times New Roman",
  fontSizePt: number = 12,
  lineSpacing: LineSpacing = "double"
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();

  const spacingMultiplier = lineSpacing === "single" ? 1.2 : lineSpacing === "1.5" ? 1.8 : 2.4;

  const { regular: regularPromise, bold: boldPromise } = getPdfFonts(pdfDoc, fontFamily);
  const [regularFont, boldFont] = await Promise.all([regularPromise, boldPromise]);

  const today = date || new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  const MARGIN = 72;
  const FONT_SIZE = fontSizePt;
  const LINE_HEIGHT = FONT_SIZE * spacingMultiplier;
  const INDENT = 36;

  let page = pdfDoc.addPage([612, 792]);
  const { width, height } = page.getSize();
  const usableWidth = width - MARGIN * 2;

  let y = height - MARGIN;

  function ensureSpace(needed: number) {
    if (y - needed < MARGIN) {
      page = pdfDoc.addPage([612, 792]);
      y = height - MARGIN;
    }
  }

  function drawText(
    text: string,
    x: number,
    opts: { bold?: boolean; size?: number; center?: boolean; maxWidth?: number }
  ) {
    const font = opts.bold ? boldFont : regularFont;
    const size = opts.size ?? FONT_SIZE;
    const maxWidth = opts.maxWidth ?? usableWidth;

    if (opts.center) {
      const textWidth = font.widthOfTextAtSize(text, size);
      x = MARGIN + (usableWidth - textWidth) / 2;
    }

    ensureSpace(size + LINE_HEIGHT);
    page.drawText(text, { x, y: y - size, size, font, color: rgb(0, 0, 0), maxWidth });
    y -= LINE_HEIGHT;
  }

  function drawWrappedParagraph(text: string, indent: number = 0) {
    const words = text.split(" ");
    let currentLine = "";
    const lines: string[] = [];
    const effectiveWidth = usableWidth - indent;

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = regularFont.widthOfTextAtSize(testLine, FONT_SIZE);
      if (testWidth > effectiveWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);

    for (let i = 0; i < lines.length; i++) {
      const x = i === 0 ? MARGIN + indent : MARGIN;
      ensureSpace(FONT_SIZE + 4);
      page.drawText(lines[i], { x, y: y - FONT_SIZE, size: FONT_SIZE, font: regularFont, color: rgb(0, 0, 0) });
      y -= LINE_HEIGHT;
    }
    y -= FONT_SIZE;
  }

  if (documentType === "apa" || documentType === "academic") {
    if (title) drawText(title, MARGIN, { center: true, bold: true });
    if (author) drawText(author, MARGIN, { center: true });
    drawText(today, MARGIN, { center: true });
    y -= LINE_HEIGHT;
  } else if (documentType === "mla") {
    if (author) drawText(author, MARGIN, {});
    drawText("Professor [Name]", MARGIN, {});
    drawText("[Course Name]", MARGIN, {});
    drawText(today, MARGIN, {});
    if (title) drawText(title, MARGIN, { center: true });
    y -= FONT_SIZE;
  } else if (documentType === "chicago") {
    y -= LINE_HEIGHT * 4;
    if (title) drawText(title, MARGIN, { center: true, bold: true });
    y -= LINE_HEIGHT;
    if (author) drawText(author, MARGIN, { center: true });
    drawText(today, MARGIN, { center: true });
    y -= LINE_HEIGHT * 2;
  } else if (documentType === "business") {
    if (title) drawText(title, MARGIN, { center: true, bold: true, size: FONT_SIZE + 4 });
    if (author) drawText(`Prepared by: ${author}`, MARGIN, { center: true });
    drawText(today, MARGIN, { center: true });
    y -= LINE_HEIGHT;
  } else {
    if (title) drawText(title, MARGIN, { center: true });
    if (author) drawText(author, MARGIN, {});
    if (title || author) y -= LINE_HEIGHT;
  }

  for (const para of paragraphs) {
    drawWrappedParagraph(para, INDENT);
  }

  return await pdfDoc.save();
}

router.post("/docx", async (req: Request, res: Response) => {
  const parsed = FormatDocxBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "validation_error", message: parsed.error.message });
    return;
  }

  const { text, documentType, title, author, date, fontFamily, fontSize, lineSpacing } = parsed.data;

  const filename = title
    ? `${title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.docx`
    : `formatted_document.docx`;

  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

  if (documentType === "edd_dissertation") {
    const buffer = await buildDissertationDocx({ text, title, author, date });
    res.send(buffer);
    return;
  }

  const paragraphs = splitIntoParagraphs(text);
  const doc = buildDocxDocument(
    paragraphs,
    documentType as DocumentType,
    title,
    author,
    date,
    fontFamily as FontFamily,
    fontSize,
    lineSpacing as LineSpacing
  );

  const buffer = await Packer.toBuffer(doc);
  res.send(buffer);
});

router.post("/pdf", async (req: Request, res: Response) => {
  const parsed = FormatPdfBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "validation_error", message: parsed.error.message });
    return;
  }

  const { text, documentType, title, author, date, fontFamily, fontSize, lineSpacing } = parsed.data;
  const paragraphs = splitIntoParagraphs(text);

  const pdfBytes = await buildPdfDocument(
    paragraphs,
    documentType as DocumentType,
    title,
    author,
    date,
    fontFamily as FontFamily,
    fontSize,
    lineSpacing as LineSpacing
  );

  const filename = title
    ? `${title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.pdf`
    : `formatted_document.pdf`;

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(Buffer.from(pdfBytes));
});

router.post("/txt", (req: Request, res: Response) => {
  const parsed = FormatTxtBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "validation_error", message: parsed.error.message });
    return;
  }

  const { text, documentType, title, author, date } = parsed.data;
  const formattedText = formatAsPlainText({
    text,
    documentType: documentType as DocumentType,
    title,
    author,
    date,
  });

  res.json({ formattedText, documentType });
});

export default router;
