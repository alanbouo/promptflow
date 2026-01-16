import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface DataItem {
  id: string;
  content: string;
}

export interface InputState {
  // Input mode
  isBatchMode: boolean;
  
  // Data items
  singleInput: string;
  batchItems: DataItem[];
  
  // File info
  fileName: string | null;
  fileType: 'csv' | 'json' | 'text' | null;
  
  // Parsing options
  csvHasHeaders: boolean;
  csvDelimiter: string;
  
  // Status
  isProcessing: boolean;
  parseError: string | null;
  
  // Actions
  setSingleInput: (input: string) => void;
  setBatchItems: (items: DataItem[]) => void;
  addBatchItem: (item: string) => void;
  updateBatchItem: (id: string, content: string) => void;
  removeBatchItem: (id: string) => void;
  clearBatchItems: () => void;
  setIsBatchMode: (isBatch: boolean) => void;
  setFileInfo: (name: string | null, type: 'csv' | 'json' | 'text' | null) => void;
  setCsvOptions: (hasHeaders: boolean, delimiter: string) => void;
  setProcessing: (isProcessing: boolean) => void;
  setParseError: (error: string | null) => void;
  reset: () => void;
}

// Generate a unique ID
const generateId = () => Math.random().toString(36).substring(2, 9);

// Initial state
const initialState = {
  isBatchMode: false,
  singleInput: '',
  batchItems: [],
  fileName: null,
  fileType: null,
  csvHasHeaders: true,
  csvDelimiter: ',',
  isProcessing: false,
  parseError: null,
};

export const useInputStore = create<InputState>()(
  persist(
    (set) => ({
      ...initialState,
      
      setSingleInput: (input) => set({ singleInput: input }),
      
      setBatchItems: (items) => set({ batchItems: items }),
      
      addBatchItem: (item) => set((state) => ({
        batchItems: [...state.batchItems, { id: generateId(), content: item }]
      })),
      
      updateBatchItem: (id, content) => set((state) => ({
        batchItems: state.batchItems.map((item) => 
          item.id === id ? { ...item, content } : item
        )
      })),
      
      removeBatchItem: (id) => set((state) => ({
        batchItems: state.batchItems.filter((item) => item.id !== id)
      })),
      
      clearBatchItems: () => set({ batchItems: [] }),
      
      setIsBatchMode: (isBatch) => set({ isBatchMode }),
      
      setFileInfo: (name, type) => set({ fileName: name, fileType: type }),
      
      setCsvOptions: (hasHeaders, delimiter) => set({ 
        csvHasHeaders: hasHeaders, 
        csvDelimiter: delimiter 
      }),
      
      setProcessing: (isProcessing) => set({ isProcessing }),
      
      setParseError: (error) => set({ parseError: error }),
      
      reset: () => set(initialState)
    }),
    {
      name: 'promptflow-input',
    }
  )
);
