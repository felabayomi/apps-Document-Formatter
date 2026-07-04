import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useFormatDocx, useFormatPdf, useFormatTxt } from "@workspace/api-client-react";
import type { FormatRequest } from "@/types/format-request";

// Helper to trigger a browser download from a Blob
const downloadBlob = (
  blob: Blob,
  filename: string,
  options?: { openInNewTab?: boolean },
) => {
  if (!(blob instanceof Blob) || blob.size === 0) {
    throw new Error(`The generated file for ${filename} was empty.`);
  }

  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener noreferrer";
  a.style.display = "none";

  if (options?.openInNewTab) {
    a.target = "_blank";
  }

  document.body.appendChild(a);
  a.click();

  window.setTimeout(() => {
    a.remove();
    window.URL.revokeObjectURL(url);
  }, options?.openInNewTab ? 60_000 : 1_500);
};

export function useFormatActions() {
  const { toast } = useToast();
  const [isFormatting, setIsFormatting] = useState(false);

  const docxMutation = useFormatDocx();
  const pdfMutation = useFormatPdf();
  const txtMutation = useFormatTxt();

  const handleFormatDocx = async (data: FormatRequest, filename: string = "Document") => {
    try {
      setIsFormatting(true);
      const blob = await docxMutation.mutateAsync({ data: data as any });
      downloadBlob(blob, `${filename}.docx`);
      toast({
        title: "Success",
        description: "Your Word document has been downloaded.",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Formatting Failed",
        description: "Could not generate DOCX file. Please check your text and try again.",
        variant: "destructive",
      });
    } finally {
      setIsFormatting(false);
    }
  };

  const handleFormatPdf = async (data: FormatRequest, filename: string = "Document") => {
    try {
      setIsFormatting(true);
      const blob = await pdfMutation.mutateAsync({ data: data as any });
      downloadBlob(blob, `${filename}.pdf`);
      toast({
        title: "Success",
        description: "Your PDF has been downloaded.",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Formatting Failed",
        description: "Could not generate PDF file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsFormatting(false);
    }
  };

  const handleFormatTxt = async (data: FormatRequest, filename: string = "Document") => {
    try {
      setIsFormatting(true);
      const response = await txtMutation.mutateAsync({ data: data as any });

      // Convert the string response to a blob for download
      const blob = new Blob([response.formattedText], { type: "text/plain;charset=utf-8" });
      downloadBlob(blob, `${filename}.txt`);

      toast({
        title: "Success",
        description: "Your plain text document has been downloaded.",
      });
      return response.formattedText;
    } catch (error) {
      console.error(error);
      toast({
        title: "Formatting Failed",
        description: "Could not generate Text file. Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsFormatting(false);
    }
  };

  const handleOpenInGoogleDocs = async (
    data: FormatRequest,
    filename: string = "Document"
  ) => {
    try {
      setIsFormatting(true);
      const blob = await docxMutation.mutateAsync({ data: data as any });
      downloadBlob(blob, `${filename}.docx`);
      window.open("https://docs.new", "_blank", "noopener,noreferrer");
      toast({
        title: "Google Docs is ready",
        description: "Your DOCX download has started. Upload it in the new Google Docs tab to continue editing.",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Export Failed",
        description: "Could not prepare the Google Docs export.",
        variant: "destructive",
      });
    } finally {
      setIsFormatting(false);
    }
  };

  const generatePreview = async (data: FormatRequest) => {
    try {
      const response = await txtMutation.mutateAsync({ data: data as any });
      return response.formattedText;
    } catch (error) {
      console.error(error);
      toast({
        title: "Preview Failed",
        description: "Could not generate document preview.",
        variant: "destructive",
      });
      return null;
    }
  };

  return {
    handleFormatDocx,
    handleFormatPdf,
    handleFormatTxt,
    handleOpenInGoogleDocs,
    generatePreview,
    isFormatting,
    isGeneratingPreview: txtMutation.isPending,
  };
}
