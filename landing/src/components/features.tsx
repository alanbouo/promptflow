import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Layers, 
  Zap, 
  FileJson, 
  Settings2, 
  Moon, 
  Download,
  GitBranch,
  Gauge
} from "lucide-react";

const features = [
  {
    icon: Layers,
    title: "Prompt Chaining",
    description: "Chain multiple prompts together using {previous_output} placeholder. Build complex workflows step by step.",
  },
  {
    icon: Zap,
    title: "Batch Processing",
    description: "Process thousands of items in parallel with configurable concurrency. Perfect for data enrichment at scale.",
  },
  {
    icon: Settings2,
    title: "Multiple LLM Providers",
    description: "Support for OpenAI (GPT-4, GPT-3.5) and Anthropic (Claude). Switch providers with a single click.",
  },
  {
    icon: FileJson,
    title: "Flexible Data Import",
    description: "Upload CSV, JSON files or paste data directly. Preview how your prompts will look before processing.",
  },
  {
    icon: GitBranch,
    title: "Template Management",
    description: "Save and load prompt configurations as reusable templates. Share workflows across your team.",
  },
  {
    icon: Gauge,
    title: "Real-time Progress",
    description: "Track job progress with live updates. Monitor each item as it processes through the pipeline.",
  },
  {
    icon: Download,
    title: "Export Results",
    description: "Download results as CSV or JSON. View intermediate chain results for debugging.",
  },
  {
    icon: Moon,
    title: "Dark Mode",
    description: "Full dark/light theme support. Easy on the eyes during those late-night prompt engineering sessions.",
  },
];

export function Features() {
  return (
    <section id="features" className="py-20 sm:py-32 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            Everything You Need for LLM Processing
          </h2>
          <p className="text-lg text-muted-foreground">
            Powerful features designed for prompt engineers, data scientists, and developers who need to process data at scale.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <Card key={feature.title} className="border-0 shadow-sm bg-background/60 backdrop-blur">
              <CardHeader>
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
