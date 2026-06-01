"use client";

import Link from "next/link";
import { ArrowRight, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QubitVisualization } from "./qubit-visualization";

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />
      
      {/* Animated grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(100,200,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(100,200,255,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              The Future of Computing
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-balance">
              Master{" "}
              <span className="text-primary">Quantum</span>{" "}
              Computing
            </h1>
            
            <p className="mt-6 text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0 text-pretty">
              Explore the revolutionary world of quantum mechanics and computing. 
              Interactive lessons, visual simulations, and hands-on experiments 
              to understand the technology shaping our future.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button size="lg" className="group" asChild>
                <Link href="/playground">
                  Open Playground
                  <FlaskConical className="ml-2 w-4 h-4 transition-transform group-hover:scale-110" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="#how-it-works">
                  How It Works
                  <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </div>

            <div className="mt-12 flex items-center gap-8 justify-center lg:justify-start">
              <div>
                <div className="text-2xl font-bold">50K+</div>
                <div className="text-sm text-muted-foreground">Students</div>
              </div>
              <div className="w-px h-10 bg-border" />
              <div>
                <div className="text-2xl font-bold">120+</div>
                <div className="text-sm text-muted-foreground">Lessons</div>
              </div>
              <div className="w-px h-10 bg-border" />
              <div>
                <div className="text-2xl font-bold">4.9</div>
                <div className="text-sm text-muted-foreground">Rating</div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <QubitVisualization />
          </div>
        </div>
      </div>
    </section>
  );
}
