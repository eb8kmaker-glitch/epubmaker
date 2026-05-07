"use client";

const DB_NAME = "epubmaker";
const DB_VERSION = 1;
const STORE_NAME = "history";
const MAX_ENTRIES = 20;

export interface HistoryEntry {
  id: string;
  filename: string;
  title?: string;
  convertedAt: string;
  sizeBytes?: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("convertedAt", "convertedAt");
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function addHistoryEntry(entry: Omit<HistoryEntry, "id">): Promise<void> {
  const db = await openDB();
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put({ id, ...entry });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  await pruneOldEntries(db);
}

export async function getHistory(): Promise<HistoryEntry[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).index("convertedAt").getAll();
    req.onsuccess = () => resolve((req.result as HistoryEntry[]).reverse());
    req.onerror = () => reject(req.error);
  });
}

async function pruneOldEntries(db: IDBDatabase): Promise<void> {
  const all = await new Promise<HistoryEntry[]>((resolve, reject) => {
    const req = db.transaction(STORE_NAME, "readonly")
      .objectStore(STORE_NAME).index("convertedAt").getAll();
    req.onsuccess = () => resolve(req.result as HistoryEntry[]);
    req.onerror = () => reject(req.error);
  });
  if (all.length <= MAX_ENTRIES) return;
  const toDelete = all.slice(0, all.length - MAX_ENTRIES);
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    for (const entry of toDelete) tx.objectStore(STORE_NAME).delete(entry.id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function clearHistory(): Promise<void> {
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
