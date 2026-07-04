import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import {
  FileText, Download, FileType, AlignLeft, Settings2,
  RefreshCcw, BookOpen, GraduationCap, Briefcase, Landmark, Library,
  Upload, X, FileUp, Type, ExternalLink, LogOut
} from "lucide-react";

import { useFormatActions } from "@/hooks/use-format-actions";
import { useFileUpload } from "@/hooks/use-file-upload";
import { FormatRequestDocumentType, type FormatRequest } from "@/types/format-request";
import { STYLE_DESCRIPTIONS } from "@/components/style-descriptions";
import { DocumentPreview } from "@/components/document-preview";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

type FontFamily = NonNullable<FormatRequest["fontFamily"]>;
type LineSpacing = NonNullable<FormatRequest["lineSpacing"]>;

const FONT_FAMILIES: { value: FontFamily; label: string }[] = [
  { value: "Times New Roman", label: "Times New Roman" },
  { value: "Arial", label: "Arial" },
  { value: "Georgia", label: "Georgia" },
  { value: "Courier New", label: "Courier New" },
];

const FONT_SIZES: { value: number; label: string }[] = [
  { value: 10, label: "10pt" },
  { value: 11, label: "11pt" },
  { value: 12, label: "12pt" },
  { value: 14, label: "14pt" },
  { value: 16, label: "16pt" },
];

const LINE_SPACINGS: { value: LineSpacing; label: string }[] = [
  { value: "single", label: "Single" },
  { value: "1.5", label: "1.5 Lines" },
  { value: "double", label: "Double" },
];

const StyleIcon = ({ name, className }: { name: string; className?: string }) => {
  const icons = { GraduationCap, Briefcase, BookOpen, Library, Landmark, FileText };
  const IconComponent = icons[name as keyof typeof icons] || FileText;
  return <IconComponent className={className} />;
};

interface HomeProps {
  currentUser?: {
    name?: string | null;
    email: string;
    role?: string | null;
  };
  onLogout?: () => void;
}

export default function Home({ currentUser, onLogout }: HomeProps) {
  const [activeTab, setActiveTab] = useState("editor");
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedFilename, setUploadedFilename] = useState<string | null>(null);

  const [text, setText] = useState("");
  const [documentType, setDocumentType] = useState<FormatRequestDocumentType>(FormatRequestDocumentType.general);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [date, setDate] = useState(format(new Date(), "MMMM d, yyyy"));
  const [fontFamily, setFontFamily] = useState<FontFamily>("Times New Roman");
  const [fontSize, setFontSize] = useState<number>(12);
  const [lineSpacing, setLineSpacing] = useState<LineSpacing>("double");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    handleFormatDocx, handleFormatPdf, handleFormatTxt, handleOpenInGoogleDocs,
    generatePreview, isFormatting, isGeneratingPreview
  } = useFormatActions();

  const { handleFileChange, handleDrop, isUploading } = useFileUpload((result) => {
    setText(result.text);
    setUploadedFilename(result.filename);
    setPreviewContent(null);
    setActiveTab("editor");
  });

  const getFormData = (): FormatRequest => ({
    text,
    documentType,
    title: title.trim() || undefined,
    author: author.trim() || undefined,
    date: date.trim() || undefined,
    fontFamily,
    fontSize: fontSize as FormatRequest["fontSize"],
    lineSpacing,
  });

  const onGeneratePreview = async () => {
    if (!text.trim()) return;
    const content = await generatePreview(getFormData());
    if (content) setPreviewContent(content);
  };

  const handleTabChange = (val: string) => {
    setActiveTab(val);
    if (val === "preview" && text.trim() && !previewContent) {
      onGeneratePreview();
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => setIsDragOver(false);

  const handleDropWrapper = (e: React.DragEvent<HTMLDivElement>) => {
    setIsDragOver(false);
    handleDrop(e);
  };

  const selectedStyleInfo = STYLE_DESCRIPTIONS[documentType];

  return (
    <div className="min-h-screen bg-background font-sans selection:bg-primary/20">
      <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b border-border/50 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white shadow-lg shadow-primary/20">
              <AlignLeft className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-xl tracking-tight text-foreground leading-none">Felix Platform Formatter</h1>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Secure document engine for approved users</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-3">
            {currentUser ? (
              <div className="text-right mr-2">
                <p className="text-sm font-semibold text-foreground leading-none">
                  {currentUser.name || currentUser.email}
                </p>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground mt-1">
                  {currentUser.role || "authenticated user"}
                </p>
              </div>
            ) : null}
            {onLogout ? (
              <Button variant="ghost" size="sm" onClick={onLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign out
              </Button>
            ) : null}
            <Button variant="outline" size="sm" onClick={() => { setText(""); setUploadedFilename(null); setPreviewContent(null); }} disabled={!text}>
              Clear Workspace
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">

          {/* Main Editor Area */}
          <div className="lg:col-span-8 flex flex-col gap-4">

            {/* File Upload Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDropWrapper}
              onClick={() => !isUploading && fileInputRef.current?.click()}
              className={`
                relative cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-200 p-5
                flex items-center gap-4
                ${isDragOver
                  ? "border-primary bg-primary/5 scale-[1.01]"
                  : "border-slate-200 bg-slate-50/50 hover:border-primary/40 hover:bg-primary/3"
                }
                ${isUploading ? "pointer-events-none opacity-70" : ""}
              `}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".docx,.pdf,.txt"
                className="hidden"
                onChange={handleFileChange}
              />
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${isDragOver ? "bg-primary/10" : "bg-white border border-slate-200"}`}>
                {isUploading
                  ? <RefreshCcw className="w-5 h-5 text-primary animate-spin" />
                  : <FileUp className="w-5 h-5 text-primary" />
                }
              </div>
              <div className="flex-1 min-w-0">
                {uploadedFilename ? (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm text-foreground truncate">{uploadedFilename}</span>
                    <Badge variant="secondary" className="text-xs shrink-0">Loaded</Badge>
                    <button
                      className="ml-auto text-muted-foreground hover:text-destructive transition-colors p-1 rounded"
                      onClick={(e) => { e.stopPropagation(); setUploadedFilename(null); setText(""); }}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <p className="font-medium text-sm text-foreground">
                      {isUploading ? "Reading your document…" : "Upload a document to format"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Drag & drop or click — supports .docx, .pdf, .txt (max 20 MB)
                    </p>
                  </div>
                )}
              </div>
              {!uploadedFilename && !isUploading && (
                <Button size="sm" variant="outline" className="shrink-0" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                  <Upload className="w-3.5 h-3.5 mr-1.5" />
                  Browse
                </Button>
              )}
            </div>

            {/* Editor Tabs */}
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <TabsList className="bg-white border shadow-sm p-1 rounded-xl">
                  <TabsTrigger value="editor" className="rounded-lg px-6 data-[state=active]:bg-slate-100 data-[state=active]:text-primary data-[state=active]:shadow-none transition-all">
                    {uploadedFilename ? "Extracted Text" : "Raw Input"}
                  </TabsTrigger>
                  <TabsTrigger value="preview" className="rounded-lg px-6 data-[state=active]:bg-slate-100 data-[state=active]:text-primary data-[state=active]:shadow-none transition-all">
                    Layout Preview
                  </TabsTrigger>
                </TabsList>

                <AnimatePresence>
                  {activeTab === "preview" && (
                    <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={onGeneratePreview}
                        disabled={!text.trim() || isGeneratingPreview}
                        className="rounded-full shadow-sm"
                      >
                        <RefreshCcw className={`w-4 h-4 mr-2 ${isGeneratingPreview ? "animate-spin" : ""}`} />
                        Update Preview
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex-1 bg-transparent">
                <TabsContent value="editor" className="m-0 h-full flex flex-col focus-visible:outline-none focus-visible:ring-0">
                  <div className="document-page flex-1 flex flex-col overflow-hidden relative group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
                    <Textarea
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder={uploadedFilename ? "Document text will appear here after upload…" : "Paste your messy, unformatted text here, or upload a file above…"}
                      className="document-textarea border-none shadow-none focus-visible:ring-0 min-h-[400px]"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="preview" className="m-0 h-full focus-visible:outline-none focus-visible:ring-0">
                  <div className="document-page flex-1 overflow-hidden">
                    <DocumentPreview
                      content={previewContent}
                      isLoading={isGeneratingPreview}
                      documentType={documentType}
                    />
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </div>

          {/* Settings & Export Sidebar */}
          <div className="lg:col-span-4 flex flex-col gap-6">

            <Card className="shadow-lg shadow-slate-200/40 border-slate-200/60 overflow-hidden">
              <div className="h-1 w-full bg-gradient-to-r from-slate-200 to-slate-300" />
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Settings2 className="w-5 h-5 text-primary" />
                  Document Settings
                </CardTitle>
                <CardDescription>Configure how your output will be structured.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">

                {/* Formatting Style */}
                <div className="space-y-3">
                  <Label htmlFor="style" className="text-sm font-semibold text-slate-700">Formatting Style</Label>
                  <Select value={documentType} onValueChange={(v) => setDocumentType(v as FormatRequestDocumentType)}>
                    <SelectTrigger id="style" className="w-full h-12 bg-slate-50/50 border-slate-200 hover:border-primary/50 transition-colors focus:ring-primary/20">
                      <SelectValue placeholder="Select a format style" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(STYLE_DESCRIPTIONS).map(([key, info]) => (
                        <SelectItem key={key} value={key} className="py-3 cursor-pointer">
                          <div className="flex items-center gap-3">
                            <StyleIcon name={info.icon} className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium">{info.title}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={documentType}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-sm text-slate-500 bg-slate-50 p-4 rounded-xl border border-slate-100/50"
                    >
                      <p className="leading-relaxed">{selectedStyleInfo.description}</p>
                    </motion.div>
                  </AnimatePresence>
                </div>

                <Separator className="bg-slate-100" />

                {/* Typography */}
                <div className="space-y-4">
                  <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <Type className="w-4 h-4 text-primary" />
                    Typography
                  </Label>

                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Font Family</Label>
                    <Select value={fontFamily} onValueChange={(v) => setFontFamily(v as FontFamily)}>
                      <SelectTrigger className="w-full bg-slate-50/50 border-slate-200 hover:border-primary/50 transition-colors">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FONT_FAMILIES.map((f) => (
                          <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Font Size</Label>
                      <Select value={String(fontSize)} onValueChange={(v) => setFontSize(Number(v))}>
                        <SelectTrigger className="bg-slate-50/50 border-slate-200 hover:border-primary/50 transition-colors">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FONT_SIZES.map((s) => (
                            <SelectItem key={s.value} value={String(s.value)}>{s.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Line Spacing</Label>
                      <Select value={lineSpacing} onValueChange={(v) => setLineSpacing(v as LineSpacing)}>
                        <SelectTrigger className="bg-slate-50/50 border-slate-200 hover:border-primary/50 transition-colors">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {LINE_SPACINGS.map((s) => (
                            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <Separator className="bg-slate-100" />

                {/* Meta Data */}
                <div className="space-y-4">
                  <Label className="text-sm font-semibold text-slate-700">Optional Meta Data</Label>
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-xs text-muted-foreground">Title</Label>
                    <Input id="title" placeholder="e.g. The Impact of Artificial Intelligence" value={title} onChange={(e) => setTitle(e.target.value)} className="bg-slate-50/50 border-slate-200 focus-visible:ring-primary/20" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="author" className="text-xs text-muted-foreground">Author Name</Label>
                      <Input id="author" placeholder="Jane Doe" value={author} onChange={(e) => setAuthor(e.target.value)} className="bg-slate-50/50 border-slate-200 focus-visible:ring-primary/20" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="date" className="text-xs text-muted-foreground">Date</Label>
                      <Input id="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-slate-50/50 border-slate-200 focus-visible:ring-primary/20" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg shadow-slate-200/40 border-slate-200/60 overflow-hidden bg-gradient-to-b from-white to-slate-50/50">
              <div className="h-1 w-full bg-gradient-to-r from-primary/80 to-primary" />
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Download className="w-5 h-5 text-primary" />
                  Export Document
                </CardTitle>
                <CardDescription>Download your perfectly formatted document instantly.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={() => handleFormatDocx(getFormData(), title || "Document")}
                  disabled={!text.trim() || isFormatting}
                  className="w-full h-14 justify-start px-6 gap-4 text-base font-medium shadow-md hover:shadow-lg transition-all"
                >
                  <FileType className="w-5 h-5 text-blue-200" />
                  {isFormatting ? "Processing..." : "Download as DOCX"}
                  <span className="ml-auto text-xs font-normal opacity-70">Word</span>
                </Button>

                <Button
                  onClick={() => handleFormatPdf(getFormData(), title || "Document")}
                  disabled={!text.trim() || isFormatting}
                  variant="outline"
                  className="w-full h-14 justify-start px-6 gap-4 text-base font-medium border-slate-200 hover:bg-slate-50 hover:text-red-600 transition-all"
                >
                  <FileText className="w-5 h-5 text-red-400" />
                  {isFormatting ? "Processing..." : "Download as PDF"}
                  <span className="ml-auto text-xs font-normal opacity-50">PDF</span>
                </Button>

                <Button
                  onClick={() => handleFormatTxt(getFormData(), title || "Document")}
                  disabled={!text.trim() || isFormatting}
                  variant="ghost"
                  className="w-full h-12 justify-start px-6 gap-4 text-sm font-medium text-slate-600 hover:text-slate-900 transition-all"
                >
                  <FileText className="w-4 h-4 opacity-50" />
                  Download as Plain Text
                </Button>

                <div className="pt-1 border-t border-slate-100">
                  <Button
                    onClick={() => handleOpenInGoogleDocs(getFormData(), title || "Document")}
                    disabled={!text.trim() || isFormatting}
                    variant="outline"
                    className="w-full h-12 justify-start px-6 gap-3 text-sm font-medium border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 hover:text-blue-700 transition-all"
                  >
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M14 2v6h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M8 13h8M8 17h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    Open in Google Docs
                    <ExternalLink className="w-3 h-3 ml-auto opacity-40" />
                  </Button>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </main>
    </div>
  );
}
