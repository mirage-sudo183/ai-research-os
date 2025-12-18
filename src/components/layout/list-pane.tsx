"use client";

import { clsx } from "clsx";
import { Plus, Search, FolderKanban, FileText, StickyNote } from "lucide-react";
import { useStorage } from "@/components/providers/storage-provider";
import type { NavSection } from "./app-shell";

interface ListPaneProps {
  activeSection: NavSection;
  selectedItemId: string | null;
  onItemSelect: (id: string | null) => void;
}

export function ListPane({ activeSection, selectedItemId, onItemSelect }: ListPaneProps) {
  const { projects, papers, createProject, createPaper } = useStorage();

  const handleCreate = async () => {
    if (activeSection === "projects") {
      const project = await createProject({
        name: "New Project",
        description: "",
      });
      onItemSelect(project.id);
    } else if (activeSection === "papers") {
      const paper = await createPaper({
        title: "New Paper",
      });
      onItemSelect(paper.id);
    }
  };

  const getTitle = () => {
    switch (activeSection) {
      case "projects": return "Projects";
      case "papers": return "Papers";
      case "notes": return "Notes";
      case "search": return "Search";
      case "settings": return "Settings";
    }
  };

  const getItems = () => {
    switch (activeSection) {
      case "projects": return projects;
      case "papers": return papers;
      default: return [];
    }
  };

  const items = getItems();
  const canCreate = activeSection === "projects" || activeSection === "papers";

  // Settings and Search don't have a list pane
  if (activeSection === "settings" || activeSection === "search") {
    return null;
  }

  return (
    <div className="w-72 lg:w-80 h-full flex flex-col bg-bg-primary border-r border-border shrink-0">
      {/* Header */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-border">
        <h2 className="font-semibold text-text-primary">{getTitle()}</h2>
        {canCreate && (
          <button
            onClick={handleCreate}
            className="p-1.5 rounded-md text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Search */}
      <div className="p-3 border-b border-border-subtle">
        <div className="flex items-center gap-2 px-3 py-2 bg-bg-secondary rounded-lg">
          <Search className="w-4 h-4 text-text-tertiary" />
          <input
            type="text"
            placeholder="Search..."
            className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-tertiary outline-none"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {items.length === 0 ? (
          <EmptyListState section={activeSection} onCreate={handleCreate} />
        ) : (
          <div className="py-2">
            {items.map((item) => (
              <ListItem
                key={item.id}
                item={item}
                section={activeSection}
                isSelected={selectedItemId === item.id}
                onClick={() => onItemSelect(item.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface ListItemProps {
  item: { id: string; name?: string; title?: string; description?: string; updatedAt: number };
  section: NavSection;
  isSelected: boolean;
  onClick: () => void;
}

function ListItem({ item, section, isSelected, onClick }: ListItemProps) {
  const Icon = section === "projects" ? FolderKanban : section === "papers" ? FileText : StickyNote;
  const title = item.name || item.title || "Untitled";
  const timeAgo = formatTimeAgo(item.updatedAt);

  return (
    <button
      onClick={onClick}
      className={clsx(
        "w-full flex items-start gap-3 px-4 py-3 text-left transition-colors duration-150",
        isSelected
          ? "bg-surface-active"
          : "hover:bg-surface-hover"
      )}
    >
      <div
        className={clsx(
          "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
          isSelected ? "bg-accent text-white" : "bg-bg-tertiary text-text-secondary"
        )}
      >
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p
          className={clsx(
            "text-sm font-medium truncate",
            isSelected ? "text-text-primary" : "text-text-primary"
          )}
        >
          {title}
        </p>
        <p className="text-xs text-text-tertiary mt-0.5">{timeAgo}</p>
      </div>
    </button>
  );
}

function EmptyListState({ section, onCreate }: { section: NavSection; onCreate: () => void }) {
  const config = {
    projects: {
      icon: FolderKanban,
      title: "No projects yet",
      description: "Create your first project to organize your research",
      action: "New Project",
    },
    papers: {
      icon: FileText,
      title: "No papers yet",
      description: "Add papers to track your reading list",
      action: "Add Paper",
    },
    notes: {
      icon: StickyNote,
      title: "No notes yet",
      description: "Start taking notes on your research",
      action: "New Note",
    },
  }[section as "projects" | "papers" | "notes"];

  if (!config) return null;

  const Icon = config.icon;

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 py-12 text-center">
      <div className="w-12 h-12 rounded-xl bg-bg-tertiary flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-text-tertiary" />
      </div>
      <h3 className="text-sm font-medium text-text-primary mb-1">{config.title}</h3>
      <p className="text-xs text-text-tertiary mb-4 max-w-[200px]">{config.description}</p>
      <button
        onClick={onCreate}
        className="btn btn-primary text-xs"
      >
        <Plus className="w-4 h-4" />
        {config.action}
      </button>
    </div>
  );
}

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  
  return new Date(timestamp).toLocaleDateString();
}

