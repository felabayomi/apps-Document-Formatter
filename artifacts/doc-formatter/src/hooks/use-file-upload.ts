import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { API_BASE_URL, getStoredToken } from "@/lib/auth";

interface ExtractResult {
  text: string;
  filename: string;
  fileType: string;
}

async function extractPdfText(file: File): Promise<string> {
  const { getDocument, GlobalWorkerOptions } = await import("pdfjs-dist");
  GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${(await import("pdfjs-dist")).version}/build/pdf.worker.min.mjs`;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await getDocument({ data: arrayBuffer }).promise;

  const pages: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");
    pages.push(pageText);
  }

  return pages.join("\n\n");
}

export function useFileUpload(onExtracted: (result: ExtractResult) => void) {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);

  const uploadFile = async (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["docx", "pdf", "txt"].includes(ext ?? "")) {
      toast({
        title: "Unsupported File",
        description: "Please upload a .docx, .pdf, or .txt file.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      if (ext === "pdf") {
        const text = await extractPdfText(file);
        if (!text.trim()) {
          throw new Error("No text found in this PDF. It may be a scanned/image-only document.");
        }
        onExtracted({ text: text.trim(), filename: file.name, fileType: "pdf" });
        toast({
          title: "PDF Loaded",
          description: `"${file.name}" has been loaded. Ready to format.`,
        });
      } else {
        const token = getStoredToken();

        if (!token) {
          throw new Error("Please sign in before uploading a document.");
        }

        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch(`${API_BASE_URL}/api/format/extract`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({ message: "Upload failed." }));
          throw new Error(err.message || "Upload failed.");
        }

        const result: ExtractResult = await response.json();
        onExtracted(result);

        toast({
          title: "File Loaded",
          description: `"${result.filename}" has been loaded. Ready to format.`,
        });
      }
    } catch (err) {
      toast({
        title: "Upload Failed",
        description: err instanceof Error ? err.message : "Could not read the file.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  };

  return { uploadFile, handleFileChange, handleDrop, isUploading };
}
