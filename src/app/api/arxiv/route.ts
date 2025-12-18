import { NextRequest, NextResponse } from "next/server";
import { XMLParser } from "fast-xml-parser";
import {
  buildArxivUrl,
  extractArxivId,
  getPdfUrl,
  cleanText,
} from "@/lib/arxiv";
import type { ArxivFeedParams, ResearchItem, ArxivApiResponse } from "@/lib/types";

// XML Parser configuration
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
  isArray: (name) => {
    // These can be arrays
    return ["entry", "author", "link", "category"].includes(name);
  },
});

interface ArxivEntry {
  id: string;
  title: string;
  summary: string;
  published: string;
  updated: string;
  author?: Array<{ name: string }> | { name: string };
  link?: Array<{
    "@_href": string;
    "@_type"?: string;
    "@_title"?: string;
    "@_rel"?: string;
  }>;
  category?: Array<{
    "@_term": string;
    "@_scheme"?: string;
  }>;
  "arxiv:primary_category"?: {
    "@_term": string;
  };
}

interface ArxivFeed {
  feed: {
    entry?: ArxivEntry[];
    "opensearch:totalResults"?: { "#text": string } | string;
    "opensearch:startIndex"?: { "#text": string } | string;
    "opensearch:itemsPerPage"?: { "#text": string } | string;
  };
}

function normalizeEntry(entry: ArxivEntry): ResearchItem {
  // Extract authors
  const authors: string[] = [];
  if (entry.author) {
    const authorList = Array.isArray(entry.author) ? entry.author : [entry.author];
    authorList.forEach((a) => {
      if (a.name) authors.push(a.name);
    });
  }

  // Extract PDF URL
  let pdfUrl: string | undefined;
  if (entry.link) {
    const pdfLink = entry.link.find(
      (l) => l["@_title"] === "pdf" || l["@_type"] === "application/pdf"
    );
    if (pdfLink) {
      pdfUrl = pdfLink["@_href"];
    }
  }
  // Fallback: derive from abs URL
  if (!pdfUrl && entry.id) {
    pdfUrl = getPdfUrl(entry.id);
  }

  // Extract categories
  const categories: string[] = [];
  if (entry.category) {
    entry.category.forEach((c) => {
      if (c["@_term"]) {
        categories.push(c["@_term"]);
      }
    });
  }

  // Primary category
  const primaryCategory =
    entry["arxiv:primary_category"]?.["@_term"] || categories[0] || undefined;

  // arXiv ID
  const arxivId = extractArxivId(entry.id);

  const now = Date.now();

  return {
    id: `arxiv:${arxivId}`,
    type: "paper",
    title: cleanText(entry.title),
    url: entry.id,
    createdAt: now,
    updatedAt: now,
    authors,
    abstract: cleanText(entry.summary),
    publishedAt: entry.published,
    arxivUpdatedAt: entry.updated,
    pdfUrl,
    primaryCategory,
    categories,
    arxivId,
    status: "unread",
    savedToReadingList: false,
  };
}

function extractNumber(value: { "#text": string } | string | undefined): number {
  if (!value) return 0;
  if (typeof value === "string") return parseInt(value, 10) || 0;
  return parseInt(value["#text"], 10) || 0;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Parse parameters
    const categoriesParam = searchParams.get("categories");
    const keywords = searchParams.get("keywords") || undefined;
    const maxResultsParam = searchParams.get("max_results");

    if (!categoriesParam) {
      return NextResponse.json(
        { error: "categories parameter is required" },
        { status: 400 }
      );
    }

    const categories = categoriesParam.split(",").filter(Boolean);
    const maxResults = maxResultsParam ? parseInt(maxResultsParam, 10) : 50;

    const params: ArxivFeedParams = {
      categories,
      keywords,
      maxResults,
    };

    // Build URL and fetch
    const url = buildArxivUrl(params);
    console.log("[arXiv API] Fetching:", url);

    const response = await fetch(url, {
      headers: {
        "User-Agent": "AI-Research-OS/1.0 (research tool)",
      },
      // Cache for 5 minutes on server
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      console.error("[arXiv API] HTTP Error:", response.status);
      return NextResponse.json(
        { error: `arXiv API returned ${response.status}` },
        { status: response.status }
      );
    }

    const xml = await response.text();

    // Parse XML
    const parsed = parser.parse(xml) as ArxivFeed;

    if (!parsed.feed) {
      return NextResponse.json(
        { error: "Invalid response from arXiv API" },
        { status: 500 }
      );
    }

    // Normalize entries
    const entries = parsed.feed.entry || [];
    const papers = entries.map(normalizeEntry);

    const result: ArxivApiResponse = {
      papers,
      totalResults: extractNumber(parsed.feed["opensearch:totalResults"]),
      startIndex: extractNumber(parsed.feed["opensearch:startIndex"]),
      itemsPerPage: extractNumber(parsed.feed["opensearch:itemsPerPage"]),
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("[arXiv API] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch from arXiv" },
      { status: 500 }
    );
  }
}

