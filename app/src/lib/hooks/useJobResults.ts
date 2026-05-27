import { useEffect, useCallback } from 'react';
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

export function useJobResults(jobId: string | null): UseJobResultsReturn {
  const {
    currentJob,
    isLoading,
    error,
    startPolling,
    stopPolling
  } = useJobStore();

  const fetchJobData = useCallback(async () => {
    if (!jobId) return;
    // JobService.fetchJob handles all store updates (isLoading, error, currentJob)
    try {
      await retryWithBackoff(() => JobService.fetchJob(jobId));
    } catch (err) {
      console.error('Error fetching job results:', err);
    }
  }, [jobId]);

  // Fetch on mount / jobId change, stop polling on unmount
  useEffect(() => {
    if (!jobId) return;
    fetchJobData();
    return () => { stopPolling(); };
  }, [jobId, fetchJobData]); // eslint-disable-line react-hooks/exhaustive-deps

  // Start or stop polling based solely on job status
  useEffect(() => {
    if (!currentJob) return;
    if (currentJob.status === 'running') {
      startPolling(currentJob.id);
    } else if (['completed', 'failed', 'cancelled'].includes(currentJob.status)) {
      stopPolling();
    }
  }, [currentJob?.status]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    job: currentJob,
    results: currentJob?.results ?? [],
    isLoading,
    error,
    refetch: fetchJobData
  };
}
