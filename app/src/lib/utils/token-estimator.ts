/**
 * Token estimation utilities for PromptFlow
 * Uses character-based approximation when actual token counts aren't available
 */

// Pricing per 1K tokens (as of 2024)
export const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  // OpenAI models
  'gpt-4': { input: 0.03, output: 0.06 },
  'gpt-4-turbo': { input: 0.01, output: 0.03 },
  'gpt-4-turbo-preview': { input: 0.01, output: 0.03 },
  'gpt-4o': { input: 0.005, output: 0.015 },
  'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
  'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
  'gpt-3.5-turbo-16k': { input: 0.003, output: 0.004 },
  
  // Anthropic models
  'claude-3-opus': { input: 0.015, output: 0.075 },
  'claude-3-sonnet': { input: 0.003, output: 0.015 },
  'claude-3-haiku': { input: 0.00025, output: 0.00125 },
  'claude-3-5-sonnet': { input: 0.003, output: 0.015 },
  'claude-2': { input: 0.008, output: 0.024 },
  
  // xAI Grok models (pricing per 1M tokens: $0.20 input, $0.50 output)
  'grok-4-1-fast-reasoning': { input: 0.0002, output: 0.0005 },
  'grok-4-1-fast-non-reasoning': { input: 0.0002, output: 0.0005 },
  
  // Default fallback
  'default': { input: 0.01, output: 0.03 }
};

/**
 * Estimate token count from text using character-based approximation
 * Average English text: ~4 characters per token
 * This is a rough estimate; actual tokenization varies by model
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  
  // Average ~4 characters per token for English text
  // Adjust for whitespace and punctuation
  const charCount = text.length;
  const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
  
  // Use a weighted average of character-based and word-based estimates
  // ~0.75 tokens per word, ~0.25 tokens per 4 characters
  const charBasedEstimate = charCount / 4;
  const wordBasedEstimate = wordCount * 1.3;
  
  // Average the two methods for better accuracy
  return Math.ceil((charBasedEstimate + wordBasedEstimate) / 2);
}

/**
 * Get pricing for a specific model
 */
export function getModelPricing(model: string): { input: number; output: number } {
  // Try exact match first
  if (MODEL_PRICING[model]) {
    return MODEL_PRICING[model];
  }
  
  // Try partial match (e.g., "gpt-4-0613" should match "gpt-4")
  const modelLower = model.toLowerCase();
  for (const [key, pricing] of Object.entries(MODEL_PRICING)) {
    if (modelLower.includes(key) || key.includes(modelLower)) {
      return pricing;
    }
  }
  
  return MODEL_PRICING['default'];
}

/**
 * Calculate estimated cost based on token counts and model
 */
export function calculateCost(
  promptTokens: number,
  completionTokens: number,
  model: string = 'gpt-4'
): number {
  const pricing = getModelPricing(model);
  
  const promptCost = (promptTokens / 1000) * pricing.input;
  const completionCost = (completionTokens / 1000) * pricing.output;
  
  return promptCost + completionCost;
}

/**
 * Format cost as currency string
 */
export function formatCost(cost: number): string {
  if (cost < 0.01) {
    return `$${cost.toFixed(4)}`;
  } else if (cost < 1) {
    return `$${cost.toFixed(3)}`;
  } else {
    return `$${cost.toFixed(2)}`;
  }
}

export interface TokenEstimate {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCost: number;
  formattedCost: string;
  model: string;
  isEstimated: boolean;
}

/**
 * Estimate tokens and cost for a result
 */
export function estimateResultTokens(
  input: string,
  output: string,
  systemPrompt: string = '',
  model: string = 'gpt-4'
): TokenEstimate {
  // Prompt includes system prompt + input
  const promptText = systemPrompt + ' ' + input;
  const promptTokens = estimateTokens(promptText);
  const completionTokens = estimateTokens(output);
  const totalTokens = promptTokens + completionTokens;
  const estimatedCost = calculateCost(promptTokens, completionTokens, model);
  
  return {
    promptTokens,
    completionTokens,
    totalTokens,
    estimatedCost,
    formattedCost: formatCost(estimatedCost),
    model,
    isEstimated: true
  };
}
