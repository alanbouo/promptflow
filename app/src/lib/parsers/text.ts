import { DataItem } from '../../store/input-store';
import { isLikelyJSON } from './json';

/**
 * Parse plain text data into an array of data items
 * Each line becomes a separate data item
 */
export function parseText(textData: string): DataItem[] {
  try {
    // Check if it might be JSON first
    if (isLikelyJSON(textData)) {
      throw new Error('Text appears to be JSON. Use JSON parser instead.');
    }
    
    // Split by newlines
    const lines = textData
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(line => line !== '');
    
    if (lines.length === 0) {
      throw new Error('Text is empty');
    }
    
    // Create data items
    return lines.map((line, index) => ({
      id: `line-${index}`,
      content: line
    }));
  } catch (error) {
    throw new Error(`Failed to parse text: ${(error as Error).message}`);
  }
}

/**
 * Unified parser that tries to detect the format and parse accordingly
 */
export function autoDetectAndParse(data: string): { 
  items: DataItem[],
  detectedFormat: 'json' | 'csv' | 'text'
} {
  // Try to detect the format
  if (isLikelyJSON(data)) {
    try {
      const items = require('./json').parseJSON(data);
      return { items, detectedFormat: 'json' };
    } catch (e) {
      // Fall back to text if JSON parsing fails
    }
  }
  
  // Check if it looks like CSV (contains commas and multiple lines)
  const hasCommas = data.includes(',');
  const hasMultipleLines = data.includes('\n');
  
  if (hasCommas && hasMultipleLines) {
    try {
      const { items } = require('./csv').parseCSV(data, true, ',');
      return { items, detectedFormat: 'csv' };
    } catch (e) {
      // Fall back to text if CSV parsing fails
    }
  }
  
  // Default to plain text
  const items = parseText(data);
  return { items, detectedFormat: 'text' };
}
