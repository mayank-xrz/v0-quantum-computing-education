"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, Atom } from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { name: "How It Works", href: "#how-it-works" },
  { name: "Challenges", href: "#challenges" },
  { name: "Benefits", href: "#benefits" },
  { name: "Resources", href: "#resources" },
];

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="relative w-8 h-8">
              <Atom className="w-8 h-8 text-primary" />
            </div>
            <span className="text-xl font-semibold tracking-tight">
              Quantum<span className="text-primary">Learn</span>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.name}
              </Link>
            ))}
            <Button size="sm">Get Started</Button>
          </div>

          <button
            className="md:hidden p-2"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden bg-background border-b border-border">
          <div className="px-4 py-4 space-y-3">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="block text-muted-foreground hover:text-foreground transition-colors py-2"
                onClick={() => setIsOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            <Button className="w-full mt-4" size="sm">
              Get Started
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
}
