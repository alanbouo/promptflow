import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { JobResult } from '../lib/types/job';

interface ResultsTableProps {
  results: JobResult[];
  isLoading: boolean;
}

// Copy button component
const CopyButton: React.FC<{ text: string }> = ({ text }) => {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };
  
  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center px-2 py-1 text-xs bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 rounded transition-colors"
      title="Copy to clipboard"
    >
      {copied ? (
        <>
          <svg className="w-3.5 h-3.5 mr-1 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Copied!
        </>
      ) : (
        <>
          <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Copy
        </>
      )}
    </button>
  );
};

// Collapsible section component
const CollapsibleSection: React.FC<{
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}> = ({ title, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <div className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
      >
        <span className="font-medium text-sm">{title}</span>
        <svg
          className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="p-4 bg-white dark:bg-gray-800">
          {children}
        </div>
      )}
    </div>
  );
};

const ResultsTable: React.FC<ResultsTableProps> = ({ results, isLoading }) => {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [sortField, setSortField] = useState<'input' | 'status'>('input');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filter, setFilter] = useState<'all' | 'success' | 'error'>('all');
  
  // Toggle expanded row
  const toggleExpand = (input: string) => {
    if (expandedRow === input) {
      setExpandedRow(null);
    } else {
      setExpandedRow(input);
    }
  };
  
  // Sort results
  const sortResults = (results: JobResult[]) => {
    return [...results].sort((a, b) => {
      if (sortField === 'input') {
        return sortDirection === 'asc' 
          ? a.input.localeCompare(b.input)
          : b.input.localeCompare(a.input);
      } else {
        return sortDirection === 'asc'
          ? a.status.localeCompare(b.status)
          : b.status.localeCompare(a.status);
      }
    });
  };
  
  // Filter results
  const filterResults = (results: JobResult[]) => {
    if (filter === 'all') return results;
    return results.filter(result => result.status === filter);
  };
  
  // Handle sort click
  const handleSortClick = (field: 'input' | 'status') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  // Truncate text for display
  const truncateText = (text: string, maxLength: number = 100): string => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };
  
  // Processed results
  const processedResults = filterResults(sortResults(results));
  
  if (isLoading && results.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }
  
  if (results.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <div className="text-center py-10">
          <p className="text-gray-500 dark:text-gray-400">
            No results available yet. Start a job to see results here.
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6 overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <h2 className="text-xl font-semibold">Results</h2>
        
        <div className="flex space-x-2">
          <select
            className="px-2 py-1 border rounded-md text-sm bg-white dark:bg-gray-700 dark:border-gray-600"
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
          >
            <option value="all">All</option>
            <option value="success">Success</option>
            <option value="error">Error</option>
          </select>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                #
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSortClick('input')}
              >
                <div className="flex items-center">
                  Input
                  {sortField === 'input' && (
                    <span className="ml-1">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Output
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSortClick('status')}
              >
                <div className="flex items-center">
                  Status
                  {sortField === 'status' && (
                    <span className="ml-1">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {processedResults.map((result, index) => (
              <React.Fragment key={index}>
                <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {index + 1}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {truncateText(result.input)}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {truncateText(result.finalOutput)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      result.status === 'success' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {result.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-500 hover:text-blue-700">
                    <button onClick={() => toggleExpand(result.input)}>
                      {expandedRow === result.input ? 'Collapse' : 'Expand'}
                    </button>
                  </td>
                </tr>
                {expandedRow === result.input && (
                  <tr className="bg-gray-50 dark:bg-gray-700">
                    <td colSpan={5} className="px-6 py-4">
                      <div className="space-y-3">
                        {/* Input Section */}
                        <CollapsibleSection title="Input" defaultOpen={false}>
                          <pre className="whitespace-pre-wrap break-all text-xs font-mono bg-gray-100 dark:bg-gray-900 p-3 rounded">
                            {result.input}
                          </pre>
                        </CollapsibleSection>
                        
                        {/* Output Section */}
                        <CollapsibleSection title="Output" defaultOpen={true}>
                          <div className="space-y-3">
                            {result.intermediates && result.intermediates.length > 0 && (
                              <div>
                                <h4 className="font-medium text-xs text-gray-500 dark:text-gray-400 mb-2">Intermediate Results:</h4>
                                {result.intermediates.map((intermediate, i) => (
                                  <div key={i} className="mb-2">
                                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                      Step {i + 1}:
                                    </div>
                                    <pre className="whitespace-pre-wrap break-all text-xs font-mono bg-gray-100 dark:bg-gray-900 p-3 rounded">
                                      {intermediate}
                                    </pre>
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium text-xs text-gray-500 dark:text-gray-400">Final Output:</h4>
                                <CopyButton text={result.finalOutput} />
                              </div>
                              <div className="bg-gray-100 dark:bg-gray-900 p-3 rounded text-sm prose-headings:font-bold prose-headings:mt-4 prose-headings:mb-2 prose-p:my-2 prose-ul:my-2 prose-li:my-0">
                                <ReactMarkdown
                                  components={{
                                    h1: ({children}) => <h1 className="text-xl font-bold mt-4 mb-2">{children}</h1>,
                                    h2: ({children}) => <h2 className="text-lg font-bold mt-3 mb-2">{children}</h2>,
                                    h3: ({children}) => <h3 className="text-base font-bold mt-2 mb-1">{children}</h3>,
                                    p: ({children}) => <p className="my-2">{children}</p>,
                                    ul: ({children}) => <ul className="list-disc pl-5 my-2">{children}</ul>,
                                    ol: ({children}) => <ol className="list-decimal pl-5 my-2">{children}</ol>,
                                    li: ({children}) => <li className="my-0.5">{children}</li>,
                                    strong: ({children}) => <strong className="font-bold">{children}</strong>,
                                    em: ({children}) => <em className="italic">{children}</em>,
                                    code: ({children}) => <code className="bg-gray-200 dark:bg-gray-800 px-1 rounded text-xs font-mono">{children}</code>,
                                    pre: ({children}) => <pre className="bg-gray-200 dark:bg-gray-800 p-2 rounded overflow-x-auto my-2">{children}</pre>,
                                  }}
                                >
                                  {result.finalOutput}
                                </ReactMarkdown>
                              </div>
                            </div>
                            
                            {result.error && (
                              <div>
                                <h4 className="font-medium text-xs text-red-500 mb-2">Error:</h4>
                                <pre className="whitespace-pre-wrap break-all text-xs font-mono bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200 p-3 rounded">
                                  {result.error}
                                </pre>
                              </div>
                            )}
                          </div>
                        </CollapsibleSection>
                        
                        {/* Token Usage - always visible */}
                        <div className="px-4 py-2 bg-gray-100 dark:bg-gray-900 rounded-lg">
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            <span className="inline-block mr-4">
                              <span className="font-medium">Prompt:</span> {result.tokenUsage.prompt} tokens
                            </span>
                            <span className="inline-block mr-4">
                              <span className="font-medium">Completion:</span> {result.tokenUsage.completion} tokens
                            </span>
                            <span className="inline-block font-medium">
                              Total: {result.tokenUsage.prompt + result.tokenUsage.completion} tokens
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400">
        Showing {processedResults.length} of {results.length} results
        {filter !== 'all' && ` (filtered to ${filter} status)`}
      </div>
    </div>
  );
};

export default ResultsTable;
