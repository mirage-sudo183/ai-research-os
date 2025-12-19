// PDF storage layer - caching PDFs and scroll positions in IndexedDB

import { openDB, DBSchema, IDBPDatabase } from "idb";

interface PdfCacheDB extends DBSchema {
  pdfs: {
    key: string; // paper ID
    value: {
      paperId: string;
      pdfData: ArrayBuffer;
      cachedAt: number;
      fileSize: number;
    };
  };
  scrollPositions: {
    key: string; // paper ID
    value: {
      paperId: string;
      scrollTop: number;
      currentPage: number;
      zoom: number;
      updatedAt: number;
    };
  };
}

const DB_NAME = "ai-research-os-pdf";
const DB_VERSION = 1;

let dbInstance: IDBPDatabase<PdfCacheDB> | null = null;

async function getPdfDB(): Promise<IDBPDatabase<PdfCacheDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<PdfCacheDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("pdfs")) {
        db.createObjectStore("pdfs", { keyPath: "paperId" });
      }
      if (!db.objectStoreNames.contains("scrollPositions")) {
        db.createObjectStore("scrollPositions", { keyPath: "paperId" });
      }
    },
  });

  return dbInstance;
}

// ============================================
// PDF Cache Operations
// ============================================

export async function getCachedPdf(paperId: string): Promise<ArrayBuffer | null> {
  try {
    const db = await getPdfDB();
    const cached = await db.get("pdfs", paperId);
    return cached?.pdfData || null;
  } catch (error) {
    console.error("[PDF Cache] Error getting cached PDF:", error);
    return null;
  }
}

export async function cachePdf(paperId: string, pdfData: ArrayBuffer): Promise<void> {
  try {
    const db = await getPdfDB();
    await db.put("pdfs", {
      paperId,
      pdfData,
      cachedAt: Date.now(),
      fileSize: pdfData.byteLength,
    });
    console.log(`[PDF Cache] Cached PDF for ${paperId} (${(pdfData.byteLength / 1024 / 1024).toFixed(2)} MB)`);
  } catch (error) {
    console.error("[PDF Cache] Error caching PDF:", error);
  }
}

export async function isPdfCached(paperId: string): Promise<boolean> {
  try {
    const db = await getPdfDB();
    const cached = await db.get("pdfs", paperId);
    return !!cached;
  } catch {
    return false;
  }
}

export async function deleteCachedPdf(paperId: string): Promise<void> {
  try {
    const db = await getPdfDB();
    await db.delete("pdfs", paperId);
  } catch (error) {
    console.error("[PDF Cache] Error deleting cached PDF:", error);
  }
}

export async function getCacheStats(): Promise<{ count: number; totalSize: number }> {
  try {
    const db = await getPdfDB();
    const all = await db.getAll("pdfs");
    return {
      count: all.length,
      totalSize: all.reduce((sum, item) => sum + item.fileSize, 0),
    };
  } catch {
    return { count: 0, totalSize: 0 };
  }
}

// ============================================
// Scroll Position Operations
// ============================================

export interface ScrollPosition {
  scrollTop: number;
  currentPage: number;
  zoom: number;
}

export async function getScrollPosition(paperId: string): Promise<ScrollPosition | null> {
  try {
    const db = await getPdfDB();
    const saved = await db.get("scrollPositions", paperId);
    if (saved) {
      return {
        scrollTop: saved.scrollTop,
        currentPage: saved.currentPage,
        zoom: saved.zoom,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export async function saveScrollPosition(
  paperId: string,
  position: ScrollPosition
): Promise<void> {
  try {
    const db = await getPdfDB();
    await db.put("scrollPositions", {
      paperId,
      ...position,
      updatedAt: Date.now(),
    });
  } catch (error) {
    console.error("[PDF Cache] Error saving scroll position:", error);
  }
}

// ============================================
// PDF Fetching
// ============================================

export async function fetchAndCachePdf(
  paperId: string,
  pdfUrl: string,
  onProgress?: (loaded: number, total: number) => void
): Promise<ArrayBuffer> {
  // Check cache first
  const cached = await getCachedPdf(paperId);
  if (cached) {
    console.log(`[PDF Cache] Using cached PDF for ${paperId}`);
    return cached;
  }

  // Fetch from URL
  console.log(`[PDF Cache] Fetching PDF from ${pdfUrl}`);
  
  const response = await fetch(pdfUrl);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch PDF: ${response.status}`);
  }

  const contentLength = response.headers.get("content-length");
  const total = contentLength ? parseInt(contentLength, 10) : 0;

  if (!response.body) {
    throw new Error("No response body");
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let loaded = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    chunks.push(value);
    loaded += value.length;
    
    if (onProgress && total > 0) {
      onProgress(loaded, total);
    }
  }

  // Combine chunks into single ArrayBuffer
  const pdfData = new Uint8Array(loaded);
  let offset = 0;
  for (const chunk of chunks) {
    pdfData.set(chunk, offset);
    offset += chunk.length;
  }

  // Cache the PDF
  await cachePdf(paperId, pdfData.buffer);

  return pdfData.buffer;
}

