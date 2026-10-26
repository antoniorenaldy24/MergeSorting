import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "Merge Sort — Simulator Interaktif",
  description:
    "Simulator interaktif algoritma Merge Sort — visualisasi divide and conquer level-by-level dengan animasi perbandingan dan penggabungan dua-pointer. Kompleksitas O(n log n).",
  keywords: [
    "merge sort",
    "algoritma sorting",
    "simulator algoritma",
    "sorting visualization",
    "divide and conquer",
    "struktur data",
  ],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "Merge Sort — Simulator Interaktif",
    description:
      "Visualisasi presisi algoritma pengurutan berbasis divide and conquer dengan kompleksitas O(n log n).",
    siteName: "AlgoLab",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className="antialiased bg-background text-foreground">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
