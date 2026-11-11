// Browser-only IndexedDB persistence. Books never leave the device.
// Files are stored as ArrayBuffers, not Blobs: Safari (private tabs, some
// Home-screen apps, older iOS) refuses to put Blobs into IndexedDB.
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

interface StoredBinary {
  buf: ArrayBuffer;
  type: string;
}

async function toStored(blob: Blob): Promise<StoredBinary> {
  return { buf: await blob.arrayBuffer(), type: blob.type };
}

function fromStored(v: StoredBinary | Blob | undefined): Blob | undefined {
  if (!v) return undefined;
  if (v instanceof Blob) return v; // written by an older version
  if (v.buf) return new Blob([v.buf], { type: v.type });
  return undefined;
}

export async function listBookMetas(): Promise<BookMeta[]> {
  return (await values<BookMeta>(s().meta)) ?? [];
}

export function putBookMeta(meta: BookMeta) {
  return set(meta.id, meta, s().meta);
}

export async function putBookFile(id: string, blob: Blob) {
  await set(id, await toStored(blob), s().files);
}

export async function putCover(id: string, blob: Blob) {
  await set(id, await toStored(blob), s().covers);
}

export async function getBookFile(id: string) {
  return fromStored(await get<StoredBinary | Blob>(id, s().files));
}

export async function getCover(id: string) {
  return fromStored(await get<StoredBinary | Blob>(id, s().covers));
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
