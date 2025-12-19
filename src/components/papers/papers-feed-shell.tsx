"use client";

import { useEffect, useCallback, useRef } from "react";
import { usePapersFeed } from "@/lib/papers-store";
import { PapersSidebar } from "./papers-sidebar";
import { PapersListPane } from "./papers-list-pane";
import { PaperReaderPane } from "./paper-reader-pane";
import { OfflineBanner } from "./offline-banner";

export function PapersFeedShell() {
  const {
    isLoading,
    isOnline,
    loadCachedFeed,
    loadReadingList,
    fetchFeed,
    _startAutoRefresh,
    _stopAutoRefresh,
  } = usePapersFeed();

  const hasInitialized = useRef(false);

  // Initialize: load cache then fetch fresh
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const init = async () => {
      // Load both feed and reading list
      await Promise.all([loadCachedFeed(), loadReadingList()]);
      if (navigator.onLine) {
        await fetchFeed();
      }
    };
    init();

    // Start auto-refresh
    _startAutoRefresh();

    return () => {
      _stopAutoRefresh();
    };
  }, [loadCachedFeed, loadReadingList, fetchFeed, _startAutoRefresh, _stopAutoRefresh]);

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-bg-primary">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-text-secondary text-sm">Loading papers feed...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-bg-primary">
      {!isOnline && <OfflineBanner />}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <PapersSidebar />

        {/* List Pane */}
        <PapersListPane />

        {/* Reader Pane */}
        <PaperReaderPane />
      </div>
    </div>
  );
}

