import { create } from 'zustand';
import { Job, JobStatus, JobSummary } from '../lib/types/job';
import apiClient from '../lib/api-client';

export interface JobState {
  // Current job
  currentJobId: string | null;
  currentJob: Job | null;
  isLoading: boolean;
  error: string | null;
  
  // Job list
  jobs: JobSummary[];
  isLoadingJobs: boolean;
  
  // Polling
  isPolling: boolean;
  pollingInterval: number | null;
  
  // Actions
  setCurrentJobId: (id: string | null) => void;
  setCurrentJob: (job: Job | null) => void;
  setIsLoading: (isLoading: boolean) => void;
  setIsLoadingJobs: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  setJobs: (jobs: JobSummary[]) => void;
  addJob: (job: JobSummary) => void;
  updateJobStatus: (id: string, status: JobStatus) => void;
  startPolling: (id: string, interval?: number) => void;
  stopPolling: () => void;
  reset: () => void;
}

const initialState = {
  currentJobId: null,
  currentJob: null,
  isLoading: false,
  error: null,
  jobs: [],
  isLoadingJobs: false,
  isPolling: false,
  pollingInterval: null,
};

export const useJobStore = create<JobState>((set, get) => ({
  ...initialState,
  
  setCurrentJobId: (id) => set({ currentJobId: id }),
  
  setCurrentJob: (job) => set({ currentJob: job }),
  
  setIsLoading: (isLoading) => set({ isLoading }),
  
  setIsLoadingJobs: (isLoadingJobs) => set({ isLoadingJobs }),
  
  setError: (error) => set({ error }),
  
  setJobs: (jobs) => set({ jobs }),
  
  addJob: (job) => set((state) => ({
    jobs: [job, ...state.jobs]
  })),
  
  updateJobStatus: (id, status) => set((state) => ({
    jobs: state.jobs.map(job => 
      job.id === id ? { ...job, status } : job
    ),
    currentJob: state.currentJob && state.currentJob.id === id 
      ? { ...state.currentJob, status } 
      : state.currentJob
  })),
  
  startPolling: (id, interval = 3000) => {
    // Clear any existing interval without triggering a React state update
    const { pollingInterval } = get();
    if (pollingInterval !== null) {
      window.clearInterval(pollingInterval);
    }

    const pollingId = window.setInterval(async () => {
      try {
        const result = await apiClient.getJob(id);
        if (result.error || !result.data) {
          throw new Error(result.error || 'Failed to fetch job');
        }

        set({ currentJob: result.data });
      } catch (error) {
        console.error('Error polling job status:', error);
      }
    }, interval);

    set({
      isPolling: true,
      pollingInterval: pollingId as unknown as number
    });
  },
  
  stopPolling: () => {
    const { pollingInterval } = get();
    if (pollingInterval !== null) {
      window.clearInterval(pollingInterval);
      set({ isPolling: false, pollingInterval: null });
    }
  },
  
  reset: () => set(initialState)
}));
