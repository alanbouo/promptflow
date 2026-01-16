import React from 'react';
import { useConfigStore } from '../store/config-store';

const SystemPromptEditor: React.FC = () => {
  const { systemPrompt, setSystemPrompt } = useConfigStore();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">System Prompt</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
        Sets the context for the AI (e.g., &quot;You are an expert analyst.&quot;)
      </p>
      <textarea
        className="w-full h-32 p-3 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        placeholder="Enter system prompt here..."
        value={systemPrompt}
        onChange={(e) => setSystemPrompt(e.target.value)}
      />
      <div className="flex justify-between mt-2">
        <p className="text-xs text-gray-500">
          {systemPrompt.length} characters
        </p>
        <button
          className="text-xs text-blue-500 hover:text-blue-700"
          onClick={() => setSystemPrompt('You are an expert analyst.')}
        >
          Reset to default
        </button>
      </div>
    </div>
  );
};

export default SystemPromptEditor;
