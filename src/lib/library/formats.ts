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
  cbz: { label: "Fumetto CBZ", engine: "foliate" },
  pdf: { label: "PDF", engine: "pdf" },
  txt: { label: "Testo", engine: "convert", convert: "txt" },
  text: { label: "Testo", engine: "convert", convert: "txt" },
  md: { label: "Markdown", engine: "convert", convert: "md" },
  markdown: { label: "Markdown", engine: "convert", convert: "md" },
  html: { label: "HTML", engine: "convert", convert: "html" },
  htm: { label: "HTML", engine: "convert", convert: "html" },
  xhtml: { label: "XHTML", engine: "convert", convert: "html" },
  docx: { label: "Word", engine: "convert", convert: "docx" },
  rtf: { label: "RTF", engine: "convert", convert: "rtf" },
};

const UNSUPPORTED: Record<string, string> = {
  kfx: "I file Kindle KFX sono cifrati da Amazon e si leggono solo nelle app Kindle. Se il libro è senza DRM, convertilo in EPUB con Calibre.",
  azw4: "Il formato Kindle Print Replica (AZW4) non è leggibile fuori da Kindle. Se è senza DRM, convertilo in PDF con Calibre.",
  cbr: "Gli archivi fumetto RAR (CBR) non si possono aprire nel browser. Convertili in CBZ (ZIP) e reimportali.",
  cb7: "Gli archivi fumetto 7z (CB7) non si possono aprire nel browser. Convertili in CBZ (ZIP) e reimportali.",
  djvu: "Il formato DjVu non è supportato. Convertilo in PDF e reimportalo.",
  lit: "Il vecchio formato Microsoft LIT non è supportato. Convertilo in EPUB con Calibre.",
  lrf: "Il vecchio formato Sony LRF non è supportato. Convertilo in EPUB con Calibre.",
  doc: "I vecchi file Word .doc non sono supportati: salvali come .docx o PDF.",
  pages: "I file Pages vanno esportati in EPUB o PDF prima di importarli.",
  ibooks: "I file .ibooks di Apple non sono leggibili fuori da Apple Books.",
  acsm: "Il file .acsm è solo un buono d'acquisto Adobe con DRM: non contiene il libro.",
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
  const reason = UNSUPPORTED[ext];
  if (reason) return { supported: false, ext, reason };
  return {
    supported: false,
    ext,
    reason: ext
      ? `Il formato .${ext} non è un formato ebook riconosciuto.`
      : "Il file non ha un'estensione: impossibile riconoscerne il formato.",
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
