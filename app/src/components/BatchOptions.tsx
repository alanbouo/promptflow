import React from 'react';
import { useConfigStore } from '../store/config-store';

const BatchOptions: React.FC = () => {
  const { settings, updateSettings } = useConfigStore();
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">Batch Processing</h2>
      
      <div className="flex items-center mb-4">
        <input 
          type="checkbox" 
          id="batch-mode" 
          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
          checked={settings.batchProcessing}
          onChange={(e) => updateSettings({ batchProcessing: e.target.checked })}
        />
        <label htmlFor="batch-mode" className="ml-2 text-sm font-medium">
          Enable batch processing
        </label>
      </div>
      
      {settings.batchProcessing && (
        <div className="pl-6 border-l-2 border-blue-100 dark:border-blue-900">
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1" htmlFor="concurrent-requests">
              Concurrent Requests (1-10)
            </label>
            <input 
              id="concurrent-requests"
              type="number" 
              value={settings.concurrentRequests}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                if (value >= 1 && value <= 10) {
                  updateSettings({ concurrentRequests: value });
                }
              }}
              min="1"
              max="10"
              className="w-32 p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Higher values process more items in parallel but may hit rate limits.
            </p>
          </div>
          
          <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-md">
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
              Batch Processing Info
            </h3>
            <ul className="mt-2 text-sm text-blue-700 dark:text-blue-300 list-disc pl-5 space-y-1">
              <li>Items will be processed in parallel up to the concurrent limit</li>
              <li>Results will be available as they complete</li>
              <li>Progress will be tracked in real-time</li>
              <li>Processing can be paused or cancelled at any time</li>
            </ul>
          </div>
        </div>
      )}
      
      {!settings.batchProcessing && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Single item mode will process one data item at a time.
        </p>
      )}
    </div>
  );
};

export default BatchOptions;
