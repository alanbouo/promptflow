import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UserPrompt {
  id: string;
  content: string;
}

export interface ConfigSettings {
  provider: 'openai' | 'anthropic' | 'xai' | 'custom';
  model: string;
  temperature: number;
  maxTokens: number;
  batchProcessing: boolean;
  concurrentRequests: number;
}

export interface ConfigState {
  systemPrompt: string;
  userPrompts: UserPrompt[];
  settings: ConfigSettings;
  
  // Actions
  setSystemPrompt: (prompt: string) => void;
  addUserPrompt: () => void;
  updateUserPrompt: (id: string, content: string) => void;
  removeUserPrompt: (id: string) => void;
  updateSettings: (settings: Partial<ConfigSettings>) => void;
  resetConfig: () => void;
}

const DEFAULT_SETTINGS: ConfigSettings = {
  provider: 'openai',
  model: 'gpt-4',
  temperature: 0.7,
  maxTokens: 1000,
  batchProcessing: false,
  concurrentRequests: 5,
};

// Generate a unique ID
const generateId = () => Math.random().toString(36).substring(2, 9);

export const useConfigStore = create<ConfigState>()(
  persist(
    (set) => ({
      systemPrompt: 'You are an expert analyst.',
      userPrompts: [
        { id: generateId(), content: 'Analyze this data: {input}' },
      ],
      settings: DEFAULT_SETTINGS,
      
      setSystemPrompt: (prompt) => set({ systemPrompt: prompt }),
      
      addUserPrompt: () => set((state) => ({
        userPrompts: [...state.userPrompts, { id: generateId(), content: '' }],
      })),
      
      updateUserPrompt: (id, content) => set((state) => ({
        userPrompts: state.userPrompts.map((prompt) => 
          prompt.id === id ? { ...prompt, content } : prompt
        ),
      })),
      
      removeUserPrompt: (id) => set((state) => ({
        userPrompts: state.userPrompts.filter((prompt) => prompt.id !== id),
      })),
      
      updateSettings: (newSettings) => set((state) => ({
        settings: { ...state.settings, ...newSettings },
      })),
      
      resetConfig: () => set({
        systemPrompt: 'You are an expert analyst.',
        userPrompts: [{ id: generateId(), content: 'Analyze this data: {input}' }],
        settings: DEFAULT_SETTINGS,
      }),
    }),
    {
      name: 'promptflow-config',
    }
  )
);
