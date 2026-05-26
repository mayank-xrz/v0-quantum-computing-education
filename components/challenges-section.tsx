"use client"

import { useEffect } from "react"
import { DecoherenceLab } from "./interactive/decoherence-lab"

export function ChallengesSection() {
  useEffect(() => {
    fetch("/api/engagement", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "section_view", payload: { section: "challenges" } }),
    }).catch(() => {})
  }, [])

  return (
    <section id="challenges" className="py-24 relative" style={{ background: "rgba(10,10,20,0.5)" }}>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-destructive/5 via-transparent to-transparent" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono mb-4 uppercase tracking-widest">
            Interactive
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Quantum Challenges
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
            Explore why quantum systems are fragile. Adjust decoherence time and error rates,
            then toggle error correction to see surface codes fight back.
          </p>
        </div>

        <DecoherenceLab />

        <div className="mt-10 grid sm:grid-cols-3 gap-4 text-center">
          {[
            { title: "Decoherence", body: "Qubits interact with their environment and lose quantum properties — typically in microseconds.", color: "#f87171" },
            { title: "1% Threshold", body: "Surface codes can correct errors only if the physical gate error rate stays below ~1%. Pushing lower is the key engineering challenge.", color: "#fbbf24" },
            { title: "1000:1 Overhead", body: "Today, thousands of noisy physical qubits are needed to encode one fault-tolerant logical qubit.", color: "#60a5fa" },
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
