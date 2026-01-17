import React, { useState } from 'react';
import { useConfigStore } from '../store/config-store';

export interface Template {
  id: string;
  name: string;
  systemPrompt: string;
  userPrompts: { id: string; content: string }[];
  settings: {
    provider: 'openai' | 'anthropic' | 'custom';
    model: string;
    temperature: number;
    maxTokens: number;
    batchProcessing: boolean;
    concurrentRequests: number;
  };
  createdAt: string;
}

// Mock templates for UI development (will be replaced with API data)
const mockTemplates: Template[] = [
  {
    id: '1',
    name: 'Data Analysis',
    systemPrompt: 'You are an expert data analyst.',
    userPrompts: [
      { id: 'p1', content: 'Analyze this data: {input}' },
      { id: 'p2', content: 'Summarize key insights from: {previous_output}' }
    ],
    settings: {
      provider: 'openai',
      model: 'gpt-4',
      temperature: 0.7,
      maxTokens: 1000,
      batchProcessing: true,
      concurrentRequests: 5
    },
    createdAt: '2024-12-29T08:00:00.000Z'
  },
  {
    id: '2',
    name: 'Content Generation',
    systemPrompt: 'You are a creative content writer.',
    userPrompts: [
      { id: 'p1', content: 'Generate content about: {input}' }
    ],
    settings: {
      provider: 'anthropic',
      model: 'claude-3-opus',
      temperature: 1.2,
      maxTokens: 2000,
      batchProcessing: false,
      concurrentRequests: 1
    },
    createdAt: '2024-12-28T10:30:00.000Z'
  }
];

const TemplateManagement: React.FC = () => {
  const [templates, setTemplates] = useState<Template[]>(mockTemplates);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  
  const { 
    systemPrompt, 
    userPrompts, 
    settings,
    setSystemPrompt,
    updateSettings
  } = useConfigStore();
  
  // Save current configuration as a template
  const handleSaveTemplate = () => {
    if (!templateName.trim()) return;
    
    const newTemplate: Template = {
      id: Date.now().toString(),
      name: templateName,
      systemPrompt,
      userPrompts,
      settings,
      createdAt: new Date().toISOString()
    };
    
    // In a real app, this would call an API to save the template
    setTemplates([...templates, newTemplate]);
    setIsModalOpen(false);
    setTemplateName('');
  };
  
  // Load a template
  const handleLoadTemplate = (template: Template) => {
    setSystemPrompt(template.systemPrompt);
    // In a real implementation, we would need to handle userPrompts properly
    // This is simplified for the mock
    updateSettings(template.settings);
    setSelectedTemplate(null);
  };
  
  // Delete a template
  const handleDeleteTemplate = (id: string) => {
    // In a real app, this would call an API to delete the template
    setTemplates(templates.filter(template => template.id !== id));
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Templates</h2>
        <button 
          className="px-3 py-1 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600"
          onClick={() => setIsModalOpen(true)}
        >
          Save as Template
        </button>
      </div>
      
      {templates.length > 0 ? (
        <div className="space-y-2">
          {templates.map((template) => (
            <div 
              key={template.id}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600"
            >
              <div>
                <h3 className="font-medium">{template.name}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(template.createdAt).toLocaleDateString()} • 
                  {template.userPrompts.length} prompt{template.userPrompts.length !== 1 ? 's' : ''} • 
                  {template.settings.provider}
                </p>
              </div>
              <div>
                <button 
                  className="text-blue-500 hover:text-blue-700 mr-3 text-sm"
                  onClick={() => handleLoadTemplate(template)}
                >
                  Load
                </button>
                <button 
                  className="text-red-500 hover:text-red-700 text-sm"
                  onClick={() => handleDeleteTemplate(template.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 dark:text-gray-400 italic">
          No saved templates yet. Save your current configuration as a template.
        </p>
      )}
      
      {/* Save Template Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Save as Template</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1" htmlFor="template-name">
                Template Name
              </label>
              <input
                id="template-name"
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="E.g., Data Analysis Template"
                className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                className="px-4 py-2 border rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => {
                  setIsModalOpen(false);
                  setTemplateName('');
                }}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
                onClick={handleSaveTemplate}
                disabled={!templateName.trim()}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateManagement;
