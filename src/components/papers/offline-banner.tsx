"use client";

import { WifiOff } from "lucide-react";

export function OfflineBanner() {
  return (
    <div className="w-full px-4 py-2 bg-yellow-500/10 border-b border-yellow-500/20 flex items-center justify-center gap-2">
      <WifiOff className="w-4 h-4 text-yellow-500" />
      <span className="text-sm text-yellow-500 font-medium">
        Offline — showing cached results
      </span>
    </div>
  );
}

