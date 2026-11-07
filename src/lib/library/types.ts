import type { Engine } from "./formats";

export interface Bookmark {
  id: string;
  createdAt: number;
  label: string;
  excerpt?: string;
  fraction: number;
  cfi?: string;
  page?: number;
}

export interface ReadingProgress {
  fraction: number;
  cfi?: string;
  page?: number;
  label?: string;
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
  lastOpenedAt?: number;
  favorite: boolean;
  hasCover: boolean;
  coverRatio?: number; // height / width
  progress?: ReadingProgress;
  bookmarks: Bookmark[];
}
