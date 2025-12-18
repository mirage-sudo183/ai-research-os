// Core types for AI Research OS

export type ItemType = "paper" | "writing";
export type ReadStatus = "unread" | "skimmed" | "read" | "deep";

export interface ResearchItem {
  id: string;
  type: ItemType;
  title: string;
  url: string | null;
  createdAt: number;
  updatedAt: number;
  
  // Paper-specific fields (optional)
  authors?: string[];
  abstract?: string;
  publishedAt?: string; // ISO date
  arxivUpdatedAt?: string; // ISO date
  pdfUrl?: string;
  primaryCategory?: string;
  categories?: string[];
  arxivId?: string;
  
  // User state
  status?: ReadStatus;
  savedToReadingList?: boolean;
  notes?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: number;
  updatedAt: number;
}

export interface Note {
  id: string;
  projectId: string | null;
  paperId: string | null;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

// arXiv feed parameters
export interface ArxivFeedParams {
  categories: string[];
  keywords?: string;
  maxResults?: number;
}

// arXiv API response (normalized)
export interface ArxivApiResponse {
  papers: ResearchItem[];
  totalResults: number;
  startIndex: number;
  itemsPerPage: number;
}

// Feed cache metadata
export interface FeedCacheMeta {
  params: ArxivFeedParams;
  lastRefresh: string; // ISO date
  totalResults: number;
}

