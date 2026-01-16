import { useState } from 'react';
import { useRouter } from 'next/navigation';
import SystemPromptEditor from '../../components/SystemPromptEditor';
import UserPromptEditor from '../../components/UserPromptEditor';
import PlaceholderValidator from '../../components/PlaceholderValidator';
import SettingsPanel from '../../components/SettingsPanel';
import BatchOptions from '../../components/BatchOptions';
import TemplateManagement from '../../components/TemplateManagement';
import { useConfigStore } from '../../store/config-store';
import { validateConfig } from '../../lib/validators';

export default function ConfigurePage() {
  const router = useRouter();
  const { systemPrompt, userPrompts, settings } = useConfigStore();
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  
  const handleContinue = () => {
    // Validate the configuration before proceeding
    const validation = validateConfig(systemPrompt, userPrompts, settings);
    
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      // Scroll to top to show errors
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    
    // Clear any previous validation errors
    setValidationErrors([]);
    
    // Navigate to the input page
    router.push('/input');
  };
  
  return (
    <div className="max-w-4xl mx-auto pb-12">
      <h1 className="text-3xl font-bold mb-6">Configure Prompts</h1>
      
      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 dark:bg-red-900/30 dark:border-red-600">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Please fix the following errors:
              </h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                <ul className="list-disc pl-5 space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Placeholder Validator - Shows warnings but doesn't block */}
      <PlaceholderValidator />
      
      {/* System Prompt Editor */}
      <SystemPromptEditor />
      
      {/* User Prompt Editor */}
      <UserPromptEditor />
      
      {/* LLM Settings Panel */}
      <SettingsPanel />
      
      {/* Batch Options */}
      <BatchOptions />
      
      {/* Template Management */}
      <TemplateManagement />
      
      {/* Navigation Buttons */}
      <div className="flex justify-end space-x-3 mt-6">
        <button 
          className="px-4 py-2 border rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
          onClick={() => router.push('/')}
        >
          Back to Dashboard
        </button>
        <button 
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          onClick={handleContinue}
        >
          Continue to Input
        </button>
      </div>
    </div>
  );
}
