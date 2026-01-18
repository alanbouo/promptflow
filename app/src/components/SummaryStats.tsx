import React from 'react';
import { JobResult } from '../lib/types/job';

interface SummaryStatsProps {
  results: JobResult[];
  startedAt?: Date;
  completedAt?: Date;
}

const SummaryStats: React.FC<SummaryStatsProps> = ({ 
  results, 
  startedAt, 
  completedAt 
}) => {
  // Calculate token usage
  const totalPromptTokens = results.reduce((sum, result) => sum + (result.tokenUsage?.prompt || 0), 0);
  const totalCompletionTokens = results.reduce((sum, result) => sum + (result.tokenUsage?.completion || 0), 0);
  const totalTokens = totalPromptTokens + totalCompletionTokens;
  
  // Calculate success/error counts
  const successCount = results.filter(result => result.status === 'success').length;
  const errorCount = results.filter(result => result.status === 'error').length;
  
  // Calculate runtime
  const calculateRuntime = (): string => {
    if (!startedAt || !completedAt) return 'N/A';
    
    const start = new Date(startedAt);
    const end = new Date(completedAt);
    const durationMs = end.getTime() - start.getTime();
    
    // Format as minutes and seconds
    const minutes = Math.floor(durationMs / 60000);
    const seconds = ((durationMs % 60000) / 1000).toFixed(1);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    
    return `${seconds}s`;
  };
  
  // Calculate average time per item
  const calculateAverageTime = (): string => {
    if (!startedAt || !completedAt || results.length === 0) return 'N/A';
    
    const start = new Date(startedAt);
    const end = new Date(completedAt);
    const durationMs = end.getTime() - start.getTime();
    const avgMs = durationMs / results.length;
    
    // Format as seconds
    const seconds = (avgMs / 1000).toFixed(1);
    
    return `${seconds}s`;
  };
  
  // Calculate estimated cost (very rough approximation)
  const calculateEstimatedCost = (): string => {
    // Very rough approximation based on GPT-4 pricing
    // $0.03 per 1K prompt tokens, $0.06 per 1K completion tokens
    const promptCost = totalPromptTokens * 0.00003;
    const completionCost = totalCompletionTokens * 0.00006;
    const totalCost = promptCost + completionCost;
    
    return `$${totalCost.toFixed(4)}`;
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">Summary</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <div className="text-sm text-gray-500 dark:text-gray-400">Total Items</div>
          <div className="text-2xl font-bold">{results.length}</div>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <div className="text-sm text-gray-500 dark:text-gray-400">Success / Error</div>
          <div className="text-2xl font-bold">
            <span className="text-green-500">{successCount}</span>
            <span className="mx-1">/</span>
            <span className="text-red-500">{errorCount}</span>
          </div>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <div className="text-sm text-gray-500 dark:text-gray-400">Total Runtime</div>
          <div className="text-2xl font-bold">{calculateRuntime()}</div>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <div className="text-sm text-gray-500 dark:text-gray-400">Avg. Time per Item</div>
          <div className="text-2xl font-bold">{calculateAverageTime()}</div>
        </div>
      </div>
      
      <div className="mt-6">
        <h3 className="text-lg font-medium mb-3">Token Usage</h3>
        
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <div className="flex flex-wrap gap-4">
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Prompt Tokens</div>
              <div className="text-xl font-semibold">{totalPromptTokens.toLocaleString('en-US')}</div>
            </div>
            
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Completion Tokens</div>
              <div className="text-xl font-semibold">{totalCompletionTokens.toLocaleString('en-US')}</div>
            </div>
            
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Total Tokens</div>
              <div className="text-xl font-semibold">{totalTokens.toLocaleString('en-US')}</div>
            </div>
            
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Est. Cost (GPT-4)</div>
              <div className="text-xl font-semibold">{calculateEstimatedCost()}</div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
        * Cost estimation is approximate and based on standard GPT-4 pricing
      </div>
    </div>
  );
};

export default SummaryStats;
