import React from 'react';
import { JobResult } from '../lib/types/job';
import { exportResults } from '../lib/utils/export-utils';

interface ExportButtonsProps {
  results: JobResult[];
  isDisabled: boolean;
}

const ExportButtons: React.FC<ExportButtonsProps> = ({ results, isDisabled }) => {
  // Handle export to CSV
  const handleExportCSV = () => {
    exportResults(results, 'csv');
  };
  
  // Handle export to JSON
  const handleExportJSON = () => {
    exportResults(results, 'json');
  };
  
  return (
    <div className="flex space-x-2">
      <button
        className="px-3 py-1 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={handleExportCSV}
        disabled={isDisabled || results.length === 0}
      >
        Export CSV
      </button>
      <button
        className="px-3 py-1 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={handleExportJSON}
        disabled={isDisabled || results.length === 0}
      >
        Export JSON
      </button>
    </div>
  );
};

export default ExportButtons;
