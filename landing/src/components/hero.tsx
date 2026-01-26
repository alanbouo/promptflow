import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Sparkles } from "lucide-react";

const APP_URL = "https://app.promptflow.run";

export function Hero() {
  return (
    <section className="relative overflow-hidden py-20 sm:py-32">
      {/* Background gradient */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))]" />
      
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-4xl text-center">
          {/* Badge */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border bg-muted/50 px-4 py-1.5 text-sm">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>Powered by n8n workflows</span>
          </div>

          {/* Headline */}
          <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
            Process Data Through LLMs{" "}
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              at Scale
            </span>
          </h1>

          {/* Subheadline */}
          <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground sm:text-xl">
            Configure prompts, chain outputs, and batch process thousands of items through OpenAI or Claude. 
            Visual workflow design with real-time progress tracking.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="h-12 px-8 text-base" asChild>
              <a href={`${APP_URL}/register`}>
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
            <Button size="lg" variant="outline" className="h-12 px-8 text-base" asChild>
              <a href="#how-it-works">
                <Play className="mr-2 h-4 w-4" />
                See How It Works
              </a>
            </Button>
          </div>

          {/* Social proof */}
          <p className="mt-8 text-sm text-muted-foreground">
            No credit card required • Free tier available
          </p>
        </div>

        {/* Hero Image/Demo */}
        <div className="mt-16 sm:mt-24">
          <div className="relative mx-auto max-w-5xl">
            <div className="absolute -inset-4 rounded-xl bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 blur-2xl" />
            <div className="relative rounded-xl border bg-card p-2 shadow-2xl">
              <div className="rounded-lg bg-muted/50 p-8">
                {/* Mock UI */}
                <div className="grid gap-6 md:grid-cols-3">
                  <div className="rounded-lg border bg-background p-4">
                    <div className="mb-3 text-sm font-medium text-muted-foreground">System Prompt</div>
                    <div className="h-20 rounded bg-muted/50" />
                  </div>
                  <div className="rounded-lg border bg-background p-4">
                    <div className="mb-3 text-sm font-medium text-muted-foreground">User Prompt Chain</div>
                    <div className="space-y-2">
                      <div className="h-8 rounded bg-primary/20" />
                      <div className="h-8 rounded bg-primary/10" />
                    </div>
                  </div>
                  <div className="rounded-lg border bg-background p-4">
                    <div className="mb-3 text-sm font-medium text-muted-foreground">Batch Results</div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-green-500" />
                        <div className="h-4 flex-1 rounded bg-muted/50" />
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-green-500" />
                        <div className="h-4 flex-1 rounded bg-muted/50" />
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse" />
                        <div className="h-4 flex-1 rounded bg-muted/50" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
