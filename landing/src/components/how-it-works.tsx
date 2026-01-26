import { Settings, Upload, Play, Download } from "lucide-react";

const steps = [
  {
    icon: Settings,
    step: "01",
    title: "Configure Prompts",
    description: "Set up your system prompt, user prompts with placeholders, and LLM settings. Use {input} for your data and {previous_output} for chaining.",
  },
  {
    icon: Upload,
    step: "02",
    title: "Input Your Data",
    description: "Upload a CSV/JSON file or paste data directly. Preview how your prompts will look with actual data before processing.",
  },
  {
    icon: Play,
    step: "03",
    title: "Process & Monitor",
    description: "Start the job and watch real-time progress. Each item flows through your prompt chain with parallel processing.",
  },
  {
    icon: Download,
    step: "04",
    title: "Export Results",
    description: "View results in a table, expand rows to see chain outputs, and export everything as CSV or JSON.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 sm:py-32">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            How It Works
          </h2>
          <p className="text-lg text-muted-foreground">
            Get from raw data to LLM-processed results in four simple steps.
          </p>
        </div>

        <div className="relative mx-auto max-w-4xl">
          {/* Connection line */}
          <div className="absolute left-8 top-0 bottom-0 w-px bg-border hidden md:block" />
          
          <div className="space-y-12">
            {steps.map((step, index) => (
              <div key={step.step} className="relative flex gap-6 md:gap-10">
                {/* Step indicator */}
                <div className="relative z-10 flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 bg-background">
                  <step.icon className="h-6 w-6 text-primary" />
                </div>
                
                {/* Content */}
                <div className="flex-1 pt-3">
                  <div className="mb-1 text-sm font-medium text-primary">Step {step.step}</div>
                  <h3 className="mb-2 text-xl font-semibold">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Example */}
        <div className="mt-20 mx-auto max-w-3xl">
          <div className="rounded-xl border bg-card p-6 sm:p-8">
            <h3 className="text-lg font-semibold mb-4">Example: Data Analysis Chain</h3>
            <div className="space-y-4 text-sm">
              <div className="rounded-lg bg-muted/50 p-4">
                <div className="font-medium text-muted-foreground mb-2">System Prompt</div>
                <code className="text-foreground">You are an expert data analyst.</code>
              </div>
              <div className="rounded-lg bg-muted/50 p-4">
                <div className="font-medium text-muted-foreground mb-2">User Prompt 1</div>
                <code className="text-foreground">Summarize this data: <span className="text-primary">{"{input}"}</span></code>
              </div>
              <div className="rounded-lg bg-muted/50 p-4">
                <div className="font-medium text-muted-foreground mb-2">User Prompt 2</div>
                <code className="text-foreground">Based on this summary: <span className="text-primary">{"{previous_output}"}</span>, identify 3 key insights.</code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
