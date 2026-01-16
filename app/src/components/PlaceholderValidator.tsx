import React from 'react';
import { useConfigStore } from '../store/config-store';

interface ValidationResult {
  isValid: boolean;
  message?: string;
}

const PlaceholderValidator: React.FC = () => {
  const { userPrompts } = useConfigStore();
  
  // Validate that the first prompt contains {input}
  const validateFirstPrompt = (): ValidationResult => {
    if (userPrompts.length === 0) return { isValid: true };
    
    const firstPrompt = userPrompts[0];
    if (!firstPrompt.content.includes('{input}')) {
      return {
        isValid: false,
        message: 'First prompt should contain {input} placeholder to reference your data'
      };
    }
    
    return { isValid: true };
  };
  
  // Validate that chained prompts contain {previous_output}
  const validateChainedPrompts = (): ValidationResult => {
    if (userPrompts.length <= 1) return { isValid: true };
    
    for (let i = 1; i < userPrompts.length; i++) {
      if (!userPrompts[i].content.includes('{previous_output}')) {
        return {
          isValid: false,
          message: `Prompt ${i + 1} should contain {previous_output} placeholder for chaining`
        };
      }
    }
    
    return { isValid: true };
  };
  
  const firstPromptValidation = validateFirstPrompt();
  const chainedPromptsValidation = validateChainedPrompts();
  
  if (firstPromptValidation.isValid && chainedPromptsValidation.isValid) {
    return null; // Don't render anything if all validations pass
  }
  
  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 dark:bg-yellow-900/30 dark:border-yellow-600">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
            Placeholder Warning
          </h3>
          <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
            <ul className="list-disc pl-5 space-y-1">
              {!firstPromptValidation.isValid && (
                <li>{firstPromptValidation.message}</li>
              )}
              {!chainedPromptsValidation.isValid && (
                <li>{chainedPromptsValidation.message}</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlaceholderValidator;
