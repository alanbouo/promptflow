import { useState, useEffect } from 'react';
import { useJobStore } from '../../store/job-store';
import { Job, JobResult } from '../types/job';
import { JobService } from '../services/job-service';
import { retryWithBackoff } from '../utils/error-handler';

interface UseJobResultsReturn {
  job: Job | null;
  results: JobResult[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch and manage job results
 */
export function useJobResults(jobId: string | null): UseJobResultsReturn {
  const { 
    currentJob, 
    setCurrentJob, 
    isLoading, 
    setIsLoading, 
    error, 
    setError,
    isPolling,
    startPolling,
    stopPolling
  } = useJobStore();
  
  const [results, setResults] = useState<JobResult[]>([]);
  
  // Fetch job data
  const fetchJobData = async () => {
    if (!jobId) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Use retry with backoff for reliability
      const job = await retryWithBackoff(() => JobService.fetchJob(jobId));
      
      if (job) {
        setCurrentJob(job);
        setResults(job.results || []);
      }
    } catch (error) {
      console.error('Error fetching job results:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch job results');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Start polling if job is running
  useEffect(() => {
    if (!jobId) return;
    
    // Initial fetch
    fetchJobData();
    
    // Start polling if job is running and not already polling
    if (currentJob && currentJob.status === 'running' && !isPolling) {
      startPolling(jobId);
    }
    
    // Stop polling when component unmounts
    return () => {
      stopPolling();
    };
  }, [jobId]);
  
  // Update results when currentJob changes
  useEffect(() => {
    if (currentJob && currentJob.results) {
      setResults(currentJob.results);
    }
  }, [currentJob]);
  
  // Stop polling when job is complete
  useEffect(() => {
    if (currentJob && ['completed', 'failed', 'cancelled'].includes(currentJob.status)) {
      stopPolling();
    }
  }, [currentJob?.status]);
  
  return {
    job: currentJob,
    results,
    isLoading,
    error,
    refetch: fetchJobData
  };
}
