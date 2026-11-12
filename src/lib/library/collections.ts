// Collections live with the other preferences on this device (localStorage):
// a short list of names, each holding book ids.
import { useSyncExternalStore } from "react";

export interface Collection {
  id: string;
  name: string;
  bookIds: string[];
  createdAt: number;
}

const KEY = "librarium:collections:v1";
const EMPTY: Collection[] = [];
let current: Collection[] = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as Collection[]) : [];
    current = Array.isArray(parsed)
      ? parsed
          .filter((c) => c && typeof c.id === "string" && typeof c.name === "string")
          .map((c) => ({ ...c, bookIds: Array.isArray(c.bookIds) ? [...new Set(c.bookIds)] : [] }))
      : [];
  } catch {
    current = [];
  }
}

function save(next: Collection[]) {
  current = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* quota or private mode */
  }
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  load();
  listeners.add(l);
  queueMicrotask(l);
  return () => listeners.delete(l);
}

export function getCollections(): Collection[] {
  load();
  return current;
}

export function useCollections(): Collection[] {
  return useSyncExternalStore(subscribe, getCollections, () => EMPTY);
}

export function createCollection(name: string, firstBookId?: string): Collection | null {
  load();
  const clean = name.trim().slice(0, 60);
  if (!clean) return null;
  const col: Collection = {
    id: crypto.randomUUID(),
    name: clean,
    bookIds: firstBookId ? [firstBookId] : [],
    createdAt: Date.now(),
  };
  save([...current, col]);
  return col;
}

export function renameCollection(id: string, name: string) {
  load();
  const clean = name.trim().slice(0, 60);
  if (!clean) return;
  save(current.map((c) => (c.id === id ? { ...c, name: clean } : c)));
}

export function deleteCollection(id: string) {
  load();
  save(current.filter((c) => c.id !== id));
}

export function setBookInCollection(collectionId: string, bookId: string, inside: boolean) {
  load();
  save(
    current.map((c) => {
      if (c.id !== collectionId) return c;
      const has = c.bookIds.includes(bookId);
      if (inside && !has) return { ...c, bookIds: [...c.bookIds, bookId] };
      if (!inside && has) return { ...c, bookIds: c.bookIds.filter((b) => b !== bookId) };
      return c;
    }),
  );
}

export function removeBookFromAllCollections(bookId: string) {
  load();
  if (!current.some((c) => c.bookIds.includes(bookId))) return;
  save(current.map((c) => ({ ...c, bookIds: c.bookIds.filter((b) => b !== bookId) })));
}

/** Only ids of books still in the library count. */
export function collectionCount(col: Collection, existing: Set<string>) {
  return col.bookIds.filter((id) => existing.has(id)).length;
}
