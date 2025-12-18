"use client";

import { useMemo } from "react";
import { clsx } from "clsx";
import {
  FileText,
  ExternalLink,
  FileDown,
  Bookmark,
  BookmarkCheck,
  Check,
  ChevronDown,
} from "lucide-react";
import { usePapersFeed } from "@/lib/papers-store";
import type { ReadStatus } from "@/lib/types";

const STATUS_OPTIONS: { value: ReadStatus; label: string; color: string }[] = [
  { value: "unread", label: "Unread", color: "text-text-secondary" },
  { value: "skimmed", label: "Skimmed", color: "text-yellow-500" },
  { value: "read", label: "Read", color: "text-green-500" },
  { value: "deep", label: "Deep Read", color: "text-purple-500" },
];

export function PaperReaderPane() {
  const {
    papers,
    selectedPaperId,
    toggleReadingList,
    updatePaperStatus,
  } = usePapersFeed();

  const selectedPaper = useMemo(() => {
    if (!selectedPaperId) return null;
    return papers.find((p) => p.id === selectedPaperId) || null;
  }, [papers, selectedPaperId]);

  if (!selectedPaper) {
    return <EmptyReaderState />;
  }

  const publishedDate = selectedPaper.publishedAt
    ? new Date(selectedPaper.publishedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <div className="flex-1 h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="h-14 flex items-center justify-between px-6 border-b border-border shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          {selectedPaper.primaryCategory && (
            <span className="px-2 py-1 text-xs font-medium bg-accent-subtle text-accent rounded shrink-0">
              {selectedPaper.primaryCategory}
            </span>
          )}
          <span className="text-sm text-text-secondary truncate">
            {selectedPaper.arxivId}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* Status dropdown */}
          <StatusDropdown
            status={selectedPaper.status || "unread"}
            onChange={(status) =>
              updatePaperStatus(selectedPaper.id, status)
            }
          />
          {/* Save to reading list */}
          <button
            onClick={() => toggleReadingList(selectedPaper.id)}
            className={clsx(
              "p-2 rounded-lg transition-colors",
              selectedPaper.savedToReadingList
                ? "text-accent bg-accent-subtle"
                : "text-text-secondary hover:text-text-primary hover:bg-surface-hover"
            )}
            title={
              selectedPaper.savedToReadingList
                ? "Remove from reading list"
                : "Save to reading list"
            }
          >
            {selectedPaper.savedToReadingList ? (
              <BookmarkCheck className="w-4 h-4" />
            ) : (
              <Bookmark className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Title */}
          <h1 className="text-2xl font-semibold text-text-primary leading-tight">
            {selectedPaper.title}
          </h1>

          {/* Authors */}
          {selectedPaper.authors && selectedPaper.authors.length > 0 && (
            <p className="text-sm text-text-secondary">
              {selectedPaper.authors.join(", ")}
            </p>
          )}

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-3 text-sm">
            {publishedDate && (
              <span className="text-text-tertiary">
                Published {publishedDate}
              </span>
            )}
            {selectedPaper.categories && selectedPaper.categories.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {selectedPaper.categories.map((cat) => (
                  <span
                    key={cat}
                    className="px-2 py-0.5 text-xs bg-bg-tertiary text-text-secondary rounded"
                  >
                    {cat}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3">
            {selectedPaper.pdfUrl && (
              <a
                href={selectedPaper.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
              >
                <FileDown className="w-4 h-4" />
                Open PDF
              </a>
            )}
            {selectedPaper.url && (
              <a
                href={selectedPaper.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary"
              >
                <ExternalLink className="w-4 h-4" />
                Open arXiv
              </a>
            )}
          </div>

          {/* Abstract */}
          {selectedPaper.abstract && (
            <div className="card">
              <h3 className="text-sm font-medium text-text-primary mb-3">
                Abstract
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
                {selectedPaper.abstract}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusDropdown({
  status,
  onChange,
}: {
  status: ReadStatus;
  onChange: (status: ReadStatus) => void;
}) {
  const currentOption = STATUS_OPTIONS.find((o) => o.value === status);

  return (
    <div className="relative group">
      <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm bg-bg-secondary hover:bg-surface-hover transition-colors">
        <span className={currentOption?.color}>{currentOption?.label}</span>
        <ChevronDown className="w-3.5 h-3.5 text-text-tertiary" />
      </button>
      <div className="absolute z-10 top-full right-0 mt-1 py-1 bg-bg-elevated border border-border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all min-w-[120px]">
        {STATUS_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={clsx(
              "w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-surface-hover transition-colors",
              option.color
            )}
          >
            {status === option.value && (
              <Check className="w-3.5 h-3.5" />
            )}
            <span className={status !== option.value ? "ml-5" : ""}>
              {option.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function EmptyReaderState() {
  return (
    <div className="flex-1 h-full flex flex-col items-center justify-center text-center p-6">
      <div className="w-16 h-16 rounded-2xl bg-bg-tertiary flex items-center justify-center mb-6">
        <FileText className="w-8 h-8 text-text-tertiary" />
      </div>
      <h2 className="text-lg font-semibold text-text-primary mb-2">
        Select a paper
      </h2>
      <p className="text-sm text-text-secondary max-w-[280px]">
        Choose a paper from the list to read the abstract and details
      </p>
    </div>
  );
}

