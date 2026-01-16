import { JobResult } from '../types/job';

/**
 * Export job results to CSV format
 */
export function exportToCSV(results: JobResult[]): string {
  // Define CSV headers
  const headers = ['Input', 'Output', 'Status', 'Prompt Tokens', 'Completion Tokens', 'Total Tokens', 'Error'];
  
  // Convert results to CSV rows
  const rows = results.map(result => {
    return [
      // Escape quotes in fields
      `"${result.input.replace(/"/g, '""')}"`,
      `"${result.finalOutput.replace(/"/g, '""')}"`,
      result.status,
      result.tokenUsage?.prompt || 0,
      result.tokenUsage?.completion || 0,
      (result.tokenUsage?.prompt || 0) + (result.tokenUsage?.completion || 0),
      `"${(result.error || '').replace(/"/g, '""')}"`
    ].join(',');
  });
  
  // Combine headers and rows
  return [headers.join(','), ...rows].join('\n');
}

/**
 * Export job results to JSON format
 */
export function exportToJSON(results: JobResult[]): string {
  // Format results for export
  const exportData = results.map(result => ({
    input: result.input,
    output: result.finalOutput,
    status: result.status,
    tokenUsage: result.tokenUsage,
    error: result.error || null,
    intermediates: result.intermediates || []
  }));
  
  return JSON.stringify(exportData, null, 2);
}

/**
 * Download data as a file
 */
export function downloadFile(data: string, filename: string, mimeType: string): void {
  // Create a blob with the data
  const blob = new Blob([data], { type: mimeType });
  
  // Create a download link
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  
  // Trigger the download
  document.body.appendChild(link);
  link.click();
  
  // Clean up
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export results to a file
 */
export function exportResults(results: JobResult[], format: 'csv' | 'json'): void {
  if (results.length === 0) {
    console.warn('No results to export');
    return;
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  
  if (format === 'csv') {
    const csvData = exportToCSV(results);
    downloadFile(csvData, `promptflow-results-${timestamp}.csv`, 'text/csv');
  } else {
    const jsonData = exportToJSON(results);
    downloadFile(jsonData, `promptflow-results-${timestamp}.json`, 'application/json');
  }
}
