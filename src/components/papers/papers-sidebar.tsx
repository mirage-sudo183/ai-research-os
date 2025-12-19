"use client";

import { clsx } from "clsx";
import Link from "next/link";
import {
  Rss,
  Bookmark,
  Home,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";
import { useTheme } from "@/components/providers/theme-provider";
import { usePapersFeed } from "@/lib/papers-store";

export function PapersSidebar() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { viewMode, setViewMode, readingListPapers } = usePapersFeed();

  return (
    <aside className="w-16 lg:w-56 h-full flex flex-col bg-bg-secondary border-r border-border shrink-0">
      {/* Logo */}
      <div className="h-14 flex items-center px-4 border-b border-border">
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
            <span className="text-white font-bold text-sm">AI</span>
          </div>
          <span className="hidden lg:block font-semibold text-text-primary">
            Research OS
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 lg:p-3 space-y-1">
        <Link
          href="/"
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors duration-150"
        >
          <Home className="w-5 h-5 shrink-0" />
          <span className="hidden lg:block">Home</span>
        </Link>

        <div className="pt-4 pb-2 px-3">
          <span className="hidden lg:block text-2xs uppercase tracking-wider text-text-tertiary font-medium">
            Feeds
          </span>
        </div>

        <SidebarButton
          icon={Rss}
          label="Papers Feed"
          isActive={viewMode === "feed"}
          onClick={() => setViewMode("feed")}
        />

        <SidebarButton
          icon={Bookmark}
          label="Reading List"
          isActive={viewMode === "reading-list"}
          onClick={() => setViewMode("reading-list")}
          badge={readingListPapers.length > 0 ? readingListPapers.length : undefined}
        />
      </nav>

      {/* Bottom section */}
      <div className="p-2 lg:p-3 border-t border-border space-y-1">
        {/* Theme toggle */}
        <div className="hidden lg:flex items-center gap-1 p-1 bg-bg-tertiary rounded-lg">
          <button
            onClick={() => setTheme("light")}
            className={clsx(
              "flex-1 flex items-center justify-center gap-2 py-1.5 px-2 rounded-md text-xs font-medium transition-colors",
              theme === "light"
                ? "bg-bg-elevated text-text-primary shadow-sm"
                : "text-text-tertiary hover:text-text-secondary"
            )}
          >
            <Sun className="w-3.5 h-3.5" />
            <span>Light</span>
          </button>
          <button
            onClick={() => setTheme("dark")}
            className={clsx(
              "flex-1 flex items-center justify-center gap-2 py-1.5 px-2 rounded-md text-xs font-medium transition-colors",
              theme === "dark"
                ? "bg-bg-elevated text-text-primary shadow-sm"
                : "text-text-tertiary hover:text-text-secondary"
            )}
          >
            <Moon className="w-3.5 h-3.5" />
            <span>Dark</span>
          </button>
          <button
            onClick={() => setTheme("system")}
            className={clsx(
              "flex-1 flex items-center justify-center gap-2 py-1.5 px-2 rounded-md text-xs font-medium transition-colors",
              theme === "system"
                ? "bg-bg-elevated text-text-primary shadow-sm"
                : "text-text-tertiary hover:text-text-secondary"
            )}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Auto</span>
          </button>
        </div>

        {/* Mobile theme toggle */}
        <button
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          className="lg:hidden w-full flex items-center justify-center p-2.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-hover"
        >
          {resolvedTheme === "dark" ? (
            <Sun className="w-5 h-5" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
        </button>
      </div>
    </aside>
  );
}

function SidebarButton({
  icon: Icon,
  label,
  isActive,
  onClick,
  badge,
}: {
  icon: typeof Rss;
  label: string;
  isActive: boolean;
  onClick: () => void;
  badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150",
        isActive
          ? "bg-accent-subtle text-accent"
          : "text-text-secondary hover:text-text-primary hover:bg-surface-hover"
      )}
    >
      <Icon className="w-5 h-5 shrink-0" />
      <span className="hidden lg:block flex-1 text-left">{label}</span>
      {badge !== undefined && (
        <span className={clsx(
          "hidden lg:block px-1.5 py-0.5 text-xs font-medium rounded-full",
          isActive ? "bg-accent text-white" : "bg-bg-tertiary text-text-secondary"
        )}>
          {badge}
        </span>
      )}
    </button>
  );
}

