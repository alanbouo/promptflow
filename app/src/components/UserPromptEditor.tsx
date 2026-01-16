import React from 'react';
import { useConfigStore, UserPrompt } from '../store/config-store';

interface PromptItemProps {
  prompt: UserPrompt;
  index: number;
  onUpdate: (id: string, content: string) => void;
  onRemove: (id: string) => void;
  canDelete: boolean;
}

const PromptItem: React.FC<PromptItemProps> = ({ 
  prompt, 
  index, 
  onUpdate, 
  onRemove,
  canDelete 
}) => {
  return (
    <div className="mb-4 border rounded-md p-4 bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-medium">Prompt {index + 1}</h3>
        {canDelete && (
          <button 
            className="text-red-500 text-sm hover:text-red-700"
            onClick={() => onRemove(prompt.id)}
            aria-label="Remove prompt"
          >
            Remove
          </button>
        )}
      </div>
      <textarea
        className="w-full h-24 p-3 border rounded-md bg-white dark:bg-gray-800 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        placeholder={index === 0 ? "E.g., Analyze this data: {input}" : "E.g., Summarize insights from: {previous_output}"}
        value={prompt.content}
        onChange={(e) => onUpdate(prompt.id, e.target.value)}
      />
      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
        {index === 0 ? (
          <span>Use <code className="bg-gray-200 dark:bg-gray-600 px-1 rounded">{'{input}'}</code> to reference your data</span>
        ) : (
          <span>Use <code className="bg-gray-200 dark:bg-gray-600 px-1 rounded">{'{previous_output}'}</code> to reference previous prompt output</span>
        )}
      </div>
    </div>
  );
};

const UserPromptEditor: React.FC = () => {
  const { userPrompts, addUserPrompt, updateUserPrompt, removeUserPrompt } = useConfigStore();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">User Prompts</h2>
        <button 
          className="px-3 py-1 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600"
          onClick={addUserPrompt}
          disabled={userPrompts.length >= 3}
        >
          Add Prompt
        </button>
      </div>
      
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Use <code className="bg-gray-200 dark:bg-gray-600 px-1 rounded">{'{input}'}</code> to reference data items. 
        For chaining, use <code className="bg-gray-200 dark:bg-gray-600 px-1 rounded">{'{previous_output}'}</code> to reference the output of the previous prompt.
      </p>
      
      {userPrompts.map((prompt, index) => (
        <PromptItem
          key={prompt.id}
          prompt={prompt}
          index={index}
          onUpdate={updateUserPrompt}
          onRemove={removeUserPrompt}
          canDelete={userPrompts.length > 1}
        />
      ))}
      
      {userPrompts.length >= 3 && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 italic">
          Maximum of 3 prompts allowed
        </p>
      )}
    </div>
  );
};

export default UserPromptEditor;
