import React from "react";
import { FileText, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

interface DocumentPreviewProps {
  content: string | null;
  isLoading: boolean;
  documentType: string;
}

export function DocumentPreview({ content, isLoading, documentType }: DocumentPreviewProps) {
  if (isLoading) {
    return (
      <div className="w-full h-full min-h-[600px] flex flex-col items-center justify-center text-muted-foreground">
        <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
        <p>Generating preview layout...</p>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="w-full h-full min-h-[600px] flex flex-col items-center justify-center text-muted-foreground p-8 text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
          <FileText className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">No Preview Available</h3>
        <p className="max-w-sm">
          Click "Update Preview" to see how your raw text will be structured before downloading.
        </p>
      </div>
    );
  }

  // Apply some basic styling classes based on document type to make the preview feel authentic
  const getStyleClasses = () => {
    switch (documentType) {
      case "academic":
      case "apa":
      case "mla":
      case "chicago":
        return "font-serif text-justify leading-loose space-y-6 max-w-[800px] mx-auto";
      case "business":
        return "font-sans text-left leading-relaxed space-y-4 max-w-[800px] mx-auto";
      default:
        return "font-sans leading-normal space-y-4 max-w-[800px] mx-auto";
    }
  };

  // Convert raw text with double newlines into paragraphs for the preview
  const paragraphs = content.split(/\n\s*\n/).filter((p) => p.trim() !== "");

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-8 sm:p-12 md:p-16 bg-white min-h-[800px] w-full"
    >
      <div className={getStyleClasses()}>
        {paragraphs.map((paragraph, idx) => (
          <p key={idx} className={documentType === 'academic' || documentType === 'apa' || documentType === 'mla' ? 'indent-8' : ''}>
            {paragraph}
          </p>
        ))}
      </div>
    </motion.div>
  );
}
