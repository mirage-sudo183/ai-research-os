// arXiv API helpers - query building and response normalization

import type { ArxivFeedParams, ResearchItem } from "./types";

/**
 * Build arXiv API search query string from parameters
 */
export function buildArxivQuery(params: ArxivFeedParams): string {
  const parts: string[] = [];

  // Categories
  if (params.categories.length > 0) {
    const catQuery = params.categories.map((c) => `cat:${c}`).join(" OR ");
    parts.push(params.categories.length > 1 ? `(${catQuery})` : catQuery);
  }

  // Keywords
  if (params.keywords && params.keywords.trim()) {
    const keywords = params.keywords.trim();
    // Split by comma or space, wrap phrases in quotes if needed
    const keywordTerms = keywords
      .split(/[,]/)
      .map((k) => k.trim())
      .filter(Boolean)
      .map((k) => {
        // If contains space, wrap in quotes for phrase search
        if (k.includes(" ")) {
          return `all:"${k}"`;
        }
        return `all:${k}`;
      });

    if (keywordTerms.length > 0) {
      const kwQuery = keywordTerms.join(" OR ");
      parts.push(keywordTerms.length > 1 ? `(${kwQuery})` : kwQuery);
    }
  }

  // Combine with AND
  return parts.join(" AND ");
}

/**
 * Build full arXiv API URL
 */
export function buildArxivUrl(params: ArxivFeedParams): string {
  const baseUrl = "https://export.arxiv.org/api/query";
  const searchQuery = buildArxivQuery(params);
  const maxResults = params.maxResults || 50;

  const urlParams = new URLSearchParams({
    search_query: searchQuery,
    start: "0",
    max_results: String(maxResults),
    sortBy: "submittedDate",
    sortOrder: "descending",
  });

  return `${baseUrl}?${urlParams.toString()}`;
}

/**
 * Extract arXiv ID from URL
 * e.g., "http://arxiv.org/abs/2312.12345v1" -> "2312.12345v1"
 */
export function extractArxivId(url: string): string {
  const match = url.match(/arxiv\.org\/abs\/([^\s?]+)/);
  return match ? match[1] : url;
}

/**
 * Generate PDF URL from arXiv ID or abs URL
 */
export function getPdfUrl(absUrl: string): string {
  return absUrl.replace("/abs/", "/pdf/") + ".pdf";
}

/**
 * Clean text (remove excess whitespace/newlines)
 */
export function cleanText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

/**
 * Generate a cache key for feed params
 */
export function getArxivCacheKey(params: ArxivFeedParams): string {
  const cats = [...params.categories].sort().join(",");
  const kw = params.keywords?.trim().toLowerCase() || "";
  return `arxiv:${cats}:${kw}`;
}

// Default categories for the papers feed
export const DEFAULT_CATEGORIES = ["cs.AI", "cs.LG", "cs.CL"];

// Available categories for selection
export const AVAILABLE_CATEGORIES = [
  { id: "cs.AI", label: "Artificial Intelligence" },
  { id: "cs.LG", label: "Machine Learning" },
  { id: "cs.CL", label: "Computation and Language" },
  { id: "cs.RO", label: "Robotics" },
  { id: "cs.SE", label: "Software Engineering" },
  { id: "cs.CV", label: "Computer Vision" },
  { id: "cs.NE", label: "Neural and Evolutionary Computing" },
  { id: "stat.ML", label: "Machine Learning (Stats)" },
];

