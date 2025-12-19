// Local-first storage using IndexedDB via idb

import { openDB, DBSchema, IDBPDatabase } from "idb";
import type { ResearchItem, Project, Note, ArxivFeedParams, FeedCacheMeta } from "./types";
import { getArxivCacheKey } from "./arxiv";

// Database schema
interface ResearchOSDB extends DBSchema {
  projects: {
    key: string;
    value: Project;
    indexes: { "by-updated": number };
  };
  papers: {
    key: string;
    value: ResearchItem;
    indexes: { 
      "by-updated": number;
      "by-type": string;
      "by-status": string;
    };
  };
  notes: {
    key: string;
    value: Note;
    indexes: { "by-project": string | null; "by-paper": string | null };
  };
  feedCache: {
    key: string; // cache key from getArxivCacheKey
    value: {
      cacheKey: string;
      papers: ResearchItem[];
      meta: FeedCacheMeta;
    };
  };
  feedMeta: {
    key: string;
    value: FeedCacheMeta;
  };
}

const DB_NAME = "ai-research-os";
const DB_VERSION = 2;

let dbInstance: IDBPDatabase<ResearchOSDB> | null = null;

export async function getDB(): Promise<IDBPDatabase<ResearchOSDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<ResearchOSDB>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      // Projects store
      if (!db.objectStoreNames.contains("projects")) {
        const projectStore = db.createObjectStore("projects", { keyPath: "id" });
        projectStore.createIndex("by-updated", "updatedAt");
      }

      // Papers store
      if (!db.objectStoreNames.contains("papers")) {
        const paperStore = db.createObjectStore("papers", { keyPath: "id" });
        paperStore.createIndex("by-updated", "updatedAt");
        paperStore.createIndex("by-type", "type");
        paperStore.createIndex("by-status", "status");
      }

      // Notes store
      if (!db.objectStoreNames.contains("notes")) {
        const noteStore = db.createObjectStore("notes", { keyPath: "id" });
        noteStore.createIndex("by-project", "projectId");
        noteStore.createIndex("by-paper", "paperId");
      }

      // Feed cache store (new in v2)
      if (!db.objectStoreNames.contains("feedCache")) {
        db.createObjectStore("feedCache", { keyPath: "cacheKey" });
      }

      // Feed meta store (new in v2)
      if (!db.objectStoreNames.contains("feedMeta")) {
        db.createObjectStore("feedMeta", { keyPath: "params" });
      }
    },
  });

  return dbInstance;
}

// Generate unique IDs
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================
// Project operations
// ============================================

export async function getAllProjects(): Promise<Project[]> {
  const db = await getDB();
  const projects = await db.getAllFromIndex("projects", "by-updated");
  return projects.reverse();
}

export async function getProject(id: string): Promise<Project | undefined> {
  const db = await getDB();
  return db.get("projects", id);
}

export async function createProject(data: { name: string; description: string }): Promise<Project> {
  const db = await getDB();
  const now = Date.now();
  const project: Project = {
    id: generateId(),
    ...data,
    createdAt: now,
    updatedAt: now,
  };
  await db.put("projects", project);
  return project;
}

export async function updateProject(
  id: string,
  data: Partial<{ name: string; description: string }>
): Promise<Project> {
  const db = await getDB();
  const existing = await db.get("projects", id);
  if (!existing) throw new Error("Project not found");

  const updated: Project = {
    ...existing,
    ...data,
    updatedAt: Date.now(),
  };
  await db.put("projects", updated);
  return updated;
}

export async function deleteProject(id: string): Promise<void> {
  const db = await getDB();
  await db.delete("projects", id);
}

// ============================================
// Paper/Item operations
// ============================================

export async function getAllPapers(): Promise<ResearchItem[]> {
  const db = await getDB();
  const papers = await db.getAllFromIndex("papers", "by-updated");
  return papers.reverse();
}

export async function getPaper(id: string): Promise<ResearchItem | undefined> {
  const db = await getDB();
  return db.get("papers", id);
}

export async function savePaper(paper: ResearchItem): Promise<ResearchItem> {
  const db = await getDB();
  await db.put("papers", paper);
  return paper;
}

export async function updatePaper(
  id: string,
  data: Partial<ResearchItem>
): Promise<ResearchItem> {
  const db = await getDB();
  const existing = await db.get("papers", id);
  if (!existing) throw new Error("Paper not found");

  const updated: ResearchItem = {
    ...existing,
    ...data,
    updatedAt: Date.now(),
  };
  await db.put("papers", updated);
  return updated;
}

export async function deletePaper(id: string): Promise<void> {
  const db = await getDB();
  await db.delete("papers", id);
}

export async function getReadingList(): Promise<ResearchItem[]> {
  const db = await getDB();
  const papers = await db.getAll("papers");
  return papers.filter((p) => p.savedToReadingList).reverse();
}

// ============================================
// Feed cache operations
// ============================================

export async function getPapersFeed(params: ArxivFeedParams): Promise<ResearchItem[]> {
  const db = await getDB();
  const cacheKey = getArxivCacheKey(params);
  const cached = await db.get("feedCache", cacheKey);
  
  if (!cached?.papers) return [];
  
  // Merge user state from papers store
  const papersWithUserState = await Promise.all(
    cached.papers.map(async (paper) => {
      const stored = await db.get("papers", paper.id);
      if (stored) {
        return {
          ...paper,
          status: stored.status,
          savedToReadingList: stored.savedToReadingList,
          notes: stored.notes,
        };
      }
      return paper;
    })
  );
  
  return papersWithUserState;
}

export async function savePapersFeed(
  params: ArxivFeedParams,
  papers: ResearchItem[]
): Promise<void> {
  const db = await getDB();
  const cacheKey = getArxivCacheKey(params);
  const now = new Date().toISOString();

  // Save to feed cache
  await db.put("feedCache", {
    cacheKey,
    papers,
    meta: {
      params,
      lastRefresh: now,
      totalResults: papers.length,
    },
  });

  // Also save each paper to the papers store (for reading list, etc.)
  const tx = db.transaction("papers", "readwrite");
  for (const paper of papers) {
    // Only update if not already saved, to preserve user state
    const existing = await tx.store.get(paper.id);
    if (!existing) {
      await tx.store.put(paper);
    } else {
      // Merge: keep user state, update paper metadata
      await tx.store.put({
        ...paper,
        status: existing.status,
        savedToReadingList: existing.savedToReadingList,
        notes: existing.notes,
      });
    }
  }
  await tx.done;
}

export async function getLastRefresh(params: ArxivFeedParams): Promise<string | null> {
  const db = await getDB();
  const cacheKey = getArxivCacheKey(params);
  const cached = await db.get("feedCache", cacheKey);
  return cached?.meta.lastRefresh || null;
}

export async function setLastRefresh(params: ArxivFeedParams, isoDate: string): Promise<void> {
  const db = await getDB();
  const cacheKey = getArxivCacheKey(params);
  const cached = await db.get("feedCache", cacheKey);
  
  if (cached) {
    cached.meta.lastRefresh = isoDate;
    await db.put("feedCache", cached);
  }
}

// ============================================
// Note operations
// ============================================

export async function getAllNotes(): Promise<Note[]> {
  const db = await getDB();
  return db.getAll("notes");
}

export async function createNote(data: {
  projectId?: string | null;
  paperId?: string | null;
  title: string;
  content?: string;
}): Promise<Note> {
  const db = await getDB();
  const now = Date.now();
  const note: Note = {
    id: generateId(),
    projectId: data.projectId ?? null,
    paperId: data.paperId ?? null,
    title: data.title,
    content: data.content ?? "",
    createdAt: now,
    updatedAt: now,
  };
  await db.put("notes", note);
  return note;
}

export async function deleteNote(id: string): Promise<void> {
  const db = await getDB();
  await db.delete("notes", id);
}

