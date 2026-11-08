import type { Settings } from "@/lib/settings";

export type ReaderPrefs = Settings["reader"];

export interface TocEntry {
  label: string;
  /** href / cfi for reflowable books, page number for PDF */
  target: string | number;
  subitems?: TocEntry[];
}

export interface Location {
  fraction: number;
  label?: string;
  cfi?: string;
  page?: number;
  totalPages?: number;
  excerpt?: string;
  tocTarget?: string | number;
  /** whether a stored bookmark position falls on the visible page */
  contains: (bm: { cfi?: string; page?: number }) => boolean;
}

export interface ReaderHandle {
  next(): void;
  prev(): void;
  goTo(target: string | number): void;
  goToFraction(f: number): void;
  excerpt(): Promise<string>;
}

export interface EngineReady {
  toc: TocEntry[];
  fixedLayout: boolean;
  totalPages?: number;
}

export type TapZone = "left" | "center" | "right";

export interface EngineProps {
  blob: Blob;
  fileName: string;
  initial?: { cfi?: string; page?: number; fraction?: number };
  prefs: ReaderPrefs;
  onReady: (r: EngineReady) => void;
  onRelocate: (l: Location) => void;
  onTap: (z: TapZone) => void;
  onError: (msg: string) => void;
  handleRef: React.MutableRefObject<ReaderHandle | null>;
}

export function readerColors(theme: ReaderPrefs["theme"]) {
  const css = getComputedStyle(document.documentElement);
  const v = (n: string) => css.getPropertyValue(n).trim();
  return {
    bg: v(`--reader-${theme}-bg`),
    fg: v(`--reader-${theme}-fg`),
    link: v("--reader-link"),
    dark: theme === "night" || theme === "gray",
  };
}
