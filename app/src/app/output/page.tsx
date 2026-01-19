'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useJobResults } from '../../lib/hooks/useJobResults';
import ResultsTable from '../../components/ResultsTable';
import ProgressIndicator from '../../components/ProgressIndicator';
import SummaryStats from '../../components/SummaryStats';
import LogsPanel from '../../components/LogsPanel';
import ExportButtons from '../../components/ExportButtons';

function OutputPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const jobId = searchParams.get('jobId');
  
  // Get job results
  const { job, results, isLoading, error, refetch } = useJobResults(jobId);
  
  // Redirect to input page if no job ID is provided
  useEffect(() => {
    if (!jobId) {
      router.push('/input');
    }
  }, [jobId, router]);
  
  // Handle new job button click
  const handleNewJob = () => {
    router.push('/input');
  };
  
  // Handle back to input button click
  const handleBackToInput = () => {
    router.push('/input');
  };
  
  // Show error if job not found
  if (!isLoading && !job && jobId) {
    return (
      <div className="max-w-4xl mx-auto pb-12">
        <h1 className="text-3xl font-bold mb-6">Results</h1>
        
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 dark:bg-red-900/30 dark:border-red-600">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Job Not Found
              </h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                <p>The job with ID {jobId} could not be found. It may have been deleted or never existed.</p>
              </div>
              <div className="mt-4">
                <button
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                  onClick={handleNewJob}
                >
                  Start New Job
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Show error if there was a problem fetching job
  if (error) {
    return (
      <div className="max-w-4xl mx-auto pb-12">
        <h1 className="text-3xl font-bold mb-6">Results</h1>
        
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 dark:bg-red-900/30 dark:border-red-600">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Error Loading Job
              </h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                <p>{error}</p>
              </div>
              <div className="mt-4 flex space-x-3">
                <button
                  className="px-4 py-2 border rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={refetch}
                >
                  Try Again
                </button>
                <button
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                  onClick={handleNewJob}
                >
                  Start New Job
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Results</h1>
        
        <ExportButtons 
          results={results} 
          isDisabled={isLoading || !job}
        />
      </div>
      
      {/* Progress Indicator */}
      <ProgressIndicator 
        status={job?.status || 'pending'}
        itemsCompleted={results.length}
        itemsTotal={job?.inputData?.length || 0}
        startedAt={job?.startedAt}
      />
      
      {/* Summary Stats */}
      <SummaryStats 
        results={results}
        startedAt={job?.startedAt}
        completedAt={job?.completedAt}
        model={job?.config?.settings?.model}
        systemPrompt={job?.config?.systemPrompt}
      />
      
      {/* Results Table */}
      <ResultsTable 
        results={results}
        isLoading={isLoading}
      />
      
      {/* Logs Panel */}
      <LogsPanel 
        logs={job?.logs || []}
        isLoading={isLoading}
      />
      
      {/* Navigation Buttons */}
      <div className="flex justify-end space-x-3 mt-6">
        <button 
          className="px-4 py-2 border rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
          onClick={handleBackToInput}
        >
          Back to Input
        </button>
        <button 
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          onClick={handleNewJob}
        >
          New Job
        </button>
      </div>
    </div>
  );
}

export default function OutputPage() {
  return (
    <Suspense fallback={<div className="max-w-4xl mx-auto pb-12"><h1 className="text-3xl font-bold mb-6">Loading...</h1></div>}>
      <OutputPageContent />
    </Suspense>
  );
}
