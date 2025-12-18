"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { clsx } from "clsx";
import {
  RefreshCw,
  Search,
  Filter,
  FileText,
  Check,
  ChevronDown,
  X,
} from "lucide-react";
import { usePapersFeed } from "@/lib/papers-store";
import { AVAILABLE_CATEGORIES } from "@/lib/arxiv";
import type { ResearchItem } from "@/lib/types";

export function PapersListPane() {
  const {
    filteredPapers,
    categories,
    keywords,
    localFilter,
    isFetching,
    lastRefresh,
    isOnline,
    selectedPaperId,
    setCategories,
    setKeywords,
    setLocalFilter,
    setSelectedPaper,
    fetchFeed,
  } = usePapersFeed();

  const [showCategoryFilter, setShowCategoryFilter] = useState(false);
  const categoryFilterRef = useRef<HTMLDivElement>(null);

  // Debounced keyword change
  const keywordTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const handleKeywordChange = useCallback(
    (value: string) => {
      setKeywords(value);
      if (keywordTimeoutRef.current) {
        clearTimeout(keywordTimeoutRef.current);
      }
      keywordTimeoutRef.current = setTimeout(() => {
        fetchFeed();
      }, 500);
    },
    [setKeywords, fetchFeed]
  );

  // Debounced category change
  const categoryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const handleCategoryToggle = useCallback(
    (categoryId: string) => {
      const newCategories = categories.includes(categoryId)
        ? categories.filter((c) => c !== categoryId)
        : [...categories, categoryId];
      setCategories(newCategories);
      
      if (categoryTimeoutRef.current) {
        clearTimeout(categoryTimeoutRef.current);
      }
      categoryTimeoutRef.current = setTimeout(() => {
        fetchFeed();
      }, 300);
    },
    [categories, setCategories, fetchFeed]
  );

  // Close category filter on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        categoryFilterRef.current &&
        !categoryFilterRef.current.contains(e.target as Node)
      ) {
        setShowCategoryFilter(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatLastRefresh = (isoDate: string | null) => {
    if (!isoDate) return "Never";
    const date = new Date(isoDate);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="w-80 lg:w-96 h-full flex flex-col bg-bg-primary border-r border-border shrink-0">
      {/* Header */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-border">
        <h2 className="font-semibold text-text-primary">Papers Feed</h2>
        <button
          onClick={() => fetchFeed()}
          disabled={isFetching || !isOnline}
          className={clsx(
            "p-2 rounded-lg transition-colors",
            isFetching || !isOnline
              ? "text-text-tertiary cursor-not-allowed"
              : "text-text-secondary hover:text-text-primary hover:bg-surface-hover"
          )}
          title={isOnline ? "Refresh feed" : "Offline"}
        >
          <RefreshCw
            className={clsx("w-4 h-4", isFetching && "animate-spin")}
          />
        </button>
      </div>

      {/* Controls */}
      <div className="p-3 space-y-3 border-b border-border-subtle">
        {/* Category filter */}
        <div className="relative" ref={categoryFilterRef}>
          <button
            onClick={() => setShowCategoryFilter(!showCategoryFilter)}
            className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-bg-secondary rounded-lg text-sm hover:bg-surface-hover transition-colors"
          >
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-text-tertiary" />
              <span className="text-text-secondary">
                {categories.length} categories
              </span>
            </div>
            <ChevronDown
              className={clsx(
                "w-4 h-4 text-text-tertiary transition-transform",
                showCategoryFilter && "rotate-180"
              )}
            />
          </button>

          {showCategoryFilter && (
            <div className="absolute z-20 top-full left-0 right-0 mt-1 p-2 bg-bg-elevated border border-border rounded-lg shadow-lg animate-fade-in">
              <div className="max-h-64 overflow-y-auto space-y-1">
                {AVAILABLE_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryToggle(cat.id)}
                    className={clsx(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                      categories.includes(cat.id)
                        ? "bg-accent-subtle text-accent"
                        : "text-text-secondary hover:bg-surface-hover"
                    )}
                  >
                    <div
                      className={clsx(
                        "w-4 h-4 rounded border flex items-center justify-center",
                        categories.includes(cat.id)
                          ? "bg-accent border-accent"
                          : "border-border"
                      )}
                    >
                      {categories.includes(cat.id) && (
                        <Check className="w-3 h-3 text-white" />
                      )}
                    </div>
                    <span className="flex-1 text-left">{cat.label}</span>
                    <span className="text-xs text-text-tertiary">{cat.id}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Keyword query */}
        <div className="flex items-center gap-2 px-3 py-2 bg-bg-secondary rounded-lg">
          <Search className="w-4 h-4 text-text-tertiary shrink-0" />
          <input
            type="text"
            value={keywords}
            onChange={(e) => handleKeywordChange(e.target.value)}
            placeholder="agent, multi-agent, tool use..."
            className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-tertiary outline-none"
          />
          {keywords && (
            <button
              onClick={() => handleKeywordChange("")}
              className="p-0.5 text-text-tertiary hover:text-text-secondary"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Local filter */}
        <div className="flex items-center gap-2 px-3 py-2 bg-bg-secondary rounded-lg">
          <Search className="w-4 h-4 text-accent shrink-0" />
          <input
            type="text"
            value={localFilter}
            onChange={(e) => setLocalFilter(e.target.value)}
            placeholder="Filter results..."
            className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-tertiary outline-none"
          />
          {localFilter && (
            <button
              onClick={() => setLocalFilter("")}
              className="p-0.5 text-text-tertiary hover:text-text-secondary"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Last updated */}
        <div className="flex items-center justify-between px-1 text-xs text-text-tertiary">
          <span>
            {filteredPapers.length} paper{filteredPapers.length !== 1 ? "s" : ""}
          </span>
          <span>Updated {formatLastRefresh(lastRefresh)}</span>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {filteredPapers.length === 0 ? (
          <EmptyPapersList />
        ) : (
          <div className="py-2">
            {filteredPapers.map((paper) => (
              <PaperListItem
                key={paper.id}
                paper={paper}
                isSelected={selectedPaperId === paper.id}
                onClick={() => setSelectedPaper(paper.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PaperListItem({
  paper,
  isSelected,
  onClick,
}: {
  paper: ResearchItem;
  isSelected: boolean;
  onClick: () => void;
}) {
  const authors = paper.authors || [];
  const authorText =
    authors.length > 2
      ? `${authors.slice(0, 2).join(", ")} +${authors.length - 2}`
      : authors.join(", ");

  const publishedDate = paper.publishedAt
    ? new Date(paper.publishedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : "";

  return (
    <button
      onClick={onClick}
      className={clsx(
        "w-full flex items-start gap-3 px-4 py-3 text-left transition-colors duration-150",
        isSelected ? "bg-surface-active" : "hover:bg-surface-hover"
      )}
    >
      <div
        className={clsx(
          "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
          isSelected
            ? "bg-accent text-white"
            : "bg-bg-tertiary text-text-secondary"
        )}
      >
        <FileText className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p
          className={clsx(
            "text-sm font-medium line-clamp-2",
            paper.status === "unread" ? "text-text-primary" : "text-text-secondary"
          )}
        >
          {paper.title}
        </p>
        {authorText && (
          <p className="text-xs text-text-tertiary mt-0.5 truncate">
            {authorText}
          </p>
        )}
        <div className="flex items-center gap-2 mt-1.5">
          {paper.primaryCategory && (
            <span className="px-1.5 py-0.5 text-2xs font-medium bg-accent-subtle text-accent rounded">
              {paper.primaryCategory}
            </span>
          )}
          {paper.status && paper.status !== "unread" && (
            <span
              className={clsx(
                "px-1.5 py-0.5 text-2xs font-medium rounded",
                paper.status === "read" && "bg-green-500/10 text-green-500",
                paper.status === "skimmed" && "bg-yellow-500/10 text-yellow-500",
                paper.status === "deep" && "bg-purple-500/10 text-purple-500"
              )}
            >
              {paper.status}
            </span>
          )}
          {publishedDate && (
            <span className="text-2xs text-text-tertiary ml-auto">
              {publishedDate}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

function EmptyPapersList() {
  const { isFetching, error, isOnline, fetchFeed } = usePapersFeed();

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 py-12 text-center">
      <div className="w-12 h-12 rounded-xl bg-bg-tertiary flex items-center justify-center mb-4">
        <FileText className="w-6 h-6 text-text-tertiary" />
      </div>
      {error ? (
        <>
          <h3 className="text-sm font-medium text-text-primary mb-1">
            Error loading papers
          </h3>
          <p className="text-xs text-text-tertiary mb-4 max-w-[200px]">
            {error}
          </p>
          {isOnline && (
            <button
              onClick={() => fetchFeed()}
              disabled={isFetching}
              className="btn btn-primary text-xs"
            >
              <RefreshCw
                className={clsx("w-4 h-4", isFetching && "animate-spin")}
              />
              Try again
            </button>
          )}
        </>
      ) : (
        <>
          <h3 className="text-sm font-medium text-text-primary mb-1">
            No papers found
          </h3>
          <p className="text-xs text-text-tertiary max-w-[200px]">
            Try adjusting your category or keyword filters
          </p>
        </>
      )}
    </div>
  );
}

