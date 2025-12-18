"use client";

import { clsx } from "clsx";
import {
  FolderKanban,
  FileText,
  StickyNote,
  Search,
  Settings,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";
import { useTheme } from "@/components/providers/theme-provider";
import type { NavSection } from "./app-shell";

interface SidebarProps {
  activeSection: NavSection;
  onSectionChange: (section: NavSection) => void;
}

const navItems: { id: NavSection; label: string; icon: typeof FolderKanban }[] = [
  { id: "projects", label: "Projects", icon: FolderKanban },
  { id: "papers", label: "Papers", icon: FileText },
  { id: "notes", label: "Notes", icon: StickyNote },
  { id: "search", label: "Search", icon: Search },
];

export function Sidebar({ activeSection, onSectionChange }: SidebarProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();

  return (
    <aside className="w-16 lg:w-56 h-full flex flex-col bg-bg-secondary border-r border-border shrink-0">
      {/* Logo */}
      <div className="h-14 flex items-center px-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
            <span className="text-white font-bold text-sm">AI</span>
          </div>
          <span className="hidden lg:block font-semibold text-text-primary">
            Research OS
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 lg:p-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={clsx(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150",
                isActive
                  ? "bg-accent-subtle text-accent"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface-hover"
              )}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span className="hidden lg:block">{item.label}</span>
            </button>
          );
        })}
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

        {/* Settings */}
        <button
          onClick={() => onSectionChange("settings")}
          className={clsx(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150",
            activeSection === "settings"
              ? "bg-accent-subtle text-accent"
              : "text-text-secondary hover:text-text-primary hover:bg-surface-hover"
          )}
        >
          <Settings className="w-5 h-5 shrink-0" />
          <span className="hidden lg:block">Settings</span>
        </button>
      </div>
    </aside>
  );
}

