'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useConfigStore } from '../../store/config-store';
import { useInputStore } from '../../store/input-store';
import SingleInputUpload from '../../components/SingleInputUpload';
import BatchInputUpload from '../../components/BatchInputUpload';
import DataPreviewTable from '../../components/DataPreviewTable';
import PromptPreview from '../../components/PromptPreview';
import { validateInput } from '../../lib/validators/input-validator';
import { JobService } from '../../lib/services/job-service';
import { useJobStore } from '../../store/job-store';
import { Check, ChevronDown } from 'lucide-react';

interface Template {
  id: string;
  name: string;
  systemPrompt: string;
  userPrompts: { id: string; content: string }[];
  settings: {
    provider: string;
    model: string;
    temperature: number;
    maxTokens: number;
    batchProcessing: boolean;
    concurrentRequests: number;
  };
}

export default function InputPage() {
  const router = useRouter();
  const { settings } = useConfigStore();
  const { 
    isBatchMode, 
    setIsBatchMode, 
    singleInput, 
    batchItems,
    parseError
  } = useInputStore();
  
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { error: jobError, isLoading: jobLoading } = useJobStore();
  
  // Template selection state
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<string[]>([]);
  const [isTemplateDropdownOpen, setIsTemplateDropdownOpen] = useState(false);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  const templateDropdownRef = useRef<HTMLDivElement>(null);
  
  // Initialize batch mode from config settings - only on client side
  useEffect(() => {
    setIsClient(true);
    setIsBatchMode(settings.batchProcessing);
  }, []);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (templateDropdownRef.current && !templateDropdownRef.current.contains(event.target as Node)) {
        setIsTemplateDropdownOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Fetch templates on mount
  useEffect(() => {
    async function fetchTemplates() {
      try {
        const response = await fetch('/api/templates');
        if (response.ok) {
          const data = await response.json();
          setTemplates(data);
        }
      } catch (error) {
        console.error('Error fetching templates:', error);
      } finally {
        setIsLoadingTemplates(false);
      }
    }
    fetchTemplates();
  }, []);
  
  // Toggle template selection
  const toggleTemplateSelection = (templateId: string) => {
    setSelectedTemplateIds(prev => 
      prev.includes(templateId)
        ? prev.filter(id => id !== templateId)
        : [...prev, templateId]
    );
  };
  
  // Toggle between single and batch mode
  const toggleMode = (isBatch: boolean) => {
    setIsBatchMode(isBatch);
  };
  
  // Handle run processing
  const handleRunProcessing = async () => {
    // Validate input data
    const validation = validateInput(isBatchMode, singleInput, batchItems);
    
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    
    // Validate template selection
    if (selectedTemplateIds.length === 0) {
      setValidationErrors(['Please select at least one template to run']);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    
    // Clear any previous validation errors
    setValidationErrors([]);
    setIsSubmitting(true);
    
    try {
      // Get selected templates
      const selectedTemplates = templates.filter(t => selectedTemplateIds.includes(t.id));
      
      // Submit a job for each selected template
      const jobIds: string[] = [];
      for (const template of selectedTemplates) {
        const jobId = await JobService.submitJobWithTemplate(template);
        if (jobId) {
          jobIds.push(jobId);
        }
      }
      
      if (jobIds.length > 0) {
        // Navigate to the output page with the first job ID (or all if multiple)
        if (jobIds.length === 1) {
          router.push(`/output?jobId=${jobIds[0]}`);
        } else {
          // Navigate to output page to see all jobs
          router.push('/output');
        }
      } else {
        // Job submission failed - error is in jobStore
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto pb-12">
      <h1 className="text-3xl font-bold mb-6">Input Data</h1>
      
      {/* Validation Errors */}
      {(validationErrors.length > 0 || parseError || jobError) && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 dark:bg-red-900/30 dark:border-red-600">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                {jobError ? 'Job Submission Error' : parseError ? 'Parse Error' : 'Please fix the following errors:'}
              </h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                {jobError ? (
                  <p>{jobError}</p>
                ) : parseError ? (
                  <p>{parseError}</p>
                ) : (
                  <ul className="list-disc pl-5 space-y-1">
                    {validationErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Template Selection */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Select Templates</h2>
        <p className="text-sm text-slate-500 mb-4">Choose one or more templates to run your inputs against</p>
        
        {isLoadingTemplates ? (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-slate-500 mb-2">No templates available</p>
            <button
              onClick={() => router.push('/configure')}
              className="text-blue-600 hover:underline text-sm"
            >
              Create a template first
            </button>
          </div>
        ) : (
          <div className="relative" ref={templateDropdownRef}>
            <button
              type="button"
              onClick={() => setIsTemplateDropdownOpen(!isTemplateDropdownOpen)}
              className="w-full flex items-center justify-between px-4 py-3 border rounded-lg bg-white dark:bg-gray-700 hover:border-blue-400 transition-colors"
            >
              <span className="text-sm">
                {selectedTemplateIds.length === 0 
                  ? 'Select templates...' 
                  : `${selectedTemplateIds.length} template${selectedTemplateIds.length > 1 ? 's' : ''} selected`}
              </span>
              <ChevronDown className={`h-4 w-4 transition-transform ${isTemplateDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isTemplateDropdownOpen && (
              <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border rounded-lg shadow-lg max-h-60 overflow-auto">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => toggleTemplateSelection(template.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-gray-600 transition-colors text-left"
                  >
                    <div className={`flex-shrink-0 w-5 h-5 rounded border ${
                      selectedTemplateIds.includes(template.id) 
                        ? 'bg-blue-600 border-blue-600' 
                        : 'border-slate-300'
                    } flex items-center justify-center`}>
                      {selectedTemplateIds.includes(template.id) && (
                        <Check className="h-3 w-3 text-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{template.name}</p>
                      <p className="text-xs text-slate-500 truncate">
                        {template.settings.model} • {template.userPrompts.length} prompt{template.userPrompts.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Selected templates chips */}
        {selectedTemplateIds.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {selectedTemplateIds.map(id => {
              const template = templates.find(t => t.id === id);
              return template ? (
                <span
                  key={id}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium"
                >
                  {template.name}
                  <button
                    type="button"
                    onClick={() => toggleTemplateSelection(id)}
                    className="hover:text-blue-900"
                  >
                    ×
                  </button>
                </span>
              ) : null;
            })}
          </div>
        )}
      </div>
      
      {/* Mode Selection */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <div className="flex space-x-4 mb-6">
          <button 
            className={`px-4 py-2 ${!isBatchMode ? 'bg-blue-500 text-white' : 'border'} rounded-md`}
            onClick={() => toggleMode(false)}
          >
            Single Item
          </button>
          <button 
            className={`px-4 py-2 ${isBatchMode ? 'bg-blue-500 text-white' : 'border'} rounded-md`}
            onClick={() => toggleMode(true)}
          >
            Batch Processing
          </button>
        </div>
        
        {/* Show appropriate input component based on mode */}
        {!isBatchMode ? <SingleInputUpload /> : <BatchInputUpload />}
      </div>
      
      {/* Data Preview */}
      <DataPreviewTable />
      
      {/* Prompt Preview */}
      <PromptPreview />
      
      {/* Navigation Buttons */}
      <div className="flex justify-end space-x-3 mt-6">
        <button 
          className="px-4 py-2 border rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
          onClick={() => router.push('/configure')}
        >
          Back to Configure
        </button>
        <button 
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleRunProcessing}
          disabled={isSubmitting || jobLoading || (isBatchMode ? batchItems.length === 0 : !singleInput.trim())}
        >
          {isSubmitting || jobLoading ? 'Submitting...' : 'Run Processing'}
        </button>
      </div>
    </div>
  );
}
