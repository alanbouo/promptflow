import { DataItem } from '../../store/input-store';

export interface InputValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validates single input data
 */
export function validateSingleInput(input: string): InputValidationResult {
  const errors: string[] = [];
  
  if (!input.trim()) {
    errors.push('Input data cannot be empty');
  }
  
  // Check if input is too large (arbitrary limit for demo purposes)
  if (input.length > 100000) {
    errors.push('Input data is too large (max 100,000 characters)');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates batch input data
 */
export function validateBatchInput(items: DataItem[]): InputValidationResult {
  const errors: string[] = [];
  
  if (items.length === 0) {
    errors.push('Batch input must contain at least one item');
  }
  
  // Check if batch is too large (arbitrary limit for demo purposes)
  if (items.length > 1000) {
    errors.push('Batch input is too large (max 1,000 items)');
  }
  
  // Check for empty items
  const emptyItems = items.filter(item => !item.content.trim());
  if (emptyItems.length > 0) {
    errors.push(`${emptyItems.length} empty item(s) found in batch input`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates all input data based on mode
 */
export function validateInput(
  isBatchMode: boolean, 
  singleInput: string, 
  batchItems: DataItem[]
): InputValidationResult {
  if (isBatchMode) {
    return validateBatchInput(batchItems);
  } else {
    return validateSingleInput(singleInput);
  }
}
