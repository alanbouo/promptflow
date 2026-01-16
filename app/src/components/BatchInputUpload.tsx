import React, { useRef, useState } from 'react';
import { useInputStore } from '../store/input-store';
import { parseCSV, parseJSON, parseText, autoDetectAndParse } from '../lib/parsers';

const BatchInputUpload: React.FC = () => {
  const { 
    batchItems, 
    setBatchItems, 
    setFileInfo, 
    csvHasHeaders, 
    csvDelimiter,
    setCsvOptions,
    setParseError,
    fileName
  } = useInputStore();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pasteValue, setPasteValue] = useState('');
  const [showCsvOptions, setShowCsvOptions] = useState(false);
  
  // Handle file upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      setParseError(null);
      
      // Read the file
      const text = await readFile(file);
      
      // Determine file type from extension
      const fileType = getFileType(file.name);
      setFileInfo(file.name, fileType);
      
      // Parse based on file type
      let items;
      if (fileType === 'csv') {
        setShowCsvOptions(true);
        const result = parseCSV(text, csvHasHeaders, csvDelimiter);
        items = result.items;
      } else if (fileType === 'json') {
        items = parseJSON(text);
      } else {
        items = parseText(text);
      }
      
      setBatchItems(items);
    } catch (error) {
      console.error('Error parsing file:', error);
      setParseError((error as Error).message);
      setFileInfo(null, null);
    }
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Handle paste input
  const handlePasteSubmit = () => {
    if (!pasteValue.trim()) return;
    
    try {
      setParseError(null);
      
      // Auto-detect format and parse
      const { items, detectedFormat } = autoDetectAndParse(pasteValue);
      
      // Set file info with detected format
      setFileInfo('pasted-data', detectedFormat);
      
      // Show CSV options if CSV detected
      if (detectedFormat === 'csv') {
        setShowCsvOptions(true);
      }
      
      setBatchItems(items);
      setPasteValue('');
    } catch (error) {
      console.error('Error parsing pasted data:', error);
      setParseError((error as Error).message);
    }
  };
  
  // Handle CSV options change
  const handleCsvOptionsChange = () => {
    if (fileName && (fileName.endsWith('.csv') || fileName === 'pasted-data')) {
      try {
        // Re-parse with new options
        const fileInput = fileInputRef.current;
        if (fileInput && fileInput.files && fileInput.files[0]) {
          // For file upload, re-read and parse
          readFile(fileInput.files[0]).then(text => {
            const result = parseCSV(text, csvHasHeaders, csvDelimiter);
            setBatchItems(result.items);
          });
        } else if (pasteValue) {
          // For pasted data, re-parse
          const result = parseCSV(pasteValue, csvHasHeaders, csvDelimiter);
          setBatchItems(result.items);
        }
      } catch (error) {
        console.error('Error re-parsing CSV:', error);
        setParseError((error as Error).message);
      }
    }
  };
  
  // Helper function to read file
  const readFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve(e.target?.result as string);
      };
      reader.onerror = (e) => {
        reject(new Error('Failed to read file'));
      };
      reader.readAsText(file);
    });
  };
  
  // Helper function to determine file type
  const getFileType = (filename: string): 'csv' | 'json' | 'text' => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (ext === 'csv') return 'csv';
    if (ext === 'json') return 'json';
    return 'text';
  };
  
  return (
    <div className="mb-6">
      <h2 className="text-xl font-semibold mb-3">Batch Input</h2>
      
      {/* File Upload */}
      <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center mb-4">
        <div className="mb-3">
          <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Drag and drop a CSV or JSON file, or click to browse
          </p>
        </div>
        <input 
          type="file" 
          className="hidden" 
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".csv,.json,.txt"
        />
        <button 
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-md text-sm hover:bg-gray-300 dark:hover:bg-gray-600"
          onClick={() => fileInputRef.current?.click()}
        >
          Browse Files
        </button>
      </div>
      
      {/* Or Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
            OR
          </span>
        </div>
      </div>
      
      {/* Paste Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          Paste data (CSV, JSON, or plain text)
        </label>
        <div className="flex">
          <textarea 
            className="flex-1 p-3 border rounded-l-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
            placeholder="Paste your data here..."
            value={pasteValue}
            onChange={(e) => setPasteValue(e.target.value)}
            rows={5}
          />
          <button 
            className="px-4 py-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600 disabled:opacity-50"
            onClick={handlePasteSubmit}
            disabled={!pasteValue.trim()}
          >
            Parse
          </button>
        </div>
      </div>
      
      {/* CSV Options */}
      {showCsvOptions && (
        <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-md">
          <h3 className="text-sm font-medium mb-3">CSV Options</h3>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center">
              <input 
                type="checkbox" 
                id="csv-headers" 
                className="mr-2"
                checked={csvHasHeaders}
                onChange={(e) => {
                  setCsvOptions(e.target.checked, csvDelimiter);
                  handleCsvOptionsChange();
                }}
              />
              <label htmlFor="csv-headers" className="text-sm">
                First row contains headers
              </label>
            </div>
            <div className="flex items-center">
              <label htmlFor="csv-delimiter" className="text-sm mr-2">
                Delimiter:
              </label>
              <select 
                id="csv-delimiter" 
                className="p-1 border rounded bg-white dark:bg-gray-800 text-sm"
                value={csvDelimiter}
                onChange={(e) => {
                  setCsvOptions(csvHasHeaders, e.target.value);
                  handleCsvOptionsChange();
                }}
              >
                <option value=",">Comma (,)</option>
                <option value=";">Semicolon (;)</option>
                <option value="\t">Tab</option>
                <option value="|">Pipe (|)</option>
              </select>
            </div>
          </div>
        </div>
      )}
      
      {/* Format Info */}
      <div className="text-sm text-gray-500 dark:text-gray-400">
        <p>Supported formats:</p>
        <ul className="list-disc pl-5 space-y-1 mt-1">
          <li>CSV: Each row becomes a data item</li>
          <li>JSON: Array of items or object properties</li>
          <li>Plain text: Each line becomes a data item</li>
        </ul>
      </div>
    </div>
  );
};

export default BatchInputUpload;
