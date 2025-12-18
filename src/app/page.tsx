"use client";

import Link from "next/link";
import { Rss, FolderKanban, FileText, ArrowRight } from "lucide-react";
import { useTheme } from "@/components/providers/theme-provider";

export default function Home() {
  const { resolvedTheme } = useTheme();

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center">
              <span className="text-white font-bold">AI</span>
            </div>
            <span className="font-semibold text-lg text-text-primary">
              Research OS
            </span>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="max-w-5xl mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-text-primary mb-4">
            Your AI Research Cockpit
          </h1>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto">
            Browse the latest papers from arXiv, organize your reading list, and track your research — all locally in your browser.
          </p>
        </div>

        {/* Feature cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-16">
          {/* Papers Feed - Primary CTA */}
          <Link
            href="/feeds/papers"
            className="group col-span-full p-8 rounded-2xl bg-gradient-to-br from-accent/10 via-accent/5 to-transparent border border-accent/20 hover:border-accent/40 transition-all"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center mb-4">
                  <Rss className="w-6 h-6 text-accent" />
                </div>
                <h2 className="text-xl font-semibold text-text-primary mb-2">
                  Papers Feed
                </h2>
                <p className="text-text-secondary mb-4 max-w-md">
                  Browse the latest AI research papers from arXiv. Filter by category, search by keywords, and save papers to your reading list.
                </p>
                <div className="flex items-center gap-2 text-accent font-medium">
                  <span>Open Papers Feed</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
              <div className="hidden sm:block text-right text-sm text-text-tertiary">
                <div className="px-3 py-1 rounded-full bg-accent/10 text-accent font-medium">
                  Live from arXiv
                </div>
              </div>
            </div>
          </Link>

          {/* Projects */}
          <div className="p-6 rounded-xl bg-bg-secondary border border-border">
            <div className="w-10 h-10 rounded-lg bg-bg-tertiary flex items-center justify-center mb-4">
              <FolderKanban className="w-5 h-5 text-text-secondary" />
            </div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              Projects
            </h3>
            <p className="text-sm text-text-secondary mb-4">
              Organize papers and notes into research projects.
            </p>
            <span className="text-xs text-text-tertiary">Coming in Stage 2</span>
          </div>

          {/* Notes */}
          <div className="p-6 rounded-xl bg-bg-secondary border border-border">
            <div className="w-10 h-10 rounded-lg bg-bg-tertiary flex items-center justify-center mb-4">
              <FileText className="w-5 h-5 text-text-secondary" />
            </div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              Notes
            </h3>
            <p className="text-sm text-text-secondary mb-4">
              Take notes on papers and link them to your projects.
            </p>
            <span className="text-xs text-text-tertiary">Coming in Stage 2</span>
          </div>
        </div>

        {/* Info */}
        <div className="text-center text-sm text-text-tertiary">
          <p>
            All data is stored locally in your browser using IndexedDB.
            <br />
            Nothing is sent to any server.
          </p>
        </div>
      </main>
    </div>
  );
}
