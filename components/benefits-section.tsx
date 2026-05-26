"use client";

import { useState } from "react";
import { Check, Plus, Sparkles, Pill, Lock, Leaf, BarChart3, Cpu } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface BenefitItem {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  selected: boolean;
}

const initialBenefits: BenefitItem[] = [
  {
    id: "drug-discovery",
    title: "Drug Discovery",
    description:
      "Simulate molecular interactions to accelerate pharmaceutical research and personalized medicine.",
    icon: <Pill className="w-6 h-6" />,
    selected: false,
  },
  {
    id: "cryptography",
    title: "Quantum Cryptography",
    description:
      "Develop unbreakable encryption using quantum key distribution for ultimate security.",
    icon: <Lock className="w-6 h-6" />,
    selected: false,
  },
  {
    id: "climate",
    title: "Climate Modeling",
    description:
      "Create accurate climate simulations to better understand and combat climate change.",
    icon: <Leaf className="w-6 h-6" />,
    selected: false,
  },
  {
    id: "optimization",
    title: "Optimization Problems",
    description:
      "Solve complex logistics, scheduling, and resource allocation challenges instantly.",
    icon: <BarChart3 className="w-6 h-6" />,
    selected: false,
  },
  {
    id: "ai",
    title: "AI Acceleration",
    description:
      "Enhance machine learning training and inference with quantum speedup.",
    icon: <Sparkles className="w-6 h-6" />,
    selected: false,
  },
  {
    id: "materials",
    title: "Materials Science",
    description:
      "Design new materials with specific properties at the atomic level.",
    icon: <Cpu className="w-6 h-6" />,
    selected: false,
  },
];

export function BenefitsSection() {
  const [benefits, setBenefits] = useState(initialBenefits);

  const toggleBenefit = (id: string) => {
    setBenefits((prev) =>
      prev.map((benefit) =>
        benefit.id === id
          ? { ...benefit, selected: !benefit.selected }
          : benefit
      )
    );
  };

  const selectedCount = benefits.filter((b) => b.selected).length;

  return (
    <section id="benefits" className="py-24 relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-accent/5 via-transparent to-transparent" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Real-World Benefits
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
            Explore the transformative applications of quantum computing. Click
            to select the areas that interest you most.
          </p>
          {selectedCount > 0 && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm">
              <Check className="w-4 h-4" />
              {selectedCount} area{selectedCount !== 1 ? "s" : ""} selected
            </div>
          )}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((benefit) => (
            <Card
              key={benefit.id}
              className={`cursor-pointer transition-all duration-300 ${
                benefit.selected
                  ? "ring-2 ring-primary bg-primary/5 border-primary/30"
                  : "hover:shadow-lg hover:shadow-primary/10 hover:border-primary/30"
              }`}
              onClick={() => toggleBenefit(benefit.id)}
              role="checkbox"
              aria-checked={benefit.selected}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  toggleBenefit(benefit.id);
                }
              }}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${
                      benefit.selected
                        ? "bg-primary text-primary-foreground"
                        : "bg-accent/10 text-accent"
                    }`}
                  >
                    {benefit.icon}
                  </div>
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      benefit.selected
                        ? "bg-primary border-primary"
                        : "border-muted-foreground/30"
                    }`}
                  >
                    {benefit.selected ? (
                      <Check className="w-4 h-4 text-primary-foreground" />
                    ) : (
                      <Plus className="w-4 h-4 text-muted-foreground/50" />
                    )}
                  </div>
                </div>
                <CardTitle className="text-lg mt-3">{benefit.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {benefit.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {selectedCount > 0 && (
          <div className="mt-12 text-center">
            <Button size="lg">
              Learn More About Selected Topics
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
