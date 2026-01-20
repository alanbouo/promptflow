import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Link from 'next/link';
import './globals.css';
import ErrorBoundary from '../components/ErrorBoundary';
import AuthProvider from '../components/AuthProvider';
import UserMenu from '../components/UserMenu';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'PromptFlow',
  description: 'Configure prompts, process data through LLMs, and display outputs',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-50 text-slate-900 min-h-screen`}>
        <AuthProvider>
          {/* Header */}
          <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white shadow-sm">
            <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
              <div className="flex items-center">
                <Link href="/" className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-lg">
                    P
                  </div>
                  <span className="text-xl font-bold text-slate-900">PromptFlow</span>
                </Link>
                <nav className="ml-10 flex items-center gap-1">
                  <Link 
                    href="/" 
                    className="px-4 py-2 text-sm font-medium text-slate-600 rounded-lg transition-colors hover:bg-slate-100 hover:text-slate-900"
                  >
                    Dashboard
                  </Link>
                  <Link 
                    href="/configure" 
                    className="px-4 py-2 text-sm font-medium text-slate-600 rounded-lg transition-colors hover:bg-slate-100 hover:text-slate-900"
                  >
                    Configure
                  </Link>
                  <Link 
                    href="/refine" 
                    className="px-4 py-2 text-sm font-medium text-slate-600 rounded-lg transition-colors hover:bg-slate-100 hover:text-slate-900"
                  >
                    Refine
                  </Link>
                  <Link 
                    href="/input" 
                    className="px-4 py-2 text-sm font-medium text-slate-600 rounded-lg transition-colors hover:bg-slate-100 hover:text-slate-900"
                  >
                    Input
                  </Link>
                  <Link 
                    href="/output" 
                    className="px-4 py-2 text-sm font-medium text-slate-600 rounded-lg transition-colors hover:bg-slate-100 hover:text-slate-900"
                  >
                    Output
                  </Link>
                </nav>
              </div>
              <UserMenu />
            </div>
          </header>

          {/* Main Content */}
          <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
