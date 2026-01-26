import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "PromptFlow - AI Prompt Processing & Chaining Platform",
  description: "Configure prompts, process data through LLMs, and chain outputs with visual workflows. Batch processing, multiple providers, and real-time progress tracking.",
  keywords: ["AI", "LLM", "prompt engineering", "batch processing", "OpenAI", "Claude", "workflow automation"],
  openGraph: {
    title: "PromptFlow - AI Prompt Processing & Chaining Platform",
    description: "Configure prompts, process data through LLMs, and chain outputs with visual workflows.",
    type: "website",
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
      </body>
    </html>
  );
}
