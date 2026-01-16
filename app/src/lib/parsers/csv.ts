import { DataItem } from '../../store/input-store';

/**
 * Parse CSV data into an array of data items
 */
export function parseCSV(
  csvData: string, 
  hasHeaders: boolean = true, 
  delimiter: string = ','
): { items: DataItem[], headers?: string[] } {
  try {
    // Split by newlines
    const lines = csvData
      .split(/\r?\n/)
      .filter(line => line.trim() !== '');
    
    if (lines.length === 0) {
      throw new Error('CSV file is empty');
    }
    
    // Parse headers if needed
    let headers: string[] | undefined;
    let startIndex = 0;
    
    if (hasHeaders) {
      headers = parseCSVLine(lines[0], delimiter);
      startIndex = 1;
    }
    
    // Parse data rows
    const items: DataItem[] = [];
    for (let i = startIndex; i < lines.length; i++) {
      const values = parseCSVLine(lines[i], delimiter);
      
      if (values.length === 0) continue;
      
      if (headers) {
        // Create an object with headers as keys
        const obj: Record<string, string> = {};
        for (let j = 0; j < Math.min(headers.length, values.length); j++) {
          obj[headers[j]] = values[j];
        }
        items.push({
          id: `row-${i}`,
          content: JSON.stringify(obj)
        });
      } else {
        // If no headers, use the whole line as content
        items.push({
          id: `row-${i}`,
          content: values.join(delimiter)
        });
      }
    }
    
    return { items, headers };
  } catch (error) {
    throw new Error(`Failed to parse CSV: ${(error as Error).message}`);
  }
}

/**
 * Parse a single CSV line, handling quoted values
 */
function parseCSVLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      // Handle quotes
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        // Double quotes inside quotes - add a single quote
        current += '"';
        i++;
      } else {
        // Toggle quote mode
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      // End of field
      result.push(current);
      current = '';
    } else {
      // Add character to current field
      current += char;
    }
  }
  
  // Add the last field
  result.push(current);
  
  return result;
}
