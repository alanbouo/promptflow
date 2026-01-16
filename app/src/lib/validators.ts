import { UserPrompt, ConfigSettings } from '../store/config-store';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validates system prompt
 */
export function validateSystemPrompt(systemPrompt: string): ValidationResult {
  const errors: string[] = [];
  
  if (!systemPrompt.trim()) {
    errors.push('System prompt cannot be empty');
  }
  
  if (systemPrompt.length > 1000) {
    errors.push('System prompt is too long (max 1000 characters)');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates user prompts
 */
export function validateUserPrompts(userPrompts: UserPrompt[]): ValidationResult {
  const errors: string[] = [];
  
  if (userPrompts.length === 0) {
    errors.push('At least one user prompt is required');
    return { isValid: false, errors };
  }
  
  // Check if first prompt contains {input}
  const firstPrompt = userPrompts[0];
  if (!firstPrompt.content.includes('{input}')) {
    errors.push('First prompt must contain {input} placeholder');
  }
  
  // Check if chained prompts contain {previous_output}
  for (let i = 1; i < userPrompts.length; i++) {
    if (!userPrompts[i].content.includes('{previous_output}')) {
      errors.push(`Prompt ${i + 1} must contain {previous_output} placeholder for chaining`);
    }
  }
  
  // Check for empty prompts
  userPrompts.forEach((prompt, index) => {
    if (!prompt.content.trim()) {
      errors.push(`Prompt ${index + 1} cannot be empty`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates LLM settings
 */
export function validateSettings(settings: ConfigSettings): ValidationResult {
  const errors: string[] = [];
  
  // Validate temperature
  if (settings.temperature < 0 || settings.temperature > 2) {
    errors.push('Temperature must be between 0 and 2');
  }
  
  // Validate max tokens
  if (settings.maxTokens < 1) {
    errors.push('Max tokens must be at least 1');
  }
  
  if (settings.maxTokens > 32000) {
    errors.push('Max tokens cannot exceed 32000');
  }
  
  // Validate concurrent requests
  if (settings.batchProcessing && (settings.concurrentRequests < 1 || settings.concurrentRequests > 10)) {
    errors.push('Concurrent requests must be between 1 and 10');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates the entire configuration
 */
export function validateConfig(
  systemPrompt: string,
  userPrompts: UserPrompt[],
  settings: ConfigSettings
): ValidationResult {
  const systemPromptValidation = validateSystemPrompt(systemPrompt);
  const userPromptsValidation = validateUserPrompts(userPrompts);
  const settingsValidation = validateSettings(settings);
  
  const allErrors = [
    ...systemPromptValidation.errors,
    ...userPromptsValidation.errors,
    ...settingsValidation.errors
  ];
  
  return {
    isValid: allErrors.length === 0,
    errors: allErrors
  };
}
