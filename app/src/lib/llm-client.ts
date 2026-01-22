/**
 * Direct LLM client for PromptFlow
 * Handles API calls to various LLM providers (OpenAI, Anthropic, xAI)
 */

export interface LLMSettings {
  provider: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

export interface LLMRequest {
  systemPrompt: string;
  userPrompts: string[];
  dataItem: string;
  settings: LLMSettings;
}

export interface LLMResponse {
  output: string;
  tokenUsage: {
    prompt: number;
    completion: number;
  };
}

// API endpoints for different providers
const API_ENDPOINTS: Record<string, string> = {
  openai: 'https://api.openai.com/v1/chat/completions',
  anthropic: 'https://api.anthropic.com/v1/messages',
  xai: 'https://api.x.ai/v1/chat/completions',
};

// Get API key from environment based on provider
function getApiKey(provider: string): string {
  switch (provider) {
    case 'openai':
      return process.env.OPENAI_API_KEY || '';
    case 'anthropic':
      return process.env.ANTHROPIC_API_KEY || '';
    case 'xai':
      return process.env.XAI_API_KEY || '';
    default:
      return '';
  }
}

/**
 * Build the full prompt by replacing {input} placeholder with data
 */
function buildPrompt(userPrompts: string[], dataItem: string, previousOutput?: string): string {
  let result = '';
  
  for (let i = 0; i < userPrompts.length; i++) {
    let prompt = userPrompts[i];
    // Replace {input} with the data item
    prompt = prompt.replace(/\{input\}/g, dataItem);
    // Replace {previous_output} with the previous output (for chaining)
    if (previousOutput) {
      prompt = prompt.replace(/\{previous_output\}/g, previousOutput);
    }
    result += prompt + '\n';
  }
  
  return result.trim();
}

// Default timeout for LLM API calls (2 minutes for reasoning models)
const LLM_TIMEOUT_MS = 120000;

/**
 * Call OpenAI-compatible API (works for OpenAI and xAI)
 */
async function callOpenAICompatible(
  endpoint: string,
  apiKey: string,
  model: string,
  systemPrompt: string,
  userMessage: string,
  temperature: number,
  maxTokens: number
): Promise<LLMResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), LLM_TIMEOUT_MS);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        temperature,
        max_tokens: maxTokens,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    
    return {
      output: data.choices[0]?.message?.content || '',
      tokenUsage: {
        prompt: data.usage?.prompt_tokens || 0,
        completion: data.usage?.completion_tokens || 0,
      },
    };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`LLM API request timed out after ${LLM_TIMEOUT_MS / 1000}s. The API may be slow or unreachable.`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Call Anthropic API
 */
async function callAnthropic(
  apiKey: string,
  model: string,
  systemPrompt: string,
  userMessage: string,
  temperature: number,
  maxTokens: number
): Promise<LLMResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), LLM_TIMEOUT_MS);

  try {
    const response = await fetch(API_ENDPOINTS.anthropic, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: [
          { role: 'user', content: userMessage },
        ],
        temperature,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Anthropic API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    
    return {
      output: data.content[0]?.text || '',
      tokenUsage: {
        prompt: data.usage?.input_tokens || 0,
        completion: data.usage?.output_tokens || 0,
      },
    };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Anthropic API request timed out after ${LLM_TIMEOUT_MS / 1000}s. The API may be slow or unreachable.`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Main function to call LLM based on provider
 */
export async function callLLM(request: LLMRequest): Promise<LLMResponse> {
  const { systemPrompt, userPrompts, dataItem, settings } = request;
  const { provider, model, temperature, maxTokens } = settings;
  
  const apiKey = getApiKey(provider);
  if (!apiKey) {
    throw new Error(`API key not configured for provider: ${provider}. Please set the appropriate environment variable.`);
  }

  // Build the user message from prompts
  const userMessage = buildPrompt(userPrompts, dataItem);

  switch (provider) {
    case 'openai':
      return callOpenAICompatible(
        API_ENDPOINTS.openai,
        apiKey,
        model,
        systemPrompt,
        userMessage,
        temperature,
        maxTokens
      );
    
    case 'xai':
      return callOpenAICompatible(
        API_ENDPOINTS.xai,
        apiKey,
        model,
        systemPrompt,
        userMessage,
        temperature,
        maxTokens
      );
    
    case 'anthropic':
      return callAnthropic(
        apiKey,
        model,
        systemPrompt,
        userMessage,
        temperature,
        maxTokens
      );
    
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

/**
 * Process a single item with prompt chaining support
 */
export async function processWithChaining(
  systemPrompt: string,
  userPrompts: string[],
  dataItem: string,
  settings: LLMSettings
): Promise<{ finalOutput: string; intermediates: string[]; tokenUsage: { prompt: number; completion: number } }> {
  const intermediates: string[] = [];
  let totalPromptTokens = 0;
  let totalCompletionTokens = 0;
  let previousOutput = '';

  // If there's only one prompt, process it directly
  if (userPrompts.length === 1) {
    const result = await callLLM({
      systemPrompt,
      userPrompts,
      dataItem,
      settings,
    });
    
    return {
      finalOutput: result.output,
      intermediates: [],
      tokenUsage: result.tokenUsage,
    };
  }

  // Process each prompt in sequence (chaining)
  for (let i = 0; i < userPrompts.length; i++) {
    const currentPrompt = userPrompts[i]
      .replace(/\{input\}/g, dataItem)
      .replace(/\{previous_output\}/g, previousOutput);

    const result = await callLLM({
      systemPrompt,
      userPrompts: [currentPrompt],
      dataItem: '', // Already replaced in currentPrompt
      settings,
    });

    totalPromptTokens += result.tokenUsage.prompt;
    totalCompletionTokens += result.tokenUsage.completion;

    // Store intermediate results (except the last one)
    if (i < userPrompts.length - 1) {
      intermediates.push(result.output);
    }

    previousOutput = result.output;
  }

  return {
    finalOutput: previousOutput,
    intermediates,
    tokenUsage: {
      prompt: totalPromptTokens,
      completion: totalCompletionTokens,
    },
  };
}
