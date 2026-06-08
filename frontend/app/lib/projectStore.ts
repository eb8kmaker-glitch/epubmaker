"use client";
// IndexedDB store for full editor projects (chapters, settings, image + cover
// Blobs). Keeps at most MAX_PROJECTS, pruning the oldest by updatedAt.

import type { ProjectRecord } from "./projectSchema";

const DB_NAME = "epubmaker_projects";
const DB_VERSION = 1;
const STORE = "projects";
const MAX_PROJECTS = 10;

export interface ProjectSummary {
  id: string;
  title: string;
  updatedAt: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB unavailable"));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: "id" });
        store.createIndex("updatedAt", "updatedAt");
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx(db: IDBDatabase, mode: IDBTransactionMode): IDBObjectStore {
  return db.transaction(STORE, mode).objectStore(STORE);
}

/** Save (insert or update) a project, then prune to the newest MAX_PROJECTS. */
export async function saveProject(record: ProjectRecord): Promise<void> {
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const t = db.transaction(STORE, "readwrite");
    t.objectStore(STORE).put(record);
    t.oncomplete = () => resolve();
    t.onerror = () => reject(t.error);
  });
  await pruneOld(db);
}

async function pruneOld(db: IDBDatabase): Promise<void> {
  const all = await new Promise<ProjectRecord[]>((resolve, reject) => {
    const req = tx(db, "readonly").index("updatedAt").getAll();
    req.onsuccess = () => resolve(req.result as ProjectRecord[]);
    req.onerror = () => reject(req.error);
  });
  if (all.length <= MAX_PROJECTS) return;
  // getAll on the index is ascending by updatedAt → oldest first.
  const toDelete = all.slice(0, all.length - MAX_PROJECTS);
  await new Promise<void>((resolve, reject) => {
    const t = db.transaction(STORE, "readwrite");
    for (const r of toDelete) t.objectStore(STORE).delete(r.id);
    t.oncomplete = () => resolve();
    t.onerror = () => reject(t.error);
  });
}

/** List projects newest-first (summaries only; image Blobs are not retained). */
export async function listProjects(): Promise<ProjectSummary[]> {
  const db = await openDB();
  const all = await new Promise<ProjectRecord[]>((resolve, reject) => {
    const req = tx(db, "readonly").index("updatedAt").getAll();
    req.onsuccess = () => resolve(req.result as ProjectRecord[]);
    req.onerror = () => reject(req.error);
  });
  return all
    .map((r) => ({ id: r.id, title: r.title, updatedAt: r.updatedAt }))
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function loadProject(id: string): Promise<ProjectRecord | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = tx(db, "readonly").get(id);
    req.onsuccess = () => resolve(req.result as ProjectRecord | undefined);
    req.onerror = () => reject(req.error);
  });
}

export async function deleteProject(id: string): Promise<void> {
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const t = db.transaction(STORE, "readwrite");
    t.objectStore(STORE).delete(id);
    t.oncomplete = () => resolve();
    t.onerror = () => reject(t.error);
  });
}
