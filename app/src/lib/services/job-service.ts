import { useConfigStore } from '../../store/config-store';
import { useInputStore } from '../../store/input-store';
import { useJobStore } from '../../store/job-store';
import { CreateJobRequest, Job, JobSummary, JobConfig } from '../types/job';
import apiClient from '../api-client';

interface TemplateConfig {
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

/**
 * Service for job submission and management
 */
export const JobService = {
  /**
   * Submit a new job for processing
   */
  async submitJob(): Promise<string | null> {
    // Get configuration and input data from stores
    const configStore = useConfigStore.getState();
    const inputStore = useInputStore.getState();
    const jobStore = useJobStore.getState();
    
    try {
      // Set loading state
      jobStore.setIsLoading(true);
      jobStore.setError(null);
      
      // Prepare input data
      const inputData = inputStore.isBatchMode
        ? inputStore.batchItems.map(item => item.content)
        : [inputStore.singleInput];
      
      // Prepare job request
      const jobRequest: CreateJobRequest = {
        config: {
          systemPrompt: configStore.systemPrompt,
          userPrompts: configStore.userPrompts,
          settings: configStore.settings
        },
        inputData
      };
      
      // Submit job to API
      const result = await apiClient.createJob(jobRequest);
      
      if (result.error || !result.data) {
        throw new Error(result.error || 'Failed to create job');
      }
      
      const data = result.data;
      
      // Add job to store
      const jobSummary: JobSummary = {
        id: data.id,
        status: data.status,
        itemsTotal: inputData.length,
        itemsCompleted: 0,
        tokenUsage: 0,
        createdAt: new Date()
      };
      
      jobStore.addJob(jobSummary);
      jobStore.setCurrentJobId(data.id);
      
      // Start polling for job updates
      jobStore.startPolling(data.id);
      
      return data.id;
    } catch (error) {
      console.error('Error submitting job:', error);
      jobStore.setError(error instanceof Error ? error.message : 'Unknown error');
      return null;
    } finally {
      jobStore.setIsLoading(false);
    }
  },
  
  /**
   * Submit a job with a specific template configuration
   */
  async submitJobWithTemplate(template: TemplateConfig): Promise<string | null> {
    const inputStore = useInputStore.getState();
    const jobStore = useJobStore.getState();
    
    try {
      jobStore.setIsLoading(true);
      jobStore.setError(null);
      
      // Prepare input data
      const inputData = inputStore.isBatchMode
        ? inputStore.batchItems.map(item => item.content)
        : [inputStore.singleInput];
      
      // Prepare job request using template config
      const jobRequest: CreateJobRequest = {
        templateId: template.id,
        config: {
          systemPrompt: template.systemPrompt,
          userPrompts: template.userPrompts,
          settings: template.settings
        },
        inputData
      };
      
      // Submit job to API
      const result = await apiClient.createJob(jobRequest);
      
      if (result.error || !result.data) {
        throw new Error(result.error || 'Failed to create job');
      }
      
      const data = result.data;
      
      // Add job to store
      const jobSummary: JobSummary = {
        id: data.id,
        status: data.status,
        itemsTotal: inputData.length,
        itemsCompleted: 0,
        tokenUsage: 0,
        createdAt: new Date()
      };
      
      jobStore.addJob(jobSummary);
      
      return data.id;
    } catch (error) {
      console.error('Error submitting job with template:', error);
      jobStore.setError(error instanceof Error ? error.message : 'Unknown error');
      return null;
    } finally {
      jobStore.setIsLoading(false);
    }
  },
  
  /**
   * Fetch a specific job by ID
   */
  async fetchJob(id: string): Promise<Job | null> {
    try {
      const jobStore = useJobStore.getState();
      jobStore.setIsLoading(true);
      jobStore.setError(null);
      
      const result = await apiClient.getJob(id);
      
      if (result.error || !result.data) {
        throw new Error(result.error || 'Failed to fetch job');
      }
      
      const job = result.data;
      jobStore.setCurrentJob(job);
      jobStore.setCurrentJobId(id);
      
      return job;
    } catch (error) {
      console.error('Error fetching job:', error);
      useJobStore.getState().setError(error instanceof Error ? error.message : 'Unknown error');
      return null;
    } finally {
      useJobStore.getState().setIsLoading(false);
    }
  },
  
  /**
   * Fetch all jobs
   */
  async fetchJobs(): Promise<JobSummary[]> {
    try {
      const jobStore = useJobStore.getState();
      jobStore.setIsLoadingJobs(true);
      
      const result = await apiClient.getJobs();
      
      if (result.error || !result.data) {
        throw new Error(result.error || 'Failed to fetch jobs');
      }
      
      const jobs = result.data;
      jobStore.setJobs(jobs);
      
      return jobs;
    } catch (error) {
      console.error('Error fetching jobs:', error);
      return [];
    } finally {
      useJobStore.getState().setIsLoadingJobs(false);
    }
  },
  
  /**
   * Cancel a job
   */
  async cancelJob(id: string): Promise<boolean> {
    try {
      const jobStore = useJobStore.getState();
      
      const result = await apiClient.deleteJob(id);
      
      if (result.error) {
        throw new Error(result.error || 'Failed to cancel job');
      }
      
      // Update job status in store
      jobStore.updateJobStatus(id, 'cancelled');
      
      // Stop polling if this is the current job
      if (jobStore.currentJobId === id) {
        jobStore.stopPolling();
      }
      
      return true;
    } catch (error) {
      console.error('Error cancelling job:', error);
      return false;
    }
  }
};
