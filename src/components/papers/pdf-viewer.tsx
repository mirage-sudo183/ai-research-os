"use client";

import { useEffect, useState, useRef } from "react";
import {
  Download,
  ExternalLink,
  Loader2,
  AlertCircle,
  CheckCircle2,
  WifiOff,
  Maximize2,
} from "lucide-react";
import * as pdfStorage from "@/lib/pdf-storage";

interface PdfViewerProps {
  paperId: string;
  pdfUrl: string;
  title: string;
}

type LoadingState = "idle" | "loading" | "loaded" | "error" | "offline";

export function PdfViewer({ paperId, pdfUrl, title }: PdfViewerProps) {
  const [loadingState, setLoadingState] = useState<LoadingState>("idle");
  const [loadProgress, setLoadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isCached, setIsCached] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Load PDF
  useEffect(() => {
    let cancelled = false;
    let currentBlobUrl: string | null = null;

    const loadPdf = async () => {
      if (!pdfUrl) return;

      setLoadingState("loading");
      setLoadProgress(0);
      setError(null);

      try {
        // Check if cached
        const cached = await pdfStorage.isPdfCached(paperId);
        setIsCached(cached);

        // Check if online
        if (!navigator.onLine && !cached) {
          setLoadingState("offline");
          setError("You are offline and this PDF is not cached");
          return;
        }

        // Fetch PDF (from cache or network via proxy)
        const proxyUrl = `/api/pdf?url=${encodeURIComponent(pdfUrl)}`;
        const pdfData = await pdfStorage.fetchAndCachePdf(
          paperId,
          proxyUrl,
          (loaded, total) => {
            if (!cancelled) {
              setLoadProgress(Math.round((loaded / total) * 100));
            }
          }
        );

        if (cancelled) return;

        // Create blob URL for iframe
        const blob = new Blob([pdfData], { type: "application/pdf" });
        currentBlobUrl = URL.createObjectURL(blob);
        
        setBlobUrl(currentBlobUrl);
        setIsCached(true);
        setLoadingState("loaded");
      } catch (err) {
        if (cancelled) return;
        console.error("[PDF Viewer] Error loading PDF:", err);
        setError(err instanceof Error ? err.message : "Failed to load PDF");
        setLoadingState("error");
      }
    };

    loadPdf();

    return () => {
      cancelled = true;
      // Cleanup blob URL
      if (currentBlobUrl) {
        URL.revokeObjectURL(currentBlobUrl);
      }
    };
  }, [paperId, pdfUrl]);

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [blobUrl]);

  // Download PDF
  const handleDownload = () => {
    window.open(pdfUrl, "_blank");
  };

  // Open in new tab (full screen)
  const handleOpenFullscreen = () => {
    if (blobUrl) {
      window.open(blobUrl, "_blank");
    } else {
      window.open(pdfUrl, "_blank");
    }
  };

  // Render loading state
  if (loadingState === "idle" || loadingState === "loading") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
        <div className="text-center">
          <p className="text-sm font-medium text-text-primary mb-1">
            Loading PDF...
          </p>
          {loadProgress > 0 && (
            <p className="text-xs text-text-secondary">{loadProgress}%</p>
          )}
        </div>
        {loadProgress > 0 && (
          <div className="w-48 h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
            <div
              className="h-full bg-accent transition-all duration-200"
              style={{ width: `${loadProgress}%` }}
            />
          </div>
        )}
      </div>
    );
  }

  // Render error state
  if (loadingState === "error" || loadingState === "offline") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8">
        {loadingState === "offline" ? (
          <WifiOff className="w-8 h-8 text-yellow-500" />
        ) : (
          <AlertCircle className="w-8 h-8 text-red-500" />
        )}
        <div className="text-center">
          <p className="text-sm font-medium text-text-primary mb-1">
            {loadingState === "offline" ? "Offline" : "Failed to load PDF"}
          </p>
          <p className="text-xs text-text-secondary max-w-xs">{error}</p>
        </div>
        <button onClick={handleDownload} className="btn btn-secondary text-sm">
          <Download className="w-4 h-4" />
          Open in new tab
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-bg-secondary shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-sm text-text-secondary truncate max-w-[300px]">
            {title}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* Cached indicator */}
          {isCached && (
            <div className="flex items-center gap-1 px-2 py-1 text-xs text-green-500 bg-green-500/10 rounded mr-2">
              <CheckCircle2 className="w-3 h-3" />
              <span>Cached</span>
            </div>
          )}

          {/* Open fullscreen */}
          <button
            onClick={handleOpenFullscreen}
            className="p-1.5 rounded text-text-secondary hover:text-text-primary hover:bg-surface-hover"
            title="Open in new tab"
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          {/* Download */}
          <button
            onClick={handleDownload}
            className="p-1.5 rounded text-text-secondary hover:text-text-primary hover:bg-surface-hover"
            title="Download PDF"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* PDF iframe */}
      <div className="flex-1 overflow-hidden bg-bg-tertiary">
        {blobUrl && (
          <iframe
            ref={iframeRef}
            src={blobUrl}
            className="w-full h-full border-0"
            title={title}
          />
        )}
      </div>
    </div>
  );
}
