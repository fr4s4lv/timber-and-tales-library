// Converts plain documents (TXT, Markdown, HTML, DOCX, RTF) into a small EPUB
// so every format shares the same reader, table of contents and bookmarks.
import { strToU8, zipSync, type Zippable } from "fflate";
import type { ConvertKind } from "./formats";

interface Chapter {
  title: string;
  html: string;
}
interface Converted {
  title: string;
  author: string;
  chapters: Chapter[];
}

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

async function decodeText(file: Blob): Promise<string> {
  const buf = new Uint8Array(await file.arrayBuffer());
  if (buf[0] === 0xff && buf[1] === 0xfe) return new TextDecoder("utf-16le").decode(buf);
  if (buf[0] === 0xfe && buf[1] === 0xff) return new TextDecoder("utf-16be").decode(buf);
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buf);
  } catch {
    return new TextDecoder("windows-1252").decode(buf);
  }
}

const HEADING_RE =
  /^\s*((capitolo|chapter|chapitre|kapitel|cap[ií]tulo|parte|part|libro|book|prologo|prologue|epilogo|epilogue|introduzione|introduction|prefazione|preface)\b.{0,80}|[IVXLC]{1,7}\.?|\d{1,3}\.)\s*$/i;

function textToChapters(text: string, fallbackTitle: string): Chapter[] {
  const normalized = text.replace(/\r\n?/g, "\n");
  const hasBlankLines = /\n\s*\n/.test(normalized);
  const blocks = (hasBlankLines ? normalized.split(/\n\s*\n/) : normalized.split("\n"))
    .map((b) => b.trim())
    .filter(Boolean);

  const chapters: Chapter[] = [];
  let cur: Chapter | null = null;
  for (const block of blocks) {
    const firstLine = block.split("\n")[0] ?? "";
    if (HEADING_RE.test(firstLine) && firstLine.length < 90) {
      cur = { title: firstLine.trim(), html: `<h2>${esc(firstLine.trim())}</h2>` };
      chapters.push(cur);
      const rest = block.split("\n").slice(1).join(" ").trim();
      if (rest) cur.html += `<p>${esc(rest)}</p>`;
      continue;
    }
    if (!cur) {
      cur = { title: fallbackTitle, html: "" };
      chapters.push(cur);
    }
    cur.html += `<p>${esc(block.replace(/\n/g, " "))}</p>`;
  }
  // very long files without headings: split into readable parts
  if (chapters.length === 1 && blocks.length > 120) {
    const parts: Chapter[] = [];
    for (let i = 0; i < blocks.length; i += 80) {
      const n = parts.length + 1;
      parts.push({
        title: `Parte ${n}`,
        html: blocks
          .slice(i, i + 80)
          .map((b) => `<p>${esc(b.replace(/\n/g, " "))}</p>`)
          .join(""),
      });
    }
    return parts;
  }
  return chapters.length ? chapters : [{ title: fallbackTitle, html: "<p></p>" }];
}

function inlineMd(s: string) {
  return esc(s)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/__(.+?)__/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/_(.+?)_/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code>$1</code>")
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>');
}

function markdownToHtml(md: string): string {
  const lines = md.replace(/\r\n?/g, "\n").split("\n");
  let html = "";
  let para: string[] = [];
  let list: "ul" | "ol" | null = null;
  const flush = () => {
    if (para.length) html += `<p>${inlineMd(para.join(" "))}</p>`;
    para = [];
  };
  const closeList = () => {
    if (list) html += `</${list}>`;
    list = null;
  };
  for (const line of lines) {
    const h = /^(#{1,6})\s+(.*)$/.exec(line);
    const ul = /^\s*[-*+]\s+(.*)$/.exec(line);
    const ol = /^\s*\d+[.)]\s+(.*)$/.exec(line);
    const quote = /^>\s?(.*)$/.exec(line);
    if (h) {
      flush();
      closeList();
      const lvl = (h[1] ?? "#").length;
      html += `<h${lvl}>${inlineMd(h[2] ?? "")}</h${lvl}>`;
    } else if (ul || ol) {
      flush();
      const kind = ul ? "ul" : "ol";
      if (list !== kind) {
        closeList();
        html += `<${kind}>`;
        list = kind;
      }
      html += `<li>${inlineMd((ul ?? ol)![1] ?? "")}</li>`;
    } else if (quote) {
      flush();
      closeList();
      html += `<blockquote><p>${inlineMd(quote[1] ?? "")}</p></blockquote>`;
    } else if (/^\s*(---|\*\*\*)\s*$/.test(line)) {
      flush();
      closeList();
      html += "<hr/>";
    } else if (!line.trim()) {
      flush();
      closeList();
    } else {
      closeList();
      para.push(line.trim());
    }
  }
  flush();
  closeList();
  return html;
}

function htmlToChapters(html: string, fallbackTitle: string): { title: string; author: string; chapters: Chapter[] } {
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc.querySelectorAll("script, style[data-remove], iframe, object, embed").forEach((n) => n.remove());
  const title = doc.querySelector("title")?.textContent?.trim() || fallbackTitle;
  const author = doc.querySelector('meta[name="author"]')?.getAttribute("content") ?? "";
  const serializer = new XMLSerializer();
  const body = doc.body;
  const splitTag = body.querySelector("h1 ~ h1") ? "H1" : body.querySelector("h2") ? "H2" : "H1";

  const chapters: Chapter[] = [];
  let cur: Chapter | null = null;
  for (const node of Array.from(body.childNodes)) {
    const isHeading = node.nodeType === 1 && (node as Element).tagName === splitTag;
    if (isHeading || !cur) {
      cur = {
        title: isHeading ? (node.textContent ?? "").trim() || fallbackTitle : title,
        html: "",
      };
      chapters.push(cur);
    }
    cur.html += serializer.serializeToString(node);
  }
  const nonEmpty = chapters.filter((c) => c.html.replace(/<[^>]+>|\s/g, "").length > 0 || /<img/i.test(c.html));
  return { title, author, chapters: nonEmpty.length ? nonEmpty : [{ title, html: "<p></p>" }] };
}

const RTF_SYMBOLS: Record<string, string> = {
  emdash: "\u2014",
  endash: "\u2013",
  lquote: "\u2018",
  rquote: "\u2019",
  ldblquote: "\u201C",
  rdblquote: "\u201D",
  bullet: "\u2022",
  emspace: "\u2003",
  enspace: "\u2002",
  qmspace: "\u2005",
  "~": "\u00A0",
};
const CP1252 = new TextDecoder("windows-1252");

function rtfToText(rtf: string): string {
  let out = "";
  let depth = 0;
  const skipAt: number[] = [];
  // \ucN: how many fallback characters follow each \uN (per group, default 1)
  const ucStack: number[] = [1];
  let pendingSkip = 0;
  const DESTS =
    /^(fonttbl|colortbl|stylesheet|info|pict|header|headerl|headerr|headerf|footer|footerl|footerr|footerf|footnote|object|themedata|datastore|latentstyles|listtable|listoverridetable|rsidtbl|generator|xmlnstbl|mmathPr|filetbl|revtbl|bkmkstart|bkmkend|fldinst|shppict|nonshppict)$/;
  const emit = (s: string) => {
    if (skipAt.length) return;
    if (pendingSkip > 0) {
      pendingSkip--;
      return;
    }
    out += s;
  };
  for (let i = 0; i < rtf.length; i++) {
    const c = rtf[i];
    if (c === "{") {
      depth++;
      ucStack.push(ucStack[ucStack.length - 1] ?? 1);
      pendingSkip = 0;
      continue;
    }
    if (c === "}") {
      if (skipAt.length && skipAt[skipAt.length - 1] === depth) skipAt.pop();
      depth--;
      if (ucStack.length > 1) ucStack.pop();
      pendingSkip = 0;
      continue;
    }
    if (c === "\\") {
      const next = rtf[i + 1];
      if (next === "\\" || next === "{" || next === "}") {
        emit(next);
        i++;
        continue;
      }
      if (next === "'") {
        const byte = parseInt(rtf.substr(i + 2, 2), 16);
        i += 3;
        if (Number.isFinite(byte)) emit(CP1252.decode(new Uint8Array([byte])));
        continue;
      }
      if (next === "*") {
        skipAt.push(depth);
        i++;
        continue;
      }
      if (next === "~" || next === "-" || next === "_") {
        if (next === "~") emit("\u00A0");
        else if (next === "_") emit("-");
        i++;
        continue;
      }
      if (next === "\n" || next === "\r") {
        emit("\n\n");
        i++;
        continue;
      }
      const m = /^([a-zA-Z]+)(-?\d+)? ?/.exec(rtf.slice(i + 1, i + 40));
      if (m) {
        const word = m[1] ?? "";
        i += m[0].length;
        if (DESTS.test(word)) {
          skipAt.push(depth);
        } else if (word === "uc" && m[2]) {
          ucStack[ucStack.length - 1] = Math.max(0, parseInt(m[2], 10));
        } else if (word === "u" && m[2]) {
          const code = parseInt(m[2], 10);
          emit(String.fromCharCode(code < 0 ? code + 65536 : code));
          if (!skipAt.length) pendingSkip = ucStack[ucStack.length - 1] ?? 1;
        } else if (word === "par" || word === "line" || word === "sect" || word === "page") {
          emit("\n\n");
        } else if (word === "tab") {
          emit("\t");
        } else if (RTF_SYMBOLS[word]) {
          emit(RTF_SYMBOLS[word]!);
        }
        continue;
      }
      continue;
    }
    if (c === "\n" || c === "\r") continue;
    emit(c!);
  }
  return out;
}

function buildEpub({ title, author, chapters }: Converted, lang = "it"): Blob {
  const uid = "urn:uuid:" + crypto.randomUUID();
  const files: Zippable = {};
  files["mimetype"] = [strToU8("application/epub+zip"), { level: 0 }];
  files["META-INF/container.xml"] = strToU8(
    `<?xml version="1.0" encoding="UTF-8"?><container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>`,
  );
  const manifest: string[] = [];
  const spine: string[] = [];
  const navItems: string[] = [];
  chapters.forEach((ch, i) => {
    const id = `c${i + 1}`;
    const href = `${id}.xhtml`;
    files[`OEBPS/${href}`] = strToU8(
      `<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE html><html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="${lang}"><head><meta charset="utf-8"/><title>${esc(ch.title)}</title></head><body>${ch.html}</body></html>`,
    );
    manifest.push(`<item id="${id}" href="${href}" media-type="application/xhtml+xml"/>`);
    spine.push(`<itemref idref="${id}"/>`);
    navItems.push(`<li><a href="${href}">${esc(ch.title)}</a></li>`);
  });
  files["OEBPS/nav.xhtml"] = strToU8(
    `<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE html><html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops"><head><title>Indice</title></head><body><nav epub:type="toc"><h1>Indice</h1><ol>${navItems.join("")}</ol></nav></body></html>`,
  );
  files["OEBPS/content.opf"] = strToU8(
    `<?xml version="1.0" encoding="UTF-8"?><package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="uid"><metadata xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:identifier id="uid">${uid}</dc:identifier><dc:title>${esc(title)}</dc:title>${author ? `<dc:creator>${esc(author)}</dc:creator>` : ""}<dc:language>${lang}</dc:language><meta property="dcterms:modified">${new Date().toISOString().replace(/\.\d+Z$/, "Z")}</meta></metadata><manifest><item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>${manifest.join("")}</manifest><spine>${spine.join("")}</spine></package>`,
  );
  const zipped = zipSync(files, { level: 6 });
  return new Blob([zipped.buffer as ArrayBuffer], { type: "application/epub+zip" });
}

export async function convertToEpub(
  file: File,
  kind: ConvertKind,
  baseTitle: string,
): Promise<{ blob: Blob; title: string; author: string }> {
  let result: Converted;
  if (kind === "txt") {
    result = { title: baseTitle, author: "", chapters: textToChapters(await decodeText(file), baseTitle) };
  } else if (kind === "rtf") {
    const text = rtfToText(await decodeText(file));
    result = { title: baseTitle, author: "", chapters: textToChapters(text, baseTitle) };
  } else if (kind === "md") {
    result = htmlToChapters(markdownToHtml(await decodeText(file)), baseTitle);
    result.title = result.chapters[0]?.title && result.chapters.length === 1 ? baseTitle : baseTitle;
  } else if (kind === "html") {
    result = htmlToChapters(await decodeText(file), baseTitle);
  } else {
    const mod = (await import("mammoth/mammoth.browser.js")) as unknown as {
      default?: { convertToHtml: (i: { arrayBuffer: ArrayBuffer }) => Promise<{ value: string }> };
      convertToHtml?: (i: { arrayBuffer: ArrayBuffer }) => Promise<{ value: string }>;
    };
    const mammoth = mod.default ?? mod;
    const { value } = await mammoth.convertToHtml!({ arrayBuffer: await file.arrayBuffer() });
    result = htmlToChapters(`<html><body>${value}</body></html>`, baseTitle);
    result.title = baseTitle;
  }
  return { blob: buildEpub(result), title: result.title || baseTitle, author: result.author };
}

export const __test = { textToChapters, markdownToHtml, rtfToText };
