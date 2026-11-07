import { useSyncExternalStore } from "react";
import type { ShelfStyle } from "@/lib/bookcase/catalog";
import { BOOKS_PER_SHELF_RANGE, clampBooksPerShelf, type DeviceClass } from "@/lib/bookcase/shelf";

export type ReaderFlow = "paginated" | "scrolled";
export type ReaderTheme = "paper" | "sepia" | "gray" | "night";
export type ReaderFont = "original" | "literata" | "cormorant" | "sans";

export interface Settings {
  style: ShelfStyle;
  variant: Record<ShelfStyle, string>;
  finish: Record<ShelfStyle, string>;
  booksPerShelf: Record<DeviceClass, number>;
  reader: {
    flow: ReaderFlow;
    theme: ReaderTheme;
    font: ReaderFont;
    fontScale: number; // percent
    lineHeight: number;
    justify: boolean;
  };
}

export const DEFAULT_SETTINGS: Settings = {
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
    font: "original",
    fontScale: 100,
    lineHeight: 1.5,
    justify: true,
  },
};

const KEY = "librarium:settings:v1";
let current: Settings = DEFAULT_SETTINGS;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Settings>;
      current = {
        ...DEFAULT_SETTINGS,
        ...parsed,
        variant: { ...DEFAULT_SETTINGS.variant, ...parsed.variant },
        finish: { ...DEFAULT_SETTINGS.finish, ...parsed.finish },
        booksPerShelf: {
          phone: clampBooksPerShelf("phone", parsed.booksPerShelf?.phone ?? NaN),
          tablet: clampBooksPerShelf("tablet", parsed.booksPerShelf?.tablet ?? NaN),
        },
        reader: { ...DEFAULT_SETTINGS.reader, ...parsed.reader },
      };
    }
  } catch {
    current = DEFAULT_SETTINGS;
  }
}

function subscribe(l: () => void) {
  load();
  listeners.add(l);
  // values may differ from the server snapshot once storage is read
  queueMicrotask(l);
  return () => listeners.delete(l);
}

export function useSettings(): Settings {
  return useSyncExternalStore(
    subscribe,
    () => {
      load();
      return current;
    },
    () => DEFAULT_SETTINGS,
  );
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
