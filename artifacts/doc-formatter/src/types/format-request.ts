import type { FormatRequest as ApiFormatRequest } from "@workspace/api-client-react";

export const FormatRequestDocumentType = {
    academic: "academic",
    business: "business",
    apa: "apa",
    mla: "mla",
    chicago: "chicago",
    general: "general",
    edd_dissertation: "edd_dissertation",
    professional_resume: "professional_resume",
} as const;

export type FormatRequestDocumentType =
    (typeof FormatRequestDocumentType)[keyof typeof FormatRequestDocumentType];

export type FontFamily = "Times New Roman" | "Arial" | "Georgia" | "Courier New";
export type FontSize = 10 | 11 | 12 | 14 | 16;
export type LineSpacing = "single" | "1.5" | "double";

export type FormatRequest = Omit<ApiFormatRequest, "documentType"> & {
    documentType: FormatRequestDocumentType;
    fontFamily: FontFamily;
    fontSize: FontSize;
    lineSpacing: LineSpacing;
};
