'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useConfigStore } from '../../store/config-store';

interface Example {
  id: string;
  input: string;
  output: string;
}

interface PromptVersion {
  id: string;
  systemPrompt: string;
  userPrompt: string;
  timestamp: Date;
}

interface TestResult {
  input: string;
  output: string;
  timestamp: Date;
}

export default function RefinePage() {
  const router = useRouter();
  const { setSystemPrompt, addUserPrompt, updateUserPrompt, userPrompts } = useConfigStore();
  
  // Use case description
  const [useCase, setUseCase] = useState('');
  
  // Examples
  const [examples, setExamples] = useState<Example[]>([
    { id: '1', input: '', output: '' }
  ]);
  
  // Generated prompts
  const [systemPrompt, setSystemPromptLocal] = useState('');
  const [userPrompt, setUserPromptLocal] = useState('');
  
  // Version history
  const [versions, setVersions] = useState<PromptVersion[]>([]);
  const [currentVersionIndex, setCurrentVersionIndex] = useState(-1);
  
  // Testing
  const [testInput, setTestInput] = useState('');
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [feedback, setFeedback] = useState('');
  
  // Loading states
  const [isGenerating, setIsGenerating] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isRefining, setIsRefining] = useState(false);

  // Add example
  const addExample = () => {
    setExamples([...examples, { id: Date.now().toString(), input: '', output: '' }]);
  };

  // Remove example
  const removeExample = (id: string) => {
    if (examples.length > 1) {
      setExamples(examples.filter(e => e.id !== id));
    }
  };

  // Update example
  const updateExample = (id: string, field: 'input' | 'output', value: string) => {
    setExamples(examples.map(e => 
      e.id === id ? { ...e, [field]: value } : e
    ));
  };

  // Save current prompts as a version
  const saveVersion = (sysPrompt: string, usrPrompt: string) => {
    const newVersion: PromptVersion = {
      id: Date.now().toString(),
      systemPrompt: sysPrompt,
      userPrompt: usrPrompt,
      timestamp: new Date()
    };
    setVersions(prev => [...prev, newVersion]);
    setCurrentVersionIndex(versions.length);
  };

  // Revert to a specific version
  const revertToVersion = (index: number) => {
    const version = versions[index];
    setSystemPromptLocal(version.systemPrompt);
    setUserPromptLocal(version.userPrompt);
    setCurrentVersionIndex(index);
  };

  // Generate initial prompts
  const generatePrompts = async () => {
    if (!useCase.trim()) {
      alert('Please describe your use case first');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/refine/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          useCase,
          examples: examples.filter(e => e.input.trim() || e.output.trim())
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate prompts');
      }

      const data = await response.json();
      setSystemPromptLocal(data.systemPrompt);
      setUserPromptLocal(data.userPrompt);
      saveVersion(data.systemPrompt, data.userPrompt);
    } catch (error) {
      console.error('Error generating prompts:', error);
      alert('Failed to generate prompts. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Test the current prompts
  const testPrompts = async () => {
    if (!testInput.trim()) {
      alert('Please enter a test input');
      return;
    }

    if (!systemPrompt.trim() || !userPrompt.trim()) {
      alert('Please generate or enter prompts first');
      return;
    }

    setIsTesting(true);
    try {
      const response = await fetch('/api/refine/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemPrompt,
          userPrompt,
          testInput
        })
      });

      if (!response.ok) {
        throw new Error('Failed to test prompts');
      }

      const data = await response.json();
      setTestResult({
        input: testInput,
        output: data.output,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error testing prompts:', error);
      alert('Failed to test prompts. Please try again.');
    } finally {
      setIsTesting(false);
    }
  };

  // Refine prompts based on feedback
  const refinePrompts = async () => {
    if (!feedback.trim()) {
      alert('Please provide feedback on what to improve');
      return;
    }

    if (!testResult) {
      alert('Please test the prompts first before refining');
      return;
    }

    setIsRefining(true);
    try {
      const response = await fetch('/api/refine/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentSystemPrompt: systemPrompt,
          currentUserPrompt: userPrompt,
          testInput: testResult.input,
          testOutput: testResult.output,
          feedback,
          useCase,
          examples: examples.filter(e => e.input.trim() || e.output.trim())
        })
      });

      if (!response.ok) {
        throw new Error('Failed to refine prompts');
      }

      const data = await response.json();
      setSystemPromptLocal(data.systemPrompt);
      setUserPromptLocal(data.userPrompt);
      saveVersion(data.systemPrompt, data.userPrompt);
      setFeedback('');
    } catch (error) {
      console.error('Error refining prompts:', error);
      alert('Failed to refine prompts. Please try again.');
    } finally {
      setIsRefining(false);
    }
  };

  // Export to Configure page
  const exportToConfigure = () => {
    if (!systemPrompt.trim() || !userPrompt.trim()) {
      alert('Please generate prompts first');
      return;
    }

    // Set system prompt
    setSystemPrompt(systemPrompt);
    
    // Update or add user prompt
    if (userPrompts.length > 0) {
      updateUserPrompt(userPrompts[0].id, userPrompt);
    } else {
      addUserPrompt();
      // Need to get the new prompt ID after adding
      setTimeout(() => {
        const store = useConfigStore.getState();
        if (store.userPrompts.length > 0) {
          updateUserPrompt(store.userPrompts[0].id, userPrompt);
        }
      }, 0);
    }

    router.push('/configure');
  };

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Prompt Refinement Studio</h1>
          <p className="text-slate-600 mt-1">Create and refine prompts with AI assistance</p>
        </div>
        <button
          onClick={() => router.push('/configure')}
          className="px-4 py-2 text-slate-600 hover:text-slate-900"
        >
          ← Back to Configure
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Input */}
        <div className="space-y-6">
          {/* Use Case Description */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">1</span>
              Describe Your Use Case
            </h2>
            <p className="text-sm text-slate-600 mb-3">
              What do you want the AI to do? Be specific about the task, tone, and format.
            </p>
            <textarea
              value={useCase}
              onChange={(e) => setUseCase(e.target.value)}
              placeholder="Example: I want to transform Windsurf coding session logs into engaging YouTube video scripts. The output should be conversational, highlight key moments, and include timestamps..."
              className="w-full h-32 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Examples */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">2</span>
              Provide Examples (Optional)
            </h2>
            <p className="text-sm text-slate-600 mb-3">
              Show the AI what good input/output pairs look like.
            </p>
            
            <div className="space-y-4">
              {examples.map((example, index) => (
                <div key={example.id} className="border border-slate-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700">Example {index + 1}</span>
                    {examples.length > 1 && (
                      <button
                        onClick={() => removeExample(example.id)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs text-slate-500">Input</label>
                      <textarea
                        value={example.input}
                        onChange={(e) => updateExample(example.id, 'input', e.target.value)}
                        placeholder="Sample input..."
                        className="w-full h-20 p-2 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500">Expected Output</label>
                      <textarea
                        value={example.output}
                        onChange={(e) => updateExample(example.id, 'output', e.target.value)}
                        placeholder="What the output should look like..."
                        className="w-full h-20 p-2 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={addExample}
              className="mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              + Add Another Example
            </button>
          </div>

          {/* Generate Button */}
          <button
            onClick={generatePrompts}
            disabled={isGenerating || !useCase.trim()}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Generating...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3v3m6.366-.366-2.12 2.12M21 12h-3m.366 6.366-2.12-2.12M12 21v-3m-6.366.366 2.12-2.12M3 12h3m-.366-6.366 2.12 2.12"/>
                </svg>
                Generate Prompts
              </>
            )}
          </button>
        </div>

        {/* Right Column - Output & Testing */}
        <div className="space-y-6">
          {/* Generated Prompts */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-600 text-xs font-bold text-white">3</span>
              Generated Prompts
              {versions.length > 0 && (
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full ml-2">
                  v{currentVersionIndex + 1} of {versions.length}
                </span>
              )}
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">System Prompt</label>
                <textarea
                  value={systemPrompt}
                  onChange={(e) => setSystemPromptLocal(e.target.value)}
                  placeholder="System prompt will appear here..."
                  className="w-full h-28 p-3 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">User Prompt</label>
                <textarea
                  value={userPrompt}
                  onChange={(e) => setUserPromptLocal(e.target.value)}
                  placeholder="User prompt will appear here... Use {input} for the data placeholder."
                  className="w-full h-28 p-3 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
            </div>

            {/* Version History */}
            {versions.length > 1 && (
              <div className="mt-4 pt-4 border-t border-slate-200">
                <label className="block text-xs font-medium text-slate-500 mb-2">Version History</label>
                <div className="flex flex-wrap gap-2">
                  {versions.map((version, index) => (
                    <button
                      key={version.id}
                      onClick={() => revertToVersion(index)}
                      className={`px-3 py-1 text-xs rounded-full ${
                        index === currentVersionIndex
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      v{index + 1}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Test & Refine */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-600 text-xs font-bold text-white">4</span>
              Test & Refine
            </h2>

            <div className="space-y-4">
              {/* Test Input */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Test Input</label>
                <textarea
                  value={testInput}
                  onChange={(e) => setTestInput(e.target.value)}
                  placeholder="Enter sample data to test your prompts..."
                  className="w-full h-20 p-3 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
                <button
                  onClick={testPrompts}
                  disabled={isTesting || !testInput.trim() || !systemPrompt.trim()}
                  className="mt-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isTesting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Testing...
                    </>
                  ) : (
                    'Run Test'
                  )}
                </button>
              </div>

              {/* Test Result */}
              {testResult && (
                <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Output</label>
                  <div className="text-sm text-slate-800 whitespace-pre-wrap max-h-48 overflow-y-auto">
                    {testResult.output}
                  </div>
                </div>
              )}

              {/* Feedback */}
              {testResult && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Feedback</label>
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="What should be different? What's missing? What's wrong?"
                    className="w-full h-20 p-3 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                  <button
                    onClick={refinePrompts}
                    disabled={isRefining || !feedback.trim()}
                    className="mt-2 px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isRefining ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Refining...
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                          <path d="M3 3v5h5"/>
                          <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
                          <path d="M16 21h5v-5"/>
                        </svg>
                        Refine Prompts
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Export Button */}
          <button
            onClick={exportToConfigure}
            disabled={!systemPrompt.trim() || !userPrompt.trim()}
            className="w-full py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14"/>
              <path d="m12 5 7 7-7 7"/>
            </svg>
            Use in Configure
          </button>
        </div>
      </div>
    </div>
  );
}
