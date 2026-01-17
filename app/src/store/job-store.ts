import { create } from 'zustand';
import { Job, JobStatus, JobSummary } from '../lib/types/job';

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
    // Clear any existing polling
    const { stopPolling } = get();
    stopPolling();
    
    // Start new polling
    const pollingId = window.setInterval(async () => {
      try {
        const response = await fetch(`/api/jobs/${id}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch job: ${response.statusText}`);
        }
        
        const job = await response.json();
        set({ currentJob: job });
        
        // Stop polling if job is completed, failed, or cancelled
        if (['completed', 'failed', 'cancelled'].includes(job.status)) {
          stopPolling();
        }
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
