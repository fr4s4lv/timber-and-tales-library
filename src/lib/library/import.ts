// Browser-only import pipeline: detect → (convert) → read metadata & cover → store locally.
import { unzip } from "fflate";
import { putBookFile, putCover } from "./db";
import { detectFormat, storedFileName, type SupportedFormat } from "./formats";
import { addBookMeta, getLibrarySnapshot, initLibrary } from "./store";
import type { BookMeta } from "./types";

export interface ImportOutcome {
  imported: BookMeta[];
  failed: { name: string; reason: string }[];
}

const FONT_OBFUSCATION = new Set([
  "http://www.idpf.org/2008/embedding",
  "http://ns.adobe.com/pdf/enc#RC",
]);

function readZipEntries(file: Blob, wanted: string[]): Promise<Record<string, string>> {
  return file.arrayBuffer().then(
    (buf) =>
      new Promise((resolve) => {
        unzip(
          new Uint8Array(buf),
          { filter: (f) => wanted.includes(f.name) },
          (err, data) => {
            if (err) return resolve({});
            const out: Record<string, string> = {};
            for (const [k, v] of Object.entries(data)) out[k] = new TextDecoder().decode(v);
            resolve(out);
          },
        );
      }),
  );
}

async function epubHasDrm(file: Blob): Promise<boolean> {
  const entries = await readZipEntries(file, ["META-INF/rights.xml", "META-INF/encryption.xml"]);
  if (entries["META-INF/rights.xml"]) return true;
  const enc = entries["META-INF/encryption.xml"];
  if (!enc) return false;
  const algos = Array.from(enc.matchAll(/Algorithm="([^"]+)"/g)).map((m) => m[1]);
  return algos.some((a) => !FONT_OBFUSCATION.has(a));
}

async function mobiHasDrm(file: Blob): Promise<boolean> {
  try {
    const head = new DataView(await file.slice(0, 90).arrayBuffer());
    const rec0 = head.getUint32(78);
    const r0 = new DataView(await file.slice(rec0, rec0 + 16).arrayBuffer());
    return r0.getUint16(12) !== 0;
  } catch {
    return false;
  }
}

const langMap = (x: unknown): string => {
  if (!x) return "";
  if (typeof x === "string") return x;
  if (typeof x === "object") {
    const v = Object.values(x as Record<string, string>)[0];
    return typeof v === "string" ? v : "";
  }
  return "";
};

const formatAuthor = (a: unknown): string => {
  const one = (c: unknown) =>
    typeof c === "string" ? c : langMap((c as { name?: unknown } | null)?.name);
  if (Array.isArray(a)) return a.map(one).filter(Boolean).join(", ");
  return one(a);
};

async function normalizeCover(blob: Blob | null | undefined): Promise<{ blob: Blob; ratio: number } | null> {
  if (!blob || !blob.size) return null;
  try {
    const bmp = await createImageBitmap(blob);
    const maxW = 420;
    const scale = Math.min(1, maxW / bmp.width);
    const w = Math.max(1, Math.round(bmp.width * scale));
    const h = Math.max(1, Math.round(bmp.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    canvas.getContext("2d")!.drawImage(bmp, 0, 0, w, h);
    const out = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/jpeg", 0.86));
    return out ? { blob: out, ratio: h / w } : null;
  } catch {
    return null;
  }
}

function baseTitleOf(name: string) {
  return name
    .replace(/\.(kepub\.epub|fb2\.zip|[a-z0-9]+)$/i, "")
    .replace(/[_]+/g, " ")
    .trim();
}

async function importOne(file: File): Promise<BookMeta> {
  const fmt = detectFormat(file.name);
  if (!fmt.supported) throw new Error(fmt.reason);
  const dup = getLibrarySnapshot().books.find((b) => b.originalName === file.name && b.size === file.size);
  if (dup) throw new Error("È già nella tua libreria.");

  const id = crypto.randomUUID();
  const baseTitle = baseTitleOf(file.name);
  let stored: Blob = file;
  let title = baseTitle;
  let author = "";
  let cover: { blob: Blob; ratio: number } | null = null;
  const engine: BookMeta["engine"] = fmt.engine === "pdf" ? "pdf" : "foliate";
  const fileName = storedFileName(fmt as SupportedFormat);

  if (fmt.engine === "convert") {
    const { convertToEpub } = await import("./convert");
    const out = await convertToEpub(file, fmt.convert!, baseTitle);
    stored = out.blob;
    title = out.title;
    author = out.author;
  } else if (fmt.engine === "foliate") {
    if (["epub", "kepub", "kepub.epub", "epub3"].includes(fmt.ext) && (await epubHasDrm(file))) {
      throw new Error("Questo EPUB è protetto da DRM (Adobe/Apple) e non può essere aperto.");
    }
    if (["mobi", "azw", "azw3", "prc", "kf8"].includes(fmt.ext) && (await mobiHasDrm(file))) {
      throw new Error("Questo file Kindle è protetto da DRM e non può essere aperto.");
    }
    const { makeBook } = await import("foliate-js/view.js");
    let book: FoliateBook;
    try {
      book = await makeBook(new File([file], fileName, { type: file.type }));
    } catch {
      throw new Error("Il file sembra danneggiato o non è un ebook valido.");
    }
    if (!book.sections?.length) throw new Error("Il libro non contiene pagine leggibili.");
    title = langMap(book.metadata?.title) || baseTitle;
    author = formatAuthor(book.metadata?.author);
    cover = await normalizeCover(await Promise.resolve(book.getCover?.()).catch(() => null));
  } else {
    const { openPdf, renderPdfPageToBlob } = await import("./pdf");
    let pdf;
    try {
      pdf = await openPdf(file);
    } catch (e) {
      const msg = String((e as Error)?.message ?? e);
      if (/password/i.test(msg)) throw new Error("Questo PDF è protetto da password.");
      throw new Error("Il PDF sembra danneggiato.");
    }
    const meta = await pdf.getMetadata().catch(() => null);
    const info = (meta?.info ?? {}) as { Title?: string; Author?: string };
    if (info.Title && info.Title.trim().length > 1 && !/^untitled|\.(docx?|pdf)$/i.test(info.Title)) {
      title = info.Title.trim();
    }
    author = info.Author?.trim() ?? "";
    cover = await normalizeCover(await renderPdfPageToBlob(pdf, 1, 420).catch(() => null));
    void pdf.destroy();
  }

  await putBookFile(id, stored);
  if (cover) await putCover(id, cover.blob);
  const meta: BookMeta = {
    id,
    title,
    author,
    formatLabel: fmt.label,
    engine,
    fileName,
    originalName: file.name,
    size: file.size,
    addedAt: Date.now(),
    favorite: false,
    hasCover: !!cover,
    coverRatio: cover?.ratio,
    bookmarks: [],
  };
  await addBookMeta(meta);
  return meta;
}

export async function importFiles(
  files: File[],
  onProgress?: (done: number, total: number, name: string) => void,
): Promise<ImportOutcome> {
  await initLibrary();
  const outcome: ImportOutcome = { imported: [], failed: [] };
  let done = 0;
  for (const file of files) {
    onProgress?.(done, files.length, file.name);
    try {
      outcome.imported.push(await importOne(file));
    } catch (e) {
      outcome.failed.push({ name: file.name, reason: (e as Error).message || "Errore sconosciuto" });
    }
    done++;
  }
  onProgress?.(done, files.length, "");
  return outcome;
}
