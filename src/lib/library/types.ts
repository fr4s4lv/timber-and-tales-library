import type { Engine } from "./formats";

export interface Bookmark {
  id: string;
  createdAt: number;
  label: string;
  excerpt?: string | undefined;
  fraction: number;
  cfi?: string | undefined;
  page?: number | undefined;
}

export interface ReadingProgress {
  fraction: number;
  cfi?: string | undefined;
  page?: number | undefined;
  label?: string | undefined;
}

export interface BookMeta {
  id: string;
  title: string;
  author: string;
  formatLabel: string;
  engine: Exclude<Engine, "convert">;
  /** file name handed to the reading engine (extension matters) */
  fileName: string;
  originalName: string;
  size: number;
  addedAt: number;
  lastOpenedAt?: number | undefined;
  favorite: boolean;
  hasCover: boolean;
  coverRatio?: number | undefined; // height / width
  progress?: ReadingProgress | undefined;
  bookmarks: Bookmark[];
}
