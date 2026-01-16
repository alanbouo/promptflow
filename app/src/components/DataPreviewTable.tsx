import React, { useState } from 'react';
import { useInputStore, DataItem } from '../store/input-store';

const DataPreviewTable: React.FC = () => {
  const { isBatchMode, singleInput, batchItems, fileName, fileType } = useInputStore();
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  
  // For single input mode, create a virtual batch item
  const singleItemPreview: DataItem = {
    id: 'single-item',
    content: singleInput
  };
  
  // Determine what to display
  const items = isBatchMode ? batchItems : (singleInput ? [singleItemPreview] : []);
  
  // Limit preview to first 10 items
  const previewItems = items.slice(0, 10);
  const hasMoreItems = items.length > 10;
  
  // Toggle expanded item
  const toggleExpand = (id: string) => {
    if (expandedItem === id) {
      setExpandedItem(null);
    } else {
      setExpandedItem(id);
    }
  };
  
  // Format content for display
  const formatContent = (content: string): string => {
    // Try to parse JSON for better display
    try {
      if (content.trim().startsWith('{') || content.trim().startsWith('[')) {
        const parsed = JSON.parse(content);
        return JSON.stringify(parsed, null, 2);
      }
    } catch (e) {
      // Not valid JSON, continue with normal formatting
    }
    
    return content;
  };
  
  // Truncate text for preview
  const truncateText = (text: string, maxLength: number = 100): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };
  
  if (items.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Preview</h2>
        <p className="text-gray-500 dark:text-gray-400 italic">
          No data available for preview. Please enter or upload some data.
        </p>
      </div>
    );
  }
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Preview</h2>
        {fileName && (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {fileName} ({fileType?.toUpperCase()})
          </div>
        )}
      </div>
      
      {/* Data count summary */}
      <div className="mb-4 text-sm">
        <span className="font-medium">{items.length}</span> data item{items.length !== 1 ? 's' : ''}
        {hasMoreItems && ' (showing first 10)'}
      </div>
      
      {/* Preview table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                #
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Content
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {previewItems.map((item, index) => (
              <React.Fragment key={item.id}>
                <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {index + 1}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="font-mono">
                      {truncateText(item.content)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button
                      className="text-blue-500 hover:text-blue-700"
                      onClick={() => toggleExpand(item.id)}
                    >
                      {expandedItem === item.id ? 'Collapse' : 'Expand'}
                    </button>
                  </td>
                </tr>
                {expandedItem === item.id && (
                  <tr className="bg-gray-50 dark:bg-gray-700">
                    <td className="px-6 py-4"></td>
                    <td colSpan={2} className="px-6 py-4">
                      <pre className="whitespace-pre-wrap break-all text-xs font-mono bg-gray-100 dark:bg-gray-800 p-3 rounded">
                        {formatContent(item.content)}
                      </pre>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Show more info */}
      {hasMoreItems && (
        <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          <p>
            + {items.length - 10} more item{items.length - 10 !== 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  );
};

export default DataPreviewTable;
