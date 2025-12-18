import type { Metadata } from "next";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { StorageProvider } from "@/components/providers/storage-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Research OS",
  description: "A desktop research cockpit for AI exploration",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen overflow-hidden">
        <ThemeProvider>
          <StorageProvider>
            {children}
          </StorageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

