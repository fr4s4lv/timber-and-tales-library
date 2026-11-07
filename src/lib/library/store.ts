import { useEffect, useState, useSyncExternalStore } from "react";
import { deleteBookData, getCover, listBookMetas, putBookMeta, requestPersistentStorage } from "./db";
import type { BookMeta } from "./types";

interface LibraryState {
  books: BookMeta[];
  ready: boolean;
}

const SERVER_STATE: LibraryState = { books: [], ready: false };
let state: LibraryState = SERVER_STATE;
let loading: Promise<void> | null = null;
const listeners = new Set<() => void>();

function emit(next: LibraryState) {
  state = next;
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function initLibrary(): Promise<void> {
  if (!loading) {
    loading = (async () => {
      const books = await listBookMetas();
      emit({ books, ready: true });
      void requestPersistentStorage();
    })();
  }
  return loading;
}

export function useLibrary() {
  const snap = useSyncExternalStore(
    subscribe,
    () => state,
    () => SERVER_STATE,
  );
  useEffect(() => {
    void initLibrary();
  }, []);
  return snap;
}

export function getLibrarySnapshot() {
  return state;
}

export function getBookSync(id: string) {
  return state.books.find((b) => b.id === id);
}

export async function addBookMeta(meta: BookMeta) {
  await putBookMeta(meta);
  emit({ ...state, books: [...state.books, meta] });
}

export async function updateBook(id: string, patch: Partial<BookMeta> | ((b: BookMeta) => Partial<BookMeta>)) {
  const current = state.books.find((b) => b.id === id);
  if (!current) return;
  const next = { ...current, ...(typeof patch === "function" ? patch(current) : patch) };
  emit({ ...state, books: state.books.map((b) => (b.id === id ? next : b)) });
  await putBookMeta(next);
}

export async function removeBook(id: string) {
  emit({ ...state, books: state.books.filter((b) => b.id !== id) });
  const url = coverUrls.get(id);
  if (url) URL.revokeObjectURL(url);
  coverUrls.delete(id);
  await deleteBookData(id);
}

const coverUrls = new Map<string, string>();

export function useCoverUrl(id: string, hasCover: boolean) {
  const [url, setUrl] = useState<string | undefined>(undefined);
  useEffect(() => {
    if (!hasCover) return;
    const cached = coverUrls.get(id);
    if (cached) {
      setUrl(cached);
      return;
    }
    let alive = true;
    void getCover(id).then((blob) => {
      if (!blob || !alive) return;
      const u = coverUrls.get(id) ?? URL.createObjectURL(blob);
      coverUrls.set(id, u);
      setUrl(u);
    });
    return () => {
      alive = false;
    };
  }, [id, hasCover]);
  return url;
}
