export default function Home() {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Welcome to PromptFlow</h1>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-3">Getting Started</h2>
        <p className="mb-4">PromptFlow helps you configure prompts, process data through LLMs, and display outputs.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
            <h3 className="font-medium mb-2">1. Configure</h3>
            <p className="text-sm">Set up your system prompt, user prompts, and LLM settings</p>
            <a href="/configure" className="block mt-3 text-blue-600 dark:text-blue-400 text-sm">Configure →</a>
          </div>
          
          <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg">
            <h3 className="font-medium mb-2">2. Input</h3>
            <p className="text-sm">Upload or paste your data for processing</p>
            <a href="/input" className="block mt-3 text-green-600 dark:text-green-400 text-sm">Input →</a>
          </div>
          
          <div className="bg-purple-50 dark:bg-purple-900/30 p-4 rounded-lg">
            <h3 className="font-medium mb-2">3. Output</h3>
            <p className="text-sm">View and export your results</p>
            <a href="/output" className="block mt-3 text-purple-600 dark:text-purple-400 text-sm">Output →</a>
          </div>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-3">Recent Jobs</h2>
        <p className="text-gray-500 dark:text-gray-400 italic">No jobs yet. Start by configuring a prompt.</p>
      </div>
    </div>
  );
}
