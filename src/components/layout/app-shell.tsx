"use client";

import { useState } from "react";
import { Sidebar } from "./sidebar";
import { ListPane } from "./list-pane";
import { ReaderPane } from "./reader-pane";
import { useStorage } from "@/components/providers/storage-provider";

export type NavSection = "projects" | "papers" | "notes" | "search" | "settings";

export function AppShell() {
  const { isReady } = useStorage();
  const [activeSection, setActiveSection] = useState<NavSection>("projects");
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  if (!isReady) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-bg-primary">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-text-secondary text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-bg-primary">
      {/* Sidebar - Navigation */}
      <Sidebar 
        activeSection={activeSection} 
        onSectionChange={(section) => {
          setActiveSection(section);
          setSelectedItemId(null);
        }} 
      />
      
      {/* List Pane - Items */}
      <ListPane 
        activeSection={activeSection}
        selectedItemId={selectedItemId}
        onItemSelect={setSelectedItemId}
      />
      
      {/* Reader Pane - Content */}
      <ReaderPane 
        activeSection={activeSection}
        selectedItemId={selectedItemId}
      />
    </div>
  );
}

