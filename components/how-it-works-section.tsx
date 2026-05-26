"use client"

import { useEffect } from "react"
import { QuantumCircuitBuilder } from "./interactive/quantum-circuit-builder"

export function HowItWorksSection() {
  useEffect(() => {
    fetch("/api/engagement", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "section_view", payload: { section: "how-it-works" } }),
    }).catch(() => {})
  }, [])

  return (
    <section id="how-it-works" className="py-24 relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-mono mb-4 uppercase tracking-widest">
            Interactive
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Build Quantum Circuits
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
            Drag gates onto qubit wires and watch the quantum state evolve in real time.
            The Bloch sphere and probability bars update instantly as you compose your circuit.
          </p>
        </div>

        <QuantumCircuitBuilder />

        <div className="mt-10 grid sm:grid-cols-3 gap-4 text-center">
          {[
            { title: "Superposition", body: "Apply H to see a qubit enter equal |0⟩+|1⟩ superposition — 50% probability each.", color: "#a78bfa" },
            { title: "Entanglement", body: "Load the Bell State preset: H + CNOT creates correlations no classical model can replicate.", color: "#f472b6" },
            { title: "Interference", body: "Chain gates like H·Z·H and watch amplitudes cancel or reinforce — the engine of quantum speedup.", color: "#34d399" },
          ].map(({ title, body, color }) => (
            <div key={title} className="p-4 rounded-xl text-left"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <h3 className="font-semibold text-sm mb-1.5" style={{ color }}>{title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
