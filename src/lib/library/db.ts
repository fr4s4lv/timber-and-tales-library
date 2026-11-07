// Browser-only IndexedDB persistence. Books never leave the device.
import { createStore, del, get, set, values, type UseStore } from "idb-keyval";
import type { BookMeta } from "./types";

let stores: { meta: UseStore; files: UseStore; covers: UseStore } | null = null;

function s() {
  if (!stores) {
    stores = {
      meta: createStore("librarium-meta", "books"),
      files: createStore("librarium-files", "files"),
      covers: createStore("librarium-covers", "covers"),
    };
  }
  return stores;
}

export async function listBookMetas(): Promise<BookMeta[]> {
  return (await values<BookMeta>(s().meta)) ?? [];
}

export function putBookMeta(meta: BookMeta) {
  return set(meta.id, meta, s().meta);
}

export function putBookFile(id: string, blob: Blob) {
  return set(id, blob, s().files);
}

export function putCover(id: string, blob: Blob) {
  return set(id, blob, s().covers);
}

export function getBookFile(id: string) {
  return get<Blob>(id, s().files);
}

export function getCover(id: string) {
  return get<Blob>(id, s().covers);
}

export async function deleteBookData(id: string) {
  await Promise.all([del(id, s().meta), del(id, s().files), del(id, s().covers)]);
}

export async function requestPersistentStorage() {
  try {
    if (navigator.storage?.persist && !(await navigator.storage.persisted())) {
      await navigator.storage.persist();
    }
  } catch {
    /* not available */
  }
}
