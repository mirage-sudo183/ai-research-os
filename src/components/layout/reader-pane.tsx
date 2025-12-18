"use client";

import { useMemo } from "react";
import { 
  FolderKanban, 
  FileText, 
  StickyNote, 
  Search,
  Settings,
  Trash2,
  ExternalLink,
  BookOpen,
} from "lucide-react";
import { useStorage } from "@/components/providers/storage-provider";
import type { NavSection } from "./app-shell";

interface ReaderPaneProps {
  activeSection: NavSection;
  selectedItemId: string | null;
}

export function ReaderPane({ activeSection, selectedItemId }: ReaderPaneProps) {
  const { projects, papers, deleteProject, deletePaper } = useStorage();

  const selectedItem = useMemo(() => {
    if (!selectedItemId) return null;
    if (activeSection === "projects") {
      return projects.find((p) => p.id === selectedItemId);
    }
    if (activeSection === "papers") {
      return papers.find((p) => p.id === selectedItemId);
    }
    return null;
  }, [activeSection, selectedItemId, projects, papers]);

  const handleDelete = async () => {
    if (!selectedItemId) return;
    if (activeSection === "projects") {
      await deleteProject(selectedItemId);
    } else if (activeSection === "papers") {
      await deletePaper(selectedItemId);
    }
  };

  // Special views for search and settings
  if (activeSection === "search") {
    return <SearchView />;
  }

  if (activeSection === "settings") {
    return <SettingsView />;
  }

  // Empty state when no item selected
  if (!selectedItem) {
    return <EmptyReaderState section={activeSection} />;
  }

  // Project detail
  if (activeSection === "projects" && "name" in selectedItem) {
    return (
      <div className="flex-1 h-full flex flex-col overflow-hidden">
        <ReaderHeader
          title={selectedItem.name}
          onDelete={handleDelete}
        />
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="card">
              <h3 className="text-sm font-medium text-text-primary mb-2">Description</h3>
              <p className="text-sm text-text-secondary">
                {selectedItem.description || "No description yet. Click to add one."}
              </p>
            </div>

            <div className="card">
              <h3 className="text-sm font-medium text-text-primary mb-4">Quick Stats</h3>
              <div className="grid grid-cols-3 gap-4">
                <StatCard label="Papers" value="0" />
                <StatCard label="Notes" value="0" />
                <StatCard label="Days Active" value={getDaysActive(selectedItem.createdAt)} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Paper detail
  if (activeSection === "papers" && "title" in selectedItem) {
    return (
      <div className="flex-1 h-full flex flex-col overflow-hidden">
        <ReaderHeader
          title={selectedItem.title}
          url={selectedItem.url}
          onDelete={handleDelete}
        />
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-3xl mx-auto space-y-6">
            {selectedItem.authors.length > 0 && (
              <p className="text-sm text-text-secondary">
                {selectedItem.authors.join(", ")}
              </p>
            )}

            {selectedItem.abstract && (
              <div className="card">
                <h3 className="text-sm font-medium text-text-primary mb-2">Abstract</h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {selectedItem.abstract}
                </p>
              </div>
            )}

            <div className="card">
              <h3 className="text-sm font-medium text-text-primary mb-2">Notes</h3>
              <p className="text-sm text-text-secondary">
                {selectedItem.notes || "No notes yet. Click to add your thoughts."}
              </p>
            </div>

            {selectedItem.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedItem.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 text-xs font-medium bg-bg-tertiary text-text-secondary rounded-md"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}

function ReaderHeader({
  title,
  url,
  onDelete,
}: {
  title: string;
  url?: string | null;
  onDelete: () => void;
}) {
  return (
    <div className="h-14 flex items-center justify-between px-6 border-b border-border shrink-0">
      <h1 className="text-lg font-semibold text-text-primary truncate">{title}</h1>
      <div className="flex items-center gap-2">
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-md text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
        <button
          onClick={onDelete}
          className="p-2 rounded-md text-text-secondary hover:text-red-500 hover:bg-red-500/10 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center p-4 bg-bg-secondary rounded-lg">
      <p className="text-2xl font-semibold text-text-primary">{value}</p>
      <p className="text-xs text-text-tertiary mt-1">{label}</p>
    </div>
  );
}

function EmptyReaderState({ section }: { section: NavSection }) {
  const config = {
    projects: {
      icon: FolderKanban,
      title: "Select a project",
      description: "Choose a project from the list to view details",
    },
    papers: {
      icon: FileText,
      title: "Select a paper",
      description: "Choose a paper from the list to read",
    },
    notes: {
      icon: StickyNote,
      title: "Select a note",
      description: "Choose a note from the list to edit",
    },
  }[section as "projects" | "papers" | "notes"];

  if (!config) return null;

  const Icon = config.icon;

  return (
    <div className="flex-1 h-full flex flex-col items-center justify-center text-center p-6">
      <div className="w-16 h-16 rounded-2xl bg-bg-tertiary flex items-center justify-center mb-6">
        <Icon className="w-8 h-8 text-text-tertiary" />
      </div>
      <h2 className="text-lg font-semibold text-text-primary mb-2">{config.title}</h2>
      <p className="text-sm text-text-secondary max-w-[280px]">{config.description}</p>
    </div>
  );
}

function SearchView() {
  return (
    <div className="flex-1 h-full flex flex-col">
      <div className="h-14 flex items-center px-6 border-b border-border">
        <h1 className="text-lg font-semibold text-text-primary">Search</h1>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
        <div className="w-16 h-16 rounded-2xl bg-bg-tertiary flex items-center justify-center mb-6">
          <Search className="w-8 h-8 text-text-tertiary" />
        </div>
        <h2 className="text-lg font-semibold text-text-primary mb-2">Search your research</h2>
        <p className="text-sm text-text-secondary max-w-[320px]">
          Quickly find papers, projects, and notes across your entire library
        </p>
        <div className="mt-6 w-full max-w-md">
          <div className="flex items-center gap-3 px-4 py-3 bg-bg-secondary border border-border rounded-xl">
            <Search className="w-5 h-5 text-text-tertiary" />
            <input
              type="text"
              placeholder="Search everything..."
              className="flex-1 bg-transparent text-text-primary placeholder:text-text-tertiary outline-none"
            />
            <kbd className="hidden sm:block px-2 py-1 text-xs text-text-tertiary bg-bg-tertiary rounded">
              /
            </kbd>
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingsView() {
  return (
    <div className="flex-1 h-full flex flex-col">
      <div className="h-14 flex items-center px-6 border-b border-border">
        <h1 className="text-lg font-semibold text-text-primary">Settings</h1>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="card">
            <h3 className="text-sm font-medium text-text-primary mb-4 flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              About
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-text-secondary">Version</span>
                <span className="text-sm text-text-primary">0.1.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-text-secondary">Storage</span>
                <span className="text-sm text-text-primary">IndexedDB (Local)</span>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="text-sm font-medium text-text-primary mb-4 flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Data
            </h3>
            <p className="text-sm text-text-secondary mb-4">
              All your data is stored locally in your browser. Nothing is sent to any server.
            </p>
            <button className="btn btn-secondary text-xs">
              Export Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function getDaysActive(createdAt: number): string {
  const days = Math.floor((Date.now() - createdAt) / (1000 * 60 * 60 * 24));
  return days === 0 ? "1" : String(days);
}

