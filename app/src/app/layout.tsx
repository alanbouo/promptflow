import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import Link from 'next/link';
import { Zap } from 'lucide-react';
import './globals.css';
import ErrorBoundary from '../components/ErrorBoundary';
import AuthProvider from '../components/AuthProvider';
import UserMenu from '../components/UserMenu';

const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'PromptFlow - AI Prompt Processing & Chaining Platform',
  description: 'Configure prompts, process data through LLMs, and chain outputs with visual workflows. Batch processing, multiple providers, and real-time progress tracking.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased min-h-screen`}>
        <AuthProvider>
          {/* Header */}
          <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto flex h-16 items-center justify-between px-4">
              <div className="flex items-center">
                <Link href="/" className="flex items-center gap-2">
                  <Zap className="h-8 w-8 text-primary" />
                  <span className="text-xl font-bold">PromptFlow</span>
                </Link>
                <nav className="ml-10 hidden md:flex items-center gap-1">
                  <Link 
                    href="/" 
                    className="px-4 py-2 text-sm font-medium text-muted-foreground rounded-lg transition-colors hover:bg-accent hover:text-foreground"
                  >
                    Dashboard
                  </Link>
                  <Link 
                    href="/configure" 
                    className="px-4 py-2 text-sm font-medium text-muted-foreground rounded-lg transition-colors hover:bg-accent hover:text-foreground"
                  >
                    Configure
                  </Link>
                  <Link 
                    href="/refine" 
                    className="px-4 py-2 text-sm font-medium text-muted-foreground rounded-lg transition-colors hover:bg-accent hover:text-foreground"
                  >
                    Refine
                  </Link>
                  <Link 
                    href="/input" 
                    className="px-4 py-2 text-sm font-medium text-muted-foreground rounded-lg transition-colors hover:bg-accent hover:text-foreground"
                  >
                    Input
                  </Link>
                  <Link 
                    href="/output" 
                    className="px-4 py-2 text-sm font-medium text-muted-foreground rounded-lg transition-colors hover:bg-accent hover:text-foreground"
                  >
                    Output
                  </Link>
                </nav>
              </div>
              <UserMenu />
            </div>
          </header>

          {/* Main Content */}
          <main className="container mx-auto py-8 px-4">
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
