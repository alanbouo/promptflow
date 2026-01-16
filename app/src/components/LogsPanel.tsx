import React, { useState } from 'react';

interface LogsPanelProps {
  logs: string[];
  isLoading: boolean;
}

const LogsPanel: React.FC<LogsPanelProps> = ({ logs, isLoading }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filter, setFilter] = useState<'all' | 'info' | 'warning' | 'error'>('all');
  
  // Filter logs based on selected filter
  const filteredLogs = logs.filter(log => {
    if (filter === 'all') return true;
    if (filter === 'error' && log.toLowerCase().includes('error')) return true;
    if (filter === 'warning' && log.toLowerCase().includes('warn')) return true;
    if (filter === 'info' && !log.toLowerCase().includes('error') && !log.toLowerCase().includes('warn')) return true;
    return false;
  });
  
  // Format log entry with color based on content
  const formatLogEntry = (log: string): JSX.Element => {
    const timestamp = log.substring(0, 19); // Extract timestamp if present
    const content = log.substring(19);
    
    let className = 'text-gray-800 dark:text-gray-200';
    
    if (log.toLowerCase().includes('error')) {
      className = 'text-red-600 dark:text-red-400';
    } else if (log.toLowerCase().includes('warn')) {
      className = 'text-yellow-600 dark:text-yellow-400';
    } else if (log.toLowerCase().includes('info')) {
      className = 'text-blue-600 dark:text-blue-400';
    }
    
    return (
      <div className={className}>
        {timestamp && <span className="text-gray-500 dark:text-gray-400">{timestamp}</span>}
        <span>{content}</span>
      </div>
    );
  };
  
  if (isLoading && logs.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Logs</h2>
        </div>
        <div className="flex items-center justify-center h-20">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }
  
  if (logs.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Logs</h2>
        </div>
        <div className="text-center py-4">
          <p className="text-gray-500 dark:text-gray-400">
            No logs available.
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6 overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <h2 className="text-xl font-semibold">Logs</h2>
        
        <div className="flex space-x-2">
          <select
            className="px-2 py-1 border rounded-md text-sm bg-white dark:bg-gray-700 dark:border-gray-600"
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
          >
            <option value="all">All</option>
            <option value="info">Info</option>
            <option value="warning">Warnings</option>
            <option value="error">Errors</option>
          </select>
          
          <button
            className="px-2 py-1 border rounded-md text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </button>
        </div>
      </div>
      
      <div className={`overflow-auto bg-gray-50 dark:bg-gray-900 font-mono text-xs p-4 ${isExpanded ? 'h-96' : 'h-40'}`}>
        {filteredLogs.length > 0 ? (
          <div className="space-y-1">
            {filteredLogs.map((log, index) => (
              <div key={index} className="whitespace-pre-wrap break-all">
                {formatLogEntry(log)}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-500 dark:text-gray-400">
              No logs matching the selected filter.
            </p>
          </div>
        )}
      </div>
      
      <div className="p-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
        Showing {filteredLogs.length} of {logs.length} log entries
        {filter !== 'all' && ` (filtered to ${filter})`}
      </div>
    </div>
  );
};

export default LogsPanel;
