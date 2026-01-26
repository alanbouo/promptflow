"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, Zap } from "lucide-react";

const APP_URL = "https://app.promptflow.run";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Zap className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold">PromptFlow</span>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Features
          </a>
          <a href="#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            How It Works
          </a>
          <a href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Pricing
          </a>
        </div>

        <div className="hidden md:flex items-center gap-4">
          <Button variant="ghost" asChild>
            <a href={`${APP_URL}/login`}>Sign In</a>
          </Button>
          <Button asChild>
            <a href={`${APP_URL}/register`}>Get Started</a>
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-background">
          <div className="container mx-auto px-4 py-4 flex flex-col gap-4">
            <a href="#features" className="text-sm font-medium py-2" onClick={() => setMobileMenuOpen(false)}>
              Features
            </a>
            <a href="#how-it-works" className="text-sm font-medium py-2" onClick={() => setMobileMenuOpen(false)}>
              How It Works
            </a>
            <a href="#pricing" className="text-sm font-medium py-2" onClick={() => setMobileMenuOpen(false)}>
              Pricing
            </a>
            <div className="flex flex-col gap-2 pt-4 border-t">
              <Button variant="ghost" asChild className="w-full">
                <a href={`${APP_URL}/login`}>Sign In</a>
              </Button>
              <Button asChild className="w-full">
                <a href={`${APP_URL}/register`}>Get Started</a>
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
