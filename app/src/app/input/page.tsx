'use client';

import { useState, useEffect } from 'react';
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
  
  // Initialize batch mode from config settings - only on client side
  useEffect(() => {
    setIsClient(true);
    setIsBatchMode(settings.batchProcessing);
  }, []);
  
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
      // Scroll to top to show errors
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    
    // Clear any previous validation errors
    setValidationErrors([]);
    setIsSubmitting(true);
    
    try {
      // Submit the job
      const jobId = await JobService.submitJob();
      
      if (jobId) {
        // Navigate to the output page with the job ID
        router.push(`/output?jobId=${jobId}`);
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
