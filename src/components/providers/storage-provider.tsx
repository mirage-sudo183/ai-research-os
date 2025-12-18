"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import * as storage from "@/lib/storage";
import type { Project, ResearchItem } from "@/lib/types";

interface StorageContextType {
  isReady: boolean;
  projects: Project[];
  papers: ResearchItem[];
  refreshProjects: () => Promise<void>;
  refreshPapers: () => Promise<void>;
  createProject: typeof storage.createProject;
  deleteProject: typeof storage.deleteProject;
}

const StorageContext = createContext<StorageContextType | undefined>(undefined);

export function StorageProvider({ children }: { children: ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [papers, setPapers] = useState<ResearchItem[]>([]);

  const refreshProjects = useCallback(async () => {
    const data = await storage.getAllProjects();
    setProjects(data);
  }, []);

  const refreshPapers = useCallback(async () => {
    const data = await storage.getAllPapers();
    setPapers(data);
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        await storage.getDB(); // Initialize DB
        await Promise.all([refreshProjects(), refreshPapers()]);
        setIsReady(true);
      } catch (error) {
        console.error("Failed to initialize storage:", error);
        setIsReady(true); // Still mark as ready to show empty state
      }
    };
    init();
  }, [refreshProjects, refreshPapers]);

  const createProject = useCallback(
    async (data: { name: string; description: string }) => {
      const project = await storage.createProject(data);
      await refreshProjects();
      return project;
    },
    [refreshProjects]
  );

  const deleteProject = useCallback(
    async (id: string) => {
      await storage.deleteProject(id);
      await refreshProjects();
    },
    [refreshProjects]
  );

  return (
    <StorageContext.Provider
      value={{
        isReady,
        projects,
        papers,
        refreshProjects,
        refreshPapers,
        createProject,
        deleteProject,
      }}
    >
      {children}
    </StorageContext.Provider>
  );
}

export function useStorage() {
  const context = useContext(StorageContext);
  if (context === undefined) {
    throw new Error("useStorage must be used within a StorageProvider");
  }
  return context;
}
