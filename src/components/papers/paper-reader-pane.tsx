"use client";

import { useMemo, useState, useEffect } from "react";
import { clsx } from "clsx";
import {
  FileText,
  ExternalLink,
  Bookmark,
  BookmarkCheck,
  Check,
  ChevronDown,
  BookOpen,
  Info,
} from "lucide-react";
import { usePapersFeed } from "@/lib/papers-store";
import { PdfViewer } from "./pdf-viewer";
import type { ReadStatus } from "@/lib/types";

const STATUS_OPTIONS: { value: ReadStatus; label: string; color: string }[] = [
  { value: "unread", label: "Unread", color: "text-text-secondary" },
  { value: "skimmed", label: "Skimmed", color: "text-yellow-500" },
  { value: "read", label: "Read", color: "text-green-500" },
  { value: "deep", label: "Deep Read", color: "text-purple-500" },
];

type ReaderView = "info" | "pdf";

export function PaperReaderPane() {
  const {
    papers,
    readingListPapers,
    viewMode,
    selectedPaperId,
    toggleReadingList,
    updatePaperStatus,
  } = usePapersFeed();

  const [readerView, setReaderView] = useState<ReaderView>("info");

  const selectedPaper = useMemo(() => {
    if (!selectedPaperId) return null;
    const sourceList = viewMode === "reading-list" ? readingListPapers : papers;
    return sourceList.find((p) => p.id === selectedPaperId) || null;
  }, [papers, readingListPapers, viewMode, selectedPaperId]);

  // Reset to info view when paper changes
  useEffect(() => {
    setReaderView("info");
  }, [selectedPaperId]);

  if (!selectedPaper) {
    return <EmptyReaderState />;
  }

  const hasPdf = !!selectedPaper.pdfUrl;

  return (
    <div className="flex-1 h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center p-1 bg-bg-secondary rounded-lg">
            <button
              onClick={() => setReaderView("info")}
              className={clsx(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                readerView === "info"
                  ? "bg-bg-elevated text-text-primary shadow-sm"
                  : "text-text-tertiary hover:text-text-secondary"
              )}
            >
              <Info className="w-4 h-4" />
              <span className="hidden sm:inline">Info</span>
            </button>
            <button
              onClick={() => setReaderView("pdf")}
              disabled={!hasPdf}
              className={clsx(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                readerView === "pdf"
                  ? "bg-bg-elevated text-text-primary shadow-sm"
                  : "text-text-tertiary hover:text-text-secondary",
                !hasPdf && "opacity-50 cursor-not-allowed"
              )}
            >
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">PDF</span>
            </button>
          </div>

          {/* Paper ID */}
          <div className="hidden md:flex items-center gap-2 ml-2">
            {selectedPaper.primaryCategory && (
              <span className="px-2 py-0.5 text-xs font-medium bg-accent-subtle text-accent rounded">
                {selectedPaper.primaryCategory}
              </span>
            )}
            <span className="text-xs text-text-tertiary">
              {selectedPaper.arxivId}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Status dropdown */}
          <StatusDropdown
            status={selectedPaper.status || "unread"}
            onChange={(status) => updatePaperStatus(selectedPaper.id, status)}
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
      {readerView === "info" ? (
        <InfoView
          paper={selectedPaper}
          onReadPdf={() => setReaderView("pdf")}
        />
      ) : (
        <PdfViewer
          paperId={selectedPaper.id}
          pdfUrl={selectedPaper.pdfUrl!}
          title={selectedPaper.title}
        />
      )}
    </div>
  );
}

function InfoView({
  paper,
  onReadPdf,
}: {
  paper: NonNullable<ReturnType<typeof usePapersFeed>["papers"][0]>;
  onReadPdf: () => void;
}) {
  const publishedDate = paper.publishedAt
    ? new Date(paper.publishedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Title */}
        <h1 className="text-2xl font-semibold text-text-primary leading-tight">
          {paper.title}
        </h1>

        {/* Authors */}
        {paper.authors && paper.authors.length > 0 && (
          <p className="text-sm text-text-secondary">{paper.authors.join(", ")}</p>
        )}

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-3 text-sm">
          {publishedDate && (
            <span className="text-text-tertiary">Published {publishedDate}</span>
          )}
          {paper.categories && paper.categories.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {paper.categories.map((cat) => (
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
          {paper.pdfUrl && (
            <button onClick={onReadPdf} className="btn btn-primary">
              <BookOpen className="w-4 h-4" />
              Read PDF
            </button>
          )}
          {paper.url && (
            <a
              href={paper.url}
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
        {paper.abstract && (
          <div className="card">
            <h3 className="text-sm font-medium text-text-primary mb-3">Abstract</h3>
            <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
              {paper.abstract}
            </p>
          </div>
        )}
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
            {status === option.value && <Check className="w-3.5 h-3.5" />}
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
