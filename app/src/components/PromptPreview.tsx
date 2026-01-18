import React, { useState } from 'react';
import { useConfigStore } from '../store/config-store';
import { useInputStore } from '../store/input-store';
import { ChevronDown, ChevronRight } from 'lucide-react';

const PromptPreview: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const { systemPrompt, userPrompts } = useConfigStore();
  const { isBatchMode, singleInput, batchItems } = useInputStore();
  
  // Get the first data item for preview
  const previewData = isBatchMode 
    ? (batchItems.length > 0 ? batchItems[0].content : '') 
    : singleInput;
  
  // Format the first user prompt with the preview data
  const formatFirstPrompt = (): string => {
    if (userPrompts.length === 0) return '';
    
    const firstPrompt = userPrompts[0].content;
    return firstPrompt.replace('{input}', previewData || '[Your input will appear here]');
  };
  
  // Format the second user prompt with a placeholder for the first prompt's output
  const formatSecondPrompt = (): string | null => {
    if (userPrompts.length < 2) return null;
    
    const secondPrompt = userPrompts[1].content;
    return secondPrompt.replace('{previous_output}', '[Output from first prompt]');
  };
  
  // Check if we have data to show
  const hasData = previewData.trim() !== '';
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="flex items-center gap-2 w-full text-left"
      >
        {isCollapsed ? (
          <ChevronRight className="h-5 w-5 text-gray-500" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-500" />
        )}
        <h2 className="text-xl font-semibold">Prompt Preview</h2>
      </button>
      
      {!isCollapsed && (
        <div className="mt-4">
          {!hasData && !isBatchMode && (
            <p className="text-yellow-600 dark:text-yellow-400 mb-4">
              Enter some data above to see how your prompt will look.
            </p>
          )}
          
          {isBatchMode && batchItems.length === 0 && (
            <p className="text-yellow-600 dark:text-yellow-400 mb-4">
              Upload or paste batch data to see how your prompt will look.
            </p>
          )}
          
          <div className="bg-gray-100 dark:bg-gray-700 rounded-md p-4 font-mono text-sm">
            <div className="mb-3">
              <span className="text-blue-600 dark:text-blue-400">System:</span> {systemPrompt || 'No system prompt defined'}
            </div>
            
            <div className="mb-3">
              <span className="text-green-600 dark:text-green-400">User:</span> {formatFirstPrompt() || 'No user prompt defined'}
            </div>
            
            {formatSecondPrompt() && (
              <>
                <div className="mb-3 text-gray-500 dark:text-gray-400 italic">
                  [Assistant responds with first output]
                </div>
                <div className="mb-3">
                  <span className="text-green-600 dark:text-green-400">User:</span> {formatSecondPrompt()}
                </div>
              </>
            )}
            
            {userPrompts.length > 2 && (
              <div className="text-gray-500 dark:text-gray-400 italic">
                [Additional prompts will be chained in sequence]
              </div>
            )}
          </div>
          
          {isBatchMode && batchItems.length > 1 && (
            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
              Preview shows the first item of {batchItems.length}. All items will be processed with the same prompt template.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default PromptPreview;
