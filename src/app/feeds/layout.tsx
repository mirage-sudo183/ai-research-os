import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Papers Feed - AI Research OS",
  description: "Browse latest AI research papers from arXiv",
};

export default function FeedsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

