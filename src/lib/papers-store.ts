// Papers feed store - manages state for arXiv papers feed

import { create } from "zustand";
import type { ArxivFeedParams, ResearchItem, ArxivApiResponse } from "./types";
import { DEFAULT_CATEGORIES, getArxivCacheKey } from "./arxiv";
import * as storage from "./storage";

const AUTO_REFRESH_INTERVAL = 15 * 60 * 1000; // 15 minutes

type ViewMode = "feed" | "reading-list";

interface PapersFeedState {
  // Data
  papers: ResearchItem[];
  filteredPapers: ResearchItem[];
  readingListPapers: ResearchItem[];
  
  // View mode
  viewMode: ViewMode;
  
  // Feed params
  categories: string[];
  keywords: string;
  localFilter: string;
  
  // Status
  isLoading: boolean;
  isFetching: boolean;
  error: string | null;
  lastRefresh: string | null;
  isOnline: boolean;
  
  // Selected item
  selectedPaperId: string | null;
  
  // Actions
  setViewMode: (mode: ViewMode) => void;
  setCategories: (categories: string[]) => void;
  setKeywords: (keywords: string) => void;
  setLocalFilter: (filter: string) => void;
  setSelectedPaper: (id: string | null) => void;
  
  loadCachedFeed: () => Promise<void>;
  loadReadingList: () => Promise<void>;
  fetchFeed: () => Promise<void>;
  refreshFeed: () => Promise<void>;
  
  toggleReadingList: (paperId: string) => Promise<void>;
  updatePaperStatus: (paperId: string, status: ResearchItem["status"]) => Promise<void>;
  
  // Internal
  _applyLocalFilter: () => void;
  _startAutoRefresh: () => void;
  _stopAutoRefresh: () => void;
}

// Internal state for auto-refresh
let autoRefreshTimer: NodeJS.Timeout | null = null;

export const usePapersFeed = create<PapersFeedState>((set, get) => ({
  // Initial state
  papers: [],
  filteredPapers: [],
  readingListPapers: [],
  viewMode: "feed",
  categories: DEFAULT_CATEGORIES,
  keywords: "",
  localFilter: "",
  isLoading: true,
  isFetching: false,
  error: null,
  lastRefresh: null,
  isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
  selectedPaperId: null,

  setViewMode: (mode) => {
    set({ viewMode: mode, selectedPaperId: null, localFilter: "" });
    if (mode === "reading-list") {
      get().loadReadingList();
    } else {
      // Switching back to feed - re-apply filter to show feed papers
      const { papers } = get();
      set({ filteredPapers: papers });
    }
  },

  setCategories: (categories) => {
    set({ categories });
    // Don't auto-fetch here, let the component handle debounced refresh
  },

  setKeywords: (keywords) => {
    set({ keywords });
    // Don't auto-fetch here, let the component handle debounced refresh
  },

  setLocalFilter: (filter) => {
    set({ localFilter: filter });
    get()._applyLocalFilter();
  },

  setSelectedPaper: (id) => {
    set({ selectedPaperId: id });
  },

  _applyLocalFilter: () => {
    const { papers, readingListPapers, viewMode, localFilter } = get();
    const sourceList = viewMode === "reading-list" ? readingListPapers : papers;
    
    if (!localFilter.trim()) {
      set({ filteredPapers: sourceList });
      return;
    }

    const query = localFilter.toLowerCase();
    const filtered = sourceList.filter((paper) => {
      const titleMatch = paper.title.toLowerCase().includes(query);
      const abstractMatch = paper.abstract?.toLowerCase().includes(query);
      const authorMatch = paper.authors?.some((a) =>
        a.toLowerCase().includes(query)
      );
      return titleMatch || abstractMatch || authorMatch;
    });
    set({ filteredPapers: filtered });
  },

  loadCachedFeed: async () => {
    const { categories, keywords, viewMode } = get();
    const params: ArxivFeedParams = { categories, keywords };

    try {
      set({ isLoading: true, error: null });
      
      const cached = await storage.getPapersFeed(params);
      const lastRefresh = await storage.getLastRefresh(params);
      
      set({
        papers: cached,
        filteredPapers: viewMode === "feed" ? cached : get().filteredPapers,
        lastRefresh,
        isLoading: false,
      });
    } catch (error) {
      console.error("[PapersFeed] Failed to load cache:", error);
      set({ isLoading: false, error: "Failed to load cached feed" });
    }
  },

  loadReadingList: async () => {
    try {
      set({ isLoading: true, error: null });
      
      const readingList = await storage.getReadingList();
      
      set({
        readingListPapers: readingList,
        filteredPapers: readingList,
        isLoading: false,
      });
    } catch (error) {
      console.error("[PapersFeed] Failed to load reading list:", error);
      set({ isLoading: false, error: "Failed to load reading list" });
    }
  },

  fetchFeed: async () => {
    const { categories, keywords, isFetching, isOnline } = get();

    // Guard: don't fetch if already fetching
    if (isFetching) {
      console.log("[PapersFeed] Already fetching, skipping");
      return;
    }

    // Guard: don't fetch if offline
    if (!isOnline) {
      console.log("[PapersFeed] Offline, skipping fetch");
      set({ error: "You are offline. Showing cached results." });
      return;
    }

    // Guard: need at least one category
    if (categories.length === 0) {
      set({ error: "Please select at least one category" });
      return;
    }

    try {
      set({ isFetching: true, error: null });

      const params = new URLSearchParams({
        categories: categories.join(","),
        max_results: "50",
      });
      if (keywords.trim()) {
        params.set("keywords", keywords.trim());
      }

      const response = await fetch(`/api/arxiv?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data: ArxivApiResponse = await response.json();
      const now = new Date().toISOString();

      // Save to storage
      const feedParams: ArxivFeedParams = { categories, keywords };
      await storage.savePapersFeed(feedParams, data.papers);

      // Update state
      set({
        papers: data.papers,
        lastRefresh: now,
        isFetching: false,
      });
      
      // Re-apply local filter
      get()._applyLocalFilter();
    } catch (error) {
      console.error("[PapersFeed] Fetch error:", error);
      const message = error instanceof Error ? error.message : "Failed to fetch papers";
      set({ isFetching: false, error: message });
    }
  },

  refreshFeed: async () => {
    // First load cached, then fetch fresh
    await get().loadCachedFeed();
    await get().fetchFeed();
  },

  toggleReadingList: async (paperId) => {
    const { papers, readingListPapers, viewMode } = get();
    const sourceList = viewMode === "reading-list" ? readingListPapers : papers;
    const paper = sourceList.find((p) => p.id === paperId);
    if (!paper) return;

    const newValue = !paper.savedToReadingList;
    let updatedPaper: ResearchItem;
    
    try {
      // Try to update existing paper
      updatedPaper = await storage.updatePaper(paperId, {
        savedToReadingList: newValue,
      });
    } catch {
      // Paper doesn't exist in store yet, save it first
      updatedPaper = { ...paper, savedToReadingList: newValue, updatedAt: Date.now() };
      await storage.savePaper(updatedPaper);
    }
    
    // Update papers list
    set({
      papers: papers.map((p) => (p.id === paperId ? updatedPaper : p)),
    });
    
    // Update reading list
    if (newValue) {
      // Added to reading list
      set({
        readingListPapers: [updatedPaper, ...readingListPapers.filter((p) => p.id !== paperId)],
      });
    } else {
      // Removed from reading list
      set({
        readingListPapers: readingListPapers.filter((p) => p.id !== paperId),
      });
    }
    
    get()._applyLocalFilter();
  },

  updatePaperStatus: async (paperId, status) => {
    const { papers, readingListPapers, viewMode } = get();
    const sourceList = viewMode === "reading-list" ? readingListPapers : papers;
    const paper = sourceList.find((p) => p.id === paperId);
    if (!paper) return;

    let updatedPaper: ResearchItem;
    
    try {
      // Try to update existing paper
      updatedPaper = await storage.updatePaper(paperId, { status });
    } catch {
      // Paper doesn't exist in store yet, save it first
      updatedPaper = { ...paper, status, updatedAt: Date.now() };
      await storage.savePaper(updatedPaper);
    }
    
    // Update both papers list and reading list
    set({
      papers: papers.map((p) => (p.id === paperId ? updatedPaper : p)),
      readingListPapers: readingListPapers.map((p) => (p.id === paperId ? updatedPaper : p)),
    });
    
    get()._applyLocalFilter();
  },

  _startAutoRefresh: () => {
    if (autoRefreshTimer) return;

    autoRefreshTimer = setInterval(() => {
      const { lastRefresh, isOnline, isFetching } = get();
      
      // Only refresh if conditions are met
      if (!isOnline || isFetching) return;
      
      if (lastRefresh) {
        const timeSinceRefresh = Date.now() - new Date(lastRefresh).getTime();
        if (timeSinceRefresh < AUTO_REFRESH_INTERVAL) return;
      }
      
      console.log("[PapersFeed] Auto-refreshing...");
      get().fetchFeed();
    }, AUTO_REFRESH_INTERVAL);
  },

  _stopAutoRefresh: () => {
    if (autoRefreshTimer) {
      clearInterval(autoRefreshTimer);
      autoRefreshTimer = null;
    }
  },
}));

// Listen for online/offline events
if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    usePapersFeed.setState({ isOnline: true, error: null });
  });

  window.addEventListener("offline", () => {
    usePapersFeed.setState({ 
      isOnline: false, 
      error: "You are offline. Showing cached results." 
    });
  });
}

