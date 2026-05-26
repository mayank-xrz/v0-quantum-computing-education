"use client"

import { useEffect } from "react"
import { SpeedupExplorer } from "./interactive/speedup-explorer"
import { InsightsPanel } from "./interactive/insights-panel"

export function BenefitsSection() {
  useEffect(() => {
    fetch("/api/engagement", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "section_view", payload: { section: "benefits" } }),
    }).catch(() => {})
  }, [])

  return (
    <section id="benefits" className="py-24 relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-accent/5 via-transparent to-transparent" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono mb-4 uppercase tracking-widest">
            Interactive
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Quantum Speedup
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
            Choose an algorithm, dial the input size, and see classical vs quantum operation counts
            diverge on a log-scale chart. The gap is real — and growing.
          </p>
        </div>

        <SpeedupExplorer />

        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { metric: "O(√N)", label: "Grover search speedup", color: "#a78bfa" },
            { metric: "Exp", label: "Shor's advantage over classical", color: "#f472b6" },
            { metric: "≥99.9%", label: "Target gate fidelity", color: "#34d399" },
            { metric: "2035+", label: "Fault-tolerant era estimate", color: "#60a5fa" },
          ].map(({ metric, label, color }) => (
            <div key={label} className="p-4 rounded-xl text-center"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="text-2xl font-bold font-mono mb-1" style={{ color }}>{metric}</div>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>

        <InsightsPanel section="benefits" accentColor="#34d399" />
      </div>
    </section>
  )
}
