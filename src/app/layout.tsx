import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Git Tree Visualizer | 3D GitHub Repository Topology",
    template: "%s | Git Tree Visualizer",
  },
  description: "Visualize GitHub repository branch divergence and merge patterns in immersive 3D and 2D. A specialized engine for structural mapping of project histories.",
  keywords: ["Git", "GitHub", "Visualizer", "3D", "Repository", "Branching", "Merge Patterns", "Codebase Analysis", "Three.js", "Next.js"],
  authors: [{ name: "Emma Strienko" }],
  openGraph: {
    title: "Git Tree Visualizer | 3D GitHub Repository Topology",
    description: "Reconstruct branch divergence and merge patterns through immersive 3D topology.",
    url: "https://git-tree-visualizer.vercel.app", // Replace with your actual domain
    siteName: "Git Tree Visualizer",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Git Tree Visualizer | 3D GitHub Repository Topology",
    description: "Visualize GitHub repository branch divergence and merge patterns in immersive 3D.",
  },
  icons: {
    icon: "/logo.svg",
    apple: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}
