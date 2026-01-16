/**
 * Job types for PromptFlow
 */

export type JobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface JobResult {
  input: string;
  intermediates?: string[];
  finalOutput: string;
  tokenUsage: {
    prompt: number;
    completion: number;
  };
  status: 'success' | 'error';
  error?: string;
}

export interface JobConfig {
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

export interface Job {
  id: string;
  n8nExecutionId?: string;
  status: JobStatus;
  templateId?: string;
  config: JobConfig;
  inputData: string[];
  results?: JobResult[];
  logs?: string[];
  tokenUsage: number;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
}

export interface CreateJobRequest {
  templateId?: string;
  config: JobConfig;
  inputData: string[];
}

export interface UpdateJobRequest {
  n8nExecutionId?: string;
  status?: JobStatus;
  results?: JobResult[];
  logs?: string[];
  tokenUsage?: number;
  completedAt?: Date;
}

export interface JobSummary {
  id: string;
  status: JobStatus;
  itemsTotal: number;
  itemsCompleted: number;
  tokenUsage: number;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
}
