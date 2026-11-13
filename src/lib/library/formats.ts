import { t } from "@/lib/i18n";
import type { MessageKey } from "@/lib/i18n/it";
export type Engine = "foliate" | "pdf" | "convert";
export type ConvertKind = "txt" | "md" | "html" | "docx" | "rtf";

export interface SupportedFormat {
  supported: true;
  ext: string;
  label: string;
  engine: Engine;
  convert?: ConvertKind;
}
export interface UnsupportedFormat {
  supported: false;
  ext: string;
  reason: string;
}
export type FormatInfo = SupportedFormat | UnsupportedFormat;

const TABLE: Record<string, Omit<SupportedFormat, "supported" | "ext">> = {
  epub: { label: "EPUB", engine: "foliate" },
  kepub: { label: "Kobo EPUB", engine: "foliate" },
  "kepub.epub": { label: "Kobo EPUB", engine: "foliate" },
  epub3: { label: "EPUB", engine: "foliate" },
  mobi: { label: "MOBI", engine: "foliate" },
  prc: { label: "MOBI", engine: "foliate" },
  azw: { label: "Kindle AZW", engine: "foliate" },
  azw3: { label: "Kindle AZW3", engine: "foliate" },
  kf8: { label: "Kindle KF8", engine: "foliate" },
  fb2: { label: "FB2", engine: "foliate" },
  "fb2.zip": { label: "FB2", engine: "foliate" },
  fbz: { label: "FB2", engine: "foliate" },
  cbz: { label: "CBZ", engine: "foliate" },
  pdf: { label: "PDF", engine: "pdf" },
  txt: { label: "TXT", engine: "convert", convert: "txt" },
  text: { label: "TXT", engine: "convert", convert: "txt" },
  md: { label: "Markdown", engine: "convert", convert: "md" },
  markdown: { label: "Markdown", engine: "convert", convert: "md" },
  html: { label: "HTML", engine: "convert", convert: "html" },
  htm: { label: "HTML", engine: "convert", convert: "html" },
  xhtml: { label: "XHTML", engine: "convert", convert: "html" },
  docx: { label: "Word", engine: "convert", convert: "docx" },
  rtf: { label: "RTF", engine: "convert", convert: "rtf" },
};

const UNSUPPORTED: Record<string, MessageKey> = {
  kfx: "import.kfx",
  azw4: "import.azw4",
  cbr: "import.cbr",
  cb7: "import.cb7",
  djvu: "import.djvu",
  lit: "import.lit",
  lrf: "import.lrf",
  doc: "import.doc",
  pages: "import.pages",
  ibooks: "import.ibooks",
  acsm: "import.acsm",
};

/** Ordered so that multi-part extensions win ("book.fb2.zip" → fb2.zip). */
const MULTI_EXT = ["kepub.epub", "fb2.zip"];

export function extensionOf(fileName: string): string {
  const lower = fileName.trim().toLowerCase();
  for (const m of MULTI_EXT) if (lower.endsWith("." + m)) return m;
  const dot = lower.lastIndexOf(".");
  return dot >= 0 ? lower.slice(dot + 1) : "";
}

export function detectFormat(fileName: string): FormatInfo {
  const ext = extensionOf(fileName);
  const known = TABLE[ext];
  if (known) return { supported: true, ext, ...known };
  const reasonKey = UNSUPPORTED[ext];
  if (reasonKey) return { supported: false, ext, reason: t(reasonKey) };
  return {
    supported: false,
    ext,
    reason: ext ? t("import.unknownExt", { ext }) : t("import.noExt"),
  };
}

export const ACCEPT_ATTR = Object.keys(TABLE)
  .filter((e) => !e.includes("."))
  .map((e) => "." + e)
  .join(",");

export const SUPPORTED_LABELS = [
  "EPUB",
  "MOBI",
  "AZW3",
  "FB2",
  "CBZ",
  "PDF",
  "TXT",
  "Markdown",
  "HTML",
  "Word (DOCX)",
  "RTF",
];

/** Name under which the reader engine expects the stored file. */
export function storedFileName(format: SupportedFormat): string {
  if (format.engine === "convert") return "book.epub";
  if (format.engine === "pdf") return "book.pdf";
  if (format.ext === "fb2.zip" || format.ext === "fbz") return "book.fbz";
  if (format.ext === "kepub" || format.ext === "kepub.epub" || format.ext === "epub3") return "book.epub";
  return `book.${format.ext}`;
}
