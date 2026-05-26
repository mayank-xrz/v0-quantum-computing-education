"use client";

import { useEffect, useState } from "react";

export function QubitVisualization() {
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setRotation((prev) => (prev + 1) % 360);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-72 h-72 md:w-96 md:h-96">
      {/* Outer glow ring */}
      <div className="absolute inset-0 rounded-full bg-primary/5 animate-pulse-glow" />
      
      {/* Main sphere */}
      <div className="absolute inset-8 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 backdrop-blur-sm border border-primary/20">
        {/* Bloch sphere grid lines */}
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 100 100"
          style={{ transform: `rotateY(${rotation}deg)` }}
        >
          {/* Equator */}
          <ellipse
            cx="50"
            cy="50"
            rx="45"
            ry="10"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.5"
            className="text-primary/40"
          />
          {/* Meridian 1 */}
          <ellipse
            cx="50"
            cy="50"
            rx="10"
            ry="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.5"
            className="text-primary/40"
          />
          {/* Meridian 2 */}
          <ellipse
            cx="50"
            cy="50"
            rx="45"
            ry="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.5"
            className="text-primary/20"
          />
        </svg>

        {/* State vector */}
        <div
          className="absolute top-1/2 left-1/2 w-1 h-1/2 origin-bottom"
          style={{ transform: `translate(-50%, -100%) rotate(${rotation * 2}deg)` }}
        >
          <div className="w-full h-full bg-gradient-to-t from-transparent to-primary rounded-full" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-primary shadow-lg shadow-primary/50" />
        </div>

        {/* Center point */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-foreground/50" />
      </div>

      {/* Orbiting electrons */}
      {[0, 120, 240].map((offset, i) => (
        <div
          key={i}
          className="absolute top-1/2 left-1/2 w-4 h-4 -translate-x-1/2 -translate-y-1/2"
          style={{
            animation: `orbit ${3 + i}s linear infinite`,
            animationDelay: `${offset / 360}s`,
          }}
        >
          <div
            className="w-3 h-3 rounded-full"
            style={{
              background: i === 0 ? "var(--primary)" : i === 1 ? "var(--accent)" : "var(--foreground)",
              boxShadow: `0 0 10px ${i === 0 ? "var(--primary)" : i === 1 ? "var(--accent)" : "var(--foreground)"}`,
            }}
          />
        </div>
      ))}

      {/* Labels */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 text-xs text-primary font-mono">
        |0⟩
      </div>
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs text-accent font-mono">
        |1⟩
      </div>
    </div>
  );
}
