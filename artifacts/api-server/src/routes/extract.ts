import { Router, type IRouter, type Request, type Response } from "express";
import multer from "multer";
import mammoth from "mammoth";

const router: IRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = file.originalname.split(".").pop()?.toLowerCase();
    if (["docx", "txt"].includes(ext ?? "")) {
      cb(null, true);
    } else {
      cb(new Error("Please upload a .docx or .txt file. For PDFs, extraction happens in your browser."));
    }
  },
});

router.post("/", upload.single("file"), async (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: "no_file", message: "No file was uploaded." });
    return;
  }

  const { buffer, originalname } = req.file;
  const ext = originalname.split(".").pop()?.toLowerCase() ?? "";

  try {
    let extractedText = "";
    let fileType = ext;

    if (ext === "docx") {
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value.trim();
      fileType = "docx";
    } else if (ext === "txt") {
      extractedText = buffer.toString("utf-8").trim();
      fileType = "txt";
    } else {
      res.status(400).json({
        error: "unsupported_type",
        message: "Unsupported file type. Please upload a .docx or .txt file.",
      });
      return;
    }

    if (!extractedText) {
      res.status(422).json({
        error: "empty_document",
        message: "No text could be extracted from this file. It may be empty.",
      });
      return;
    }

    res.json({ text: extractedText, filename: originalname, fileType });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to extract text from file.";
    res.status(500).json({ error: "extraction_failed", message });
  }
});

export default router;
