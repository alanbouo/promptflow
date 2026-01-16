import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import ErrorBoundary from '../components/ErrorBoundary';

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
      <body className={inter.className}>
        <div className="flex h-screen">
          <aside className="w-64 bg-gray-100 dark:bg-gray-800 p-4">
            <h1 className="text-xl font-bold mb-6">PromptFlow</h1>
            <nav className="space-y-2">
              <a href="/" className="block p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700">Dashboard</a>
              <a href="/configure" className="block p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700">Configure</a>
              <a href="/input" className="block p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700">Input</a>
              <a href="/output" className="block p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700">Output</a>
            </nav>
            <div className="absolute bottom-4">
              <button className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700">
                Toggle Theme
              </button>
            </div>
          </aside>
          <main className="flex-1 p-6 overflow-auto">
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </main>
        </div>
      </body>
    </html>
  );
}
