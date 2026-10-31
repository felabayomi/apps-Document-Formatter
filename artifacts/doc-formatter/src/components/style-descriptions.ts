import { FormatRequestDocumentType } from "@/types/format-request";

export const STYLE_DESCRIPTIONS: Record<FormatRequestDocumentType, { title: string; description: string; icon: string }> = {
  academic: {
    title: "Academic Paper",
    description: "Standard collegiate formatting. Times New Roman 12pt, double spaced, 1-inch margins, with a clean title header.",
    icon: "GraduationCap"
  },
  business: {
    title: "Business Report",
    description: "Crisp, professional layout. Single spaced, left-aligned, clear heading hierarchy and sans-serif fonts for readability.",
    icon: "Briefcase"
  },
  apa: {
    title: "APA 7th Edition",
    description: "Strict adherence to APA guidelines. Title page, abstract structure, running head, and specific citation spacing.",
    icon: "BookOpen"
  },
  mla: {
    title: "MLA 9th Edition",
    description: "Standard MLA formatting. Proper heading block, double spacing, 1/2 inch indentations, and works cited structure.",
    icon: "Library"
  },
  chicago: {
    title: "Chicago 17th Edition",
    description: "Classic Chicago style. Footnote readiness, specific title page layout, and bibliography structural spacing.",
    icon: "Landmark"
  },
  general: {
    title: "General Clean",
    description: "Strips away all messy styling, weird bolds or italics, and returns a clean, highly readable plain document.",
    icon: "FileText"
  },
  edd_dissertation: {
    title: "EdD Dissertation (Antioch APA)",
    description: "Full Antioch University EdD dissertation template. Generates title page, approval page, abstract, chapter structure, references, and appendix in APA 7th Edition format.",
    icon: "GraduationCap"
  },
  professional_resume: {
    title: "Professional Resume",
    description: "A clean, compact resume layout with a prominent name, clear section headings, and readable experience and skills lists.",
    icon: "Briefcase"
  }
};
