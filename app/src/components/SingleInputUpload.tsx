import React from 'react';
import { useInputStore } from '../store/input-store';

const SingleInputUpload: React.FC = () => {
  const { singleInput, setSingleInput } = useInputStore();
  
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setSingleInput(e.target.value);
  };
  
  const handleClear = () => {
    setSingleInput('');
  };
  
  return (
    <div className="mb-6">
      <h2 className="text-xl font-semibold mb-3">Single Input</h2>
      <div className="relative">
        <textarea 
          className="w-full h-40 p-3 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
          placeholder="Enter your data here..."
          value={singleInput}
          onChange={handleInputChange}
        />
        {singleInput && (
          <button
            className="absolute top-2 right-2 bg-gray-200 dark:bg-gray-600 rounded-full p-1 hover:bg-gray-300 dark:hover:bg-gray-500"
            onClick={handleClear}
            aria-label="Clear input"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      <div className="flex justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
        <span>{singleInput.length} characters</span>
        {singleInput.length > 0 && (
          <span>~{Math.ceil(singleInput.length / 4)} tokens</span>
        )}
      </div>
      
      <div className="mt-4">
        <h3 className="text-sm font-medium mb-2">Example Inputs:</h3>
        <div className="space-y-2">
          <button 
            className="block text-sm text-blue-600 dark:text-blue-400 hover:underline"
            onClick={() => setSingleInput("Sales in Q1 were $1.2M, Q2 $1.5M, Q3 $1.1M, Q4 $1.8M")}
          >
            Use sample sales data
          </button>
          <button 
            className="block text-sm text-blue-600 dark:text-blue-400 hover:underline"
            onClick={() => setSingleInput("Customer feedback: The new product is intuitive but lacks advanced features. Response time could be improved.")}
          >
            Use sample feedback data
          </button>
        </div>
      </div>
    </div>
  );
};

export default SingleInputUpload;
