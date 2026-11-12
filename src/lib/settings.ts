import { useSyncExternalStore } from "react";
import type { ShelfStyle } from "@/lib/bookcase/catalog";
import { BOOKS_PER_SHELF_RANGE, clampBooksPerShelf, type DeviceClass } from "@/lib/bookcase/shelf";
import { browserLang, isLang, type Lang } from "@/lib/i18n/languages";
import { getReadingFont, FONT_SCALE, LINE_HEIGHT, SIDE_MARGIN } from "@/lib/reader/fonts";
import { isPaperId, type PaperId } from "@/lib/reader/papers";

export type ReaderFlow = "paginated" | "scrolled";
export type ReaderTheme = "paper" | "sepia" | "gray" | "night";
export type ReaderColumns = "auto" | "one";

export interface Settings {
  language: Lang;
  style: ShelfStyle;
  variant: Record<ShelfStyle, string>;
  finish: Record<ShelfStyle, string>;
  booksPerShelf: Record<DeviceClass, number>;
  reader: {
    flow: ReaderFlow;
    theme: ReaderTheme;
    paper: PaperId;
    font: string;
    fontScale: number; // percent
    lineHeight: number;
    /** side margin, percent of the page width */
    margin: number;
    columns: ReaderColumns;
    justify: boolean;
  };
}

export const DEFAULT_SETTINGS: Settings = {
  language: "it",
  style: "classico",
  variant: { classico: "ionico", antico: "biblioteca", moderno: "cornice" },
  finish: { classico: "noce", antico: "mogano", moderno: "tortora" },
  booksPerShelf: {
    phone: BOOKS_PER_SHELF_RANGE.phone.default,
    tablet: BOOKS_PER_SHELF_RANGE.tablet.default,
  },
  reader: {
    flow: "paginated",
    theme: "paper",
    paper: "bianca",
    font: "original",
    fontScale: 100,
    lineHeight: 1.5,
    margin: 4,
    columns: "auto",
    justify: true,
  },
};

const clamp = (n: unknown, lo: number, hi: number, fallback: number) =>
  typeof n === "number" && Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : fallback;

/** Repairs stored settings from older versions or hand edits. */
export function normalizeSettings(parsed: Partial<Settings> | null | undefined, fallbackLang: Lang = "it"): Settings {
  const p = parsed ?? {};
  const r: Partial<Settings["reader"]> = p.reader ?? {};
  const d = DEFAULT_SETTINGS.reader;
  // the first version stored "cormorant"/"literata"/"sans" — still valid ids
  const font = getReadingFont(r.font).id;
  return {
    ...DEFAULT_SETTINGS,
    ...p,
    language: isLang(p.language) ? p.language : fallbackLang,
    variant: { ...DEFAULT_SETTINGS.variant, ...p.variant },
    finish: { ...DEFAULT_SETTINGS.finish, ...p.finish },
    booksPerShelf: {
      phone: clampBooksPerShelf("phone", p.booksPerShelf?.phone ?? NaN),
      tablet: clampBooksPerShelf("tablet", p.booksPerShelf?.tablet ?? NaN),
    },
    reader: {
      flow: r.flow === "scrolled" ? "scrolled" : "paginated",
      theme: (["paper", "sepia", "gray", "night"] as const).includes(r.theme as ReaderTheme)
        ? (r.theme as ReaderTheme)
        : d.theme,
      paper: isPaperId(r.paper) ? r.paper : d.paper,
      font,
      fontScale: clamp(r.fontScale, FONT_SCALE.min, FONT_SCALE.max, d.fontScale),
      lineHeight: clamp(r.lineHeight, LINE_HEIGHT.min, LINE_HEIGHT.max, d.lineHeight),
      margin: clamp(r.margin, SIDE_MARGIN.min, SIDE_MARGIN.max, d.margin),
      columns: r.columns === "one" ? "one" : "auto",
      justify: typeof r.justify === "boolean" ? r.justify : d.justify,
    },
  };
}

const KEY = "librarium:settings:v1";
let current: Settings = DEFAULT_SETTINGS;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    current = normalizeSettings(raw ? (JSON.parse(raw) as Partial<Settings>) : null, browserLang());
  } catch {
    current = normalizeSettings(null, browserLang());
  }
}

function subscribe(l: () => void) {
  load();
  listeners.add(l);
  // values may differ from the server snapshot once storage is read
  queueMicrotask(l);
  return () => listeners.delete(l);
}

export function getSettings(): Settings {
  load();
  return current;
}

export function useSettings(): Settings {
  return useSyncExternalStore(subscribe, getSettings, () => DEFAULT_SETTINGS);
}

export function updateSettings(fn: (s: Settings) => Settings) {
  load();
  current = fn(current);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(current));
  } catch {
    /* quota or private mode */
  }
  listeners.forEach((l) => l());
}

export function updateReader(patch: Partial<Settings["reader"]>) {
  updateSettings((s) => ({ ...s, reader: { ...s.reader, ...patch } }));
}
