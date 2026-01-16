/**
 * n8n client for PromptFlow
 * Handles communication with n8n webhooks
 */

export interface SingleProcessPayload {
  jobId: string;
  systemPrompt: string;
  userPrompts: string[];
  settings: {
    provider: string;
    model: string;
    temperature: number;
    maxTokens: number;
  };
  dataItem: string;
}

export interface BatchProcessPayload {
  jobId: string;
  systemPrompt: string;
  userPrompts: string[];
  settings: {
    provider: string;
    model: string;
    temperature: number;
    maxTokens: number;
  };
  dataItems: string[];
  batchSize: number;
  callbackUrl: string;
}

export interface ProcessResult {
  jobId: string;
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

export interface N8nExecutionInfo {
  executionId: string;
  status: 'running' | 'success' | 'error' | 'waiting';
  progress?: {
    total: number;
    completed: number;
  };
}

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;
const NEXT_PUBLIC_APP_URL = process.env.NEXT_PUBLIC_APP_URL;

if (!N8N_WEBHOOK_URL) {
  console.error('N8N_WEBHOOK_URL environment variable is not set');
}

if (!NEXT_PUBLIC_APP_URL) {
  console.error('NEXT_PUBLIC_APP_URL environment variable is not set');
}

/**
 * Process a single data item through n8n
 */
export async function processSingle(payload: SingleProcessPayload): Promise<ProcessResult> {
  try {
    const response = await fetch(`${N8N_WEBHOOK_URL}/process-single`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      throw new Error(`n8n webhook responded with status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error calling n8n webhook:', error);
    return {
      jobId: payload.jobId,
      input: payload.dataItem,
      finalOutput: '',
      tokenUsage: { prompt: 0, completion: 0 },
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Process multiple data items through n8n (batch processing)
 * This is fire-and-forget; n8n will call back when done
 */
export async function processBatch(payload: BatchProcessPayload): Promise<N8nExecutionInfo | null> {
  try {
    const response = await fetch(`${N8N_WEBHOOK_URL}/process-batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      throw new Error(`n8n webhook responded with status: ${response.status}`);
    }
    
    // Parse the response to get the execution ID
    const result = await response.json();
    
    if (result && result.executionId) {
      return {
        executionId: result.executionId,
        status: 'running',
        progress: {
          total: payload.dataItems.length,
          completed: 0
        }
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error calling n8n webhook:', error);
    throw error;
  }
}

/**
 * Check the status of an n8n execution
 */
export async function checkExecutionStatus(executionId: string): Promise<N8nExecutionInfo> {
  try {
    // This endpoint would need to be implemented in n8n
    const response = await fetch(`${N8N_WEBHOOK_URL}/execution/${executionId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (!response.ok) {
      throw new Error(`n8n execution status check failed: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error checking n8n execution status:', error);
    return {
      executionId,
      status: 'error'
    };
  }
}

/**
 * Cancel an n8n execution
 */
export async function cancelExecution(executionId: string): Promise<boolean> {
  try {
    // This endpoint would need to be implemented in n8n
    const response = await fetch(`${N8N_WEBHOOK_URL}/execution/${executionId}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    
    return response.ok;
  } catch (error) {
    console.error('Error cancelling n8n execution:', error);
    return false;
  }
}

/**
 * Test the n8n connectivity
 * @returns true if n8n is reachable, false otherwise
 */
export async function testN8nConnectivity(): Promise<boolean> {
  try {
    // Try to fetch the n8n webhook URL to see if it's reachable
    const response = await fetch(N8N_WEBHOOK_URL || '', {
      method: 'HEAD',
    });
    
    return response.ok;
  } catch (error) {
    console.error('Error testing n8n connectivity:', error);
    return false;
  }
}
