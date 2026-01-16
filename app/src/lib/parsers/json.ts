import { DataItem } from '../../store/input-store';

/**
 * Parse JSON data into an array of data items
 */
export function parseJSON(jsonData: string): DataItem[] {
  try {
    // Parse the JSON
    const parsed = JSON.parse(jsonData);
    
    // Handle different JSON formats
    if (Array.isArray(parsed)) {
      // Array of items
      return parsed.map((item, index) => ({
        id: `item-${index}`,
        content: typeof item === 'string' ? item : JSON.stringify(item)
      }));
    } else if (typeof parsed === 'object' && parsed !== null) {
      // Single object - treat each property as an item
      return Object.entries(parsed).map(([key, value], index) => ({
        id: `item-${index}`,
        content: typeof value === 'string' ? value : JSON.stringify(value)
      }));
    } else {
      // Single value
      return [{
        id: 'item-0',
        content: String(parsed)
      }];
    }
  } catch (error) {
    throw new Error(`Failed to parse JSON: ${(error as Error).message}`);
  }
}

/**
 * Detect if a string is likely JSON
 */
export function isLikelyJSON(text: string): boolean {
  const trimmed = text.trim();
  return (
    (trimmed.startsWith('{') && trimmed.endsWith('}')) || 
    (trimmed.startsWith('[') && trimmed.endsWith(']'))
  );
}
