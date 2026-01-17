import React from 'react';
import { useConfigStore, ConfigSettings } from '../store/config-store';

// LLM model options by provider
const modelOptions = {
  openai: [
    { value: 'gpt-4', label: 'GPT-4' },
    { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' }
  ],
  anthropic: [
    { value: 'claude-3-opus', label: 'Claude 3 Opus' },
    { value: 'claude-3-sonnet', label: 'Claude 3 Sonnet' },
    { value: 'claude-3-haiku', label: 'Claude 3 Haiku' }
  ],
  custom: [
    { value: 'custom', label: 'Custom Model (via API)' }
  ]
};

const SettingsPanel: React.FC = () => {
  const { settings, updateSettings } = useConfigStore();
  
  // Handle provider change and update model to first option of new provider
  const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newProvider = e.target.value as ConfigSettings['provider'];
    const defaultModel = modelOptions[newProvider][0].value;
    updateSettings({ 
      provider: newProvider,
      model: defaultModel
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">LLM Settings</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Provider Selection */}
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="provider">
            Provider
          </label>
          <select
            id="provider"
            className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={settings.provider}
            onChange={handleProviderChange}
          >
            <option value="openai">OpenAI</option>
            <option value="anthropic">Anthropic</option>
            <option value="custom">Custom</option>
          </select>
        </div>
        
        {/* Model Selection */}
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="model">
            Model
          </label>
          <select
            id="model"
            className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={settings.model}
            onChange={(e) => updateSettings({ model: e.target.value })}
          >
            {modelOptions[settings.provider].map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        
        {/* Temperature Slider */}
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="temperature">
            Temperature ({settings.temperature})
          </label>
          <input
            id="temperature"
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={settings.temperature}
            onChange={(e) => updateSettings({ temperature: parseFloat(e.target.value) })}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>0 (Precise)</span>
            <span>1 (Balanced)</span>
            <span>2 (Creative)</span>
          </div>
        </div>
        
        {/* Max Tokens */}
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="maxTokens">
            Max Tokens
          </label>
          <input
            id="maxTokens"
            type="number"
            value={settings.maxTokens}
            onChange={(e) => updateSettings({ maxTokens: parseInt(e.target.value) || 1 })}
            min="1"
            max="32000"
            className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Maximum number of tokens to generate
          </p>
        </div>
      </div>
      
      {settings.provider === 'custom' && (
        <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/30 rounded-md text-sm">
          <p className="font-medium text-yellow-800 dark:text-yellow-200">
            Custom Provider Configuration
          </p>
          <p className="text-yellow-700 dark:text-yellow-300 mt-1">
            You&apos;ll need to configure the API endpoint in your n8n workflow.
          </p>
        </div>
      )}
    </div>
  );
};

export default SettingsPanel;
