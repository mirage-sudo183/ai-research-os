# AI Research OS

A web-first desktop research cockpit for AI exploration. Browse the latest papers from arXiv, organize your reading list, and track your research — all locally in your browser.

## Features

### Stage 0 - Foundation
- **3-Pane Layout**: Sidebar, List, and Reader panes for efficient navigation
- **Local-First Storage**: All data stored in IndexedDB - nothing leaves your browser
- **Light/Dark Mode**: System-aware theming with manual override

### Stage 1 - Papers Feed
- **Live arXiv Feed**: Browse the latest AI research papers from arXiv
- **Category Filtering**: Filter by cs.AI, cs.LG, cs.CL, cs.RO, cs.SE, and more
- **Keyword Search**: Query papers with keywords like "agent", "multi-agent", "tool use"
- **Local Filtering**: Instantly filter loaded results by title, authors, or abstract
- **Reading Status**: Mark papers as unread, skimmed, read, or deep read
- **Reading List**: Save papers to your reading list for later
- **Auto-Refresh**: Automatically refreshes every 15 minutes when the page is active
- **Offline Support**: Works offline with cached results

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Storage**: IndexedDB via `idb`
- **State Management**: Zustand
- **Icons**: Lucide React
- **XML Parsing**: fast-xml-parser (for arXiv Atom feeds)

## Getting Started

### Prerequisites

- Node.js 18+
- npm, yarn, or pnpm

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   └── arxiv/
│   │       └── route.ts       # arXiv API proxy
│   ├── feeds/
│   │   └── papers/
│   │       └── page.tsx       # Papers feed page
│   ├── globals.css            # Global styles & CSS variables
│   ├── layout.tsx             # Root layout
│   └── page.tsx               # Home page
├── components/
│   ├── layout/                # General layout components
│   ├── papers/                # Papers feed components
│   │   ├── papers-feed-shell.tsx
│   │   ├── papers-sidebar.tsx
│   │   ├── papers-list-pane.tsx
│   │   ├── paper-reader-pane.tsx
│   │   └── offline-banner.tsx
│   └── providers/
│       ├── theme-provider.tsx
│       └── storage-provider.tsx
└── lib/
    ├── arxiv.ts               # arXiv query helpers
    ├── papers-store.ts        # Zustand store for papers feed
    ├── storage.ts             # IndexedDB operations
    └── types.ts               # TypeScript types
```

## arXiv API Configuration

The papers feed uses the official arXiv API. The API is proxied through a Next.js Route Handler to avoid CORS issues.

### Default Query Parameters

- **Categories**: cs.AI, cs.LG, cs.CL (configurable in UI)
- **Max Results**: 50 papers per query
- **Sort**: By submission date, descending

### Example Queries

The feed supports:
- Category-only: `cat:cs.AI`
- Multi-category: `(cat:cs.AI OR cat:cs.LG)`
- Keywords: `all:agent OR all:multi-agent`
- Combined: `(cat:cs.AI OR cat:cs.LG) AND (all:agent)`

## Design Philosophy

- **Minimal & Calm**: Linear/Arc-inspired aesthetic
- **Desktop-First**: Optimized for large screens (1024px+)
- **Local-First**: No backend, no auth, your data stays with you
- **Offline-Ready**: Cached data available when offline

## Roadmap

- [x] Stage 0: App skeleton with 3-pane layout
- [x] Stage 1: Live arXiv papers feed
- [ ] Stage 2: Projects and notes organization
- [ ] Stage 3: Advanced search and filtering
- [ ] Stage 4: AI-powered paper summaries

## License

MIT
