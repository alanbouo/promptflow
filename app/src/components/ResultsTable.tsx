import React, { useState } from 'react';
import { JobResult } from '../lib/types/job';

interface ResultsTableProps {
  results: JobResult[];
  isLoading: boolean;
}

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
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium text-sm mb-1">Input:</h4>
                          <pre className="whitespace-pre-wrap break-all text-xs font-mono bg-gray-100 dark:bg-gray-800 p-3 rounded">
                            {result.input}
                          </pre>
                        </div>
                        
                        {result.intermediates && result.intermediates.length > 0 && (
                          <div>
                            <h4 className="font-medium text-sm mb-1">Intermediate Results:</h4>
                            {result.intermediates.map((intermediate, i) => (
                              <div key={i} className="mb-2">
                                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                  Step {i + 1}:
                                </div>
                                <pre className="whitespace-pre-wrap break-all text-xs font-mono bg-gray-100 dark:bg-gray-800 p-3 rounded">
                                  {intermediate}
                                </pre>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        <div>
                          <h4 className="font-medium text-sm mb-1">Final Output:</h4>
                          <pre className="whitespace-pre-wrap break-all text-xs font-mono bg-gray-100 dark:bg-gray-800 p-3 rounded">
                            {result.finalOutput}
                          </pre>
                        </div>
                        
                        {result.error && (
                          <div>
                            <h4 className="font-medium text-sm text-red-500 mb-1">Error:</h4>
                            <pre className="whitespace-pre-wrap break-all text-xs font-mono bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200 p-3 rounded">
                              {result.error}
                            </pre>
                          </div>
                        )}
                        
                        <div>
                          <h4 className="font-medium text-sm mb-1">Token Usage:</h4>
                          <div className="text-xs">
                            <span className="inline-block mr-4">
                              Prompt: {result.tokenUsage.prompt} tokens
                            </span>
                            <span className="inline-block mr-4">
                              Completion: {result.tokenUsage.completion} tokens
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
