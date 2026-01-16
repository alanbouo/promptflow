/**
 * Error handling utilities for n8n responses
 */

export interface ApiError {
  status: number;
  message: string;
  details?: string;
}

/**
 * Parse error from n8n response
 */
export function parseN8nError(error: unknown): ApiError {
  // Handle network errors
  if (error instanceof TypeError && error.message === 'Failed to fetch') {
    return {
      status: 503,
      message: 'Unable to connect to n8n server',
      details: 'Please check that the n8n server is running and accessible'
    };
  }
  
  // Handle HTTP errors
  if (error instanceof Response) {
    return {
      status: error.status,
      message: `n8n server responded with status: ${error.status}`,
      details: error.statusText
    };
  }
  
  // Handle JSON parsing errors
  if (error instanceof SyntaxError && error.message.includes('JSON')) {
    return {
      status: 500,
      message: 'Invalid response from n8n server',
      details: 'The server returned an invalid JSON response'
    };
  }
  
  // Handle standard errors
  if (error instanceof Error) {
    return {
      status: 500,
      message: error.message,
      details: error.stack
    };
  }
  
  // Handle unknown errors
  return {
    status: 500,
    message: 'Unknown error occurred',
    details: String(error)
  };
}

/**
 * Format error message for display
 */
export function formatErrorMessage(error: ApiError): string {
  switch (error.status) {
    case 400:
      return `Invalid request: ${error.message}`;
    case 401:
      return 'Authentication required to access n8n server';
    case 403:
      return 'You do not have permission to access this resource';
    case 404:
      return 'The requested resource was not found on the n8n server';
    case 429:
      return 'Rate limit exceeded. Please try again later.';
    case 500:
      return `n8n server error: ${error.message}`;
    case 503:
      return 'n8n server is currently unavailable';
    default:
      return error.message;
  }
}

/**
 * Handle n8n webhook errors
 */
export function handleN8nWebhookError(error: unknown): { message: string; retry: boolean } {
  const parsedError = parseN8nError(error);
  
  // Determine if we should retry
  const retryableStatuses = [408, 429, 500, 502, 503, 504];
  const shouldRetry = retryableStatuses.includes(parsedError.status);
  
  return {
    message: formatErrorMessage(parsedError),
    retry: shouldRetry
  };
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let retries = 0;
  let delay = initialDelay;
  
  while (true) {
    try {
      return await fn();
    } catch (error) {
      if (retries >= maxRetries) {
        throw error;
      }
      
      const { retry } = handleN8nWebhookError(error);
      if (!retry) {
        throw error;
      }
      
      // Wait with exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Increase delay for next retry
      delay *= 2;
      retries++;
    }
  }
}
