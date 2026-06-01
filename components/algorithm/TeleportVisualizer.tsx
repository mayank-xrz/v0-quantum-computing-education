"use client"

import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import {
  Play, Pause, SkipBack, SkipForward, ChevronRight, ExternalLink,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { buildTeleportSnapshots, type TeleportSnapshot } from "@/lib/quantum/teleportation"
import type { CircuitState } from "@/lib/quantum/circuit"

interface Props {
  onLoadCircuit?: (c: CircuitState) => void
}

export function TeleportVisualizer({ onLoadCircuit }: Props) {
  const [step, setStep] = useState(0)
  const [playing, setPlaying] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const snapshots = useMemo<TeleportSnapshot[]>(buildTeleportSnapshots, [])
  const current = snapshots[step]
  const maxStep = snapshots.length - 1

  useEffect(() => {
    if (playing) {
      intervalRef.current = setInterval(() => {
        setStep((p) => {
          if (p >= maxStep) { setPlaying(false); return p }
          return p + 1
        })
      }, 2000)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [playing, maxStep])

  const goTo = useCallback((i: number) => {
    setStep(Math.max(0, Math.min(maxStep, i)))
    setPlaying(false)
  }, [maxStep])

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Title */}
      <div className="px-4 py-3 border-b border-slate-800 shrink-0">
        <p className="text-sm font-semibold text-slate-200">Quantum Teleportation</p>
        <p className="text-xs text-slate-500 mt-0.5">
          Transfer a qubit state using entanglement + 2 classical bits
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto min-h-0 flex flex-col gap-4 p-4">

        {/* Step indicator */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-600 font-mono">Step {step + 1}/{maxStep + 1}</span>
          <span className="text-sm font-semibold text-cyan-300">{current.step.label}</span>
        </div>
        <p className="text-xs text-slate-500 font-mono -mt-2">{current.step.subtitle}</p>

        {/* 3-qubit state bars */}
        <div>
          <p className="text-[10px] uppercase tracking-widest text-slate-600 mb-2">3-Qubit State</p>
          <div className="flex gap-0.5 items-end h-14">
            {current.probabilities.map((p, i) => {
              const label = `|${i.toString(2).padStart(3, "0")}⟩`
              const pct = p * 100
              return (
                <div key={i} className="flex flex-col items-center gap-0.5 flex-1">
                  {pct > 2 && (
                    <span className="text-[8px] font-mono text-cyan-400">{pct.toFixed(0)}%</span>
                  )}
                  <div className="w-full bg-slate-800 rounded-t" style={{ height: 32 }}>
                    <div
                      className={cn(
                        "w-full rounded-t transition-all duration-700",
                        p > 0.4 ? "bg-cyan-500" : p > 0.1 ? "bg-cyan-700/80" : "bg-slate-700/50",
                      )}
                      style={{ height: `${pct}%`, marginTop: `${100 - pct}%` }}
                    />
                  </div>
                  <span className="text-[7px] font-mono text-slate-600">{label}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Entanglement correlation panels */}
        <div className="grid grid-cols-2 gap-2">
          <CorrelationGrid
            title="q0 ↔ q1 (Alice)"
            joint={current.q0q1Joint}
            highlightEntangled={step >= 3}
          />
          <CorrelationGrid
            title="q1 ↔ q2 (Bell pair)"
            joint={current.q1q2Joint}
            highlightEntangled={step >= 2 && step <= 3}
          />
        </div>

        {/* Explanation */}
        <p className="text-sm text-slate-300 leading-relaxed">
          {current.step.explanation}
        </p>
        <details className="group">
          <summary className="flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer hover:text-slate-300 transition-colors select-none list-none">
            <ChevronRight className="w-3 h-3 transition-transform group-open:rotate-90" />
            Why does this work?
          </summary>
          <p className="mt-2 text-xs text-slate-400 leading-relaxed pl-4 border-l border-slate-700/50 whitespace-pre-line">
            {current.step.insight}
          </p>
        </details>

        {/* No-cloning reminder */}
        {step === maxStep && (
          <div className="p-3 rounded-xl bg-emerald-900/20 border border-emerald-700/30 text-xs text-emerald-300 leading-relaxed">
            <strong>✓ Teleportation complete.</strong> Bob's q2 is now in state |+⟩.
            Alice's original qubit was destroyed (no-cloning theorem) — the state was moved, not copied.
          </div>
        )}

        {/* Reference */}
        <a
          href="https://learning.quantum.ibm.com/tutorial/quantum-teleportation"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-cyan-400 transition-colors"
        >
          <ExternalLink className="w-3 h-3 shrink-0" />
          IBM Quantum — Teleportation tutorial
        </a>

        {/* Load into builder */}
        {onLoadCircuit && (
          <button
            onClick={() =>
              onLoadCircuit({ numQubits: 3, gates: current.step.gates })
            }
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-700/50 bg-slate-800/40 text-xs text-slate-400 hover:text-cyan-300 hover:border-cyan-700 hover:bg-cyan-900/20 transition-all"
          >
            Load this step into circuit builder →
          </button>
        )}
      </div>

      {/* Timeline */}
      <div className="px-4 py-3 border-t border-slate-800 shrink-0 flex flex-col gap-2">
        <div
          className="relative h-1.5 bg-slate-800 rounded-full cursor-pointer"
          onClick={(e) => {
            const r = e.currentTarget.getBoundingClientRect()
            goTo(Math.round(((e.clientX - r.left) / r.width) * maxStep))
          }}
        >
          <div
            className="h-full bg-cyan-600 rounded-full transition-all duration-300"
            style={{ width: `${(step / maxStep) * 100}%` }}
          />
          {snapshots.map((_, i) => (
            <div
              key={i}
              onClick={(e) => { e.stopPropagation(); goTo(i) }}
              className={cn(
                "absolute top-1/2 w-2.5 h-2.5 rounded-full border-2 -translate-y-1/2 transition-all cursor-pointer",
                i === step ? "border-cyan-400 bg-cyan-400 scale-125" :
                i < step  ? "border-cyan-800 bg-cyan-900" :
                             "border-slate-600 bg-slate-900",
              )}
              style={{ left: `${(i / maxStep) * 100}%`, transform: "translate(-50%, -50%)" }}
            />
          ))}
        </div>
        <div className="flex items-center justify-center gap-3">
          <button onClick={() => goTo(0)} disabled={step === 0}
            className="p-1.5 rounded text-slate-400 hover:text-white disabled:opacity-30 transition-colors" aria-label="First step">
            <SkipBack className="w-4 h-4" />
          </button>
          <button onClick={() => goTo(step - 1)} disabled={step === 0}
            className="p-1.5 rounded text-slate-400 hover:text-white disabled:opacity-30 transition-colors" aria-label="Previous step">
            <ChevronRight className="w-4 h-4 rotate-180" />
          </button>
          <button
            onClick={() => setPlaying((p) => !p)}
            disabled={step === maxStep}
            className={cn(
              "p-2 rounded-full transition-all",
              playing ? "bg-slate-700 text-slate-200" : "bg-cyan-600 text-white shadow-[0_0_12px_rgba(8,145,178,0.5)]",
              "disabled:opacity-30"
            )}
            aria-label={playing ? "Pause" : "Play"}
          >
            {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <button onClick={() => goTo(step + 1)} disabled={step === maxStep}
            className="p-1.5 rounded text-slate-400 hover:text-white disabled:opacity-30 transition-colors" aria-label="Next step">
            <ChevronRight className="w-4 h-4" />
          </button>
          <button onClick={() => goTo(maxStep)} disabled={step === maxStep}
            className="p-1.5 rounded text-slate-400 hover:text-white disabled:opacity-30 transition-colors" aria-label="Last step">
            <SkipForward className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * 2×2 joint probability grid for two qubits.
 * Shows P(q_a=row, q_b=col) as a heatmap.
 * When highlightEntangled: cells on the anti-diagonal glow to show correlation.
 */
function CorrelationGrid({
  title,
  joint,
  highlightEntangled,
}: {
  title: string
  joint: number[]   // [P(00), P(01), P(10), P(11)]
  highlightEntangled: boolean
}) {
  const max = Math.max(...joint, 0.001)
  const labels = ["0", "1"]

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-[9px] uppercase tracking-wider text-slate-600">{title}</p>
      <div className="grid grid-cols-3 gap-0.5 text-[9px] font-mono">
        {/* Header row */}
        <div />
        {labels.map((l) => (
          <div key={l} className="text-center text-slate-600">{l}</div>
        ))}
        {/* Data rows */}
        {labels.map((rowL, ri) => (
          <>
            <div key={`r${ri}`} className="text-slate-600 flex items-center">{rowL}</div>
            {labels.map((_, ci) => {
              const idx = ri * 2 + ci
              const p = joint[idx]
              const intensity = p / max
              const isDiag = ri === ci
              const isHighlighted = highlightEntangled && p > 0.3

              return (
                <div
                  key={`${ri}-${ci}`}
                  className={cn(
                    "aspect-square rounded flex items-center justify-center text-[8px] transition-all duration-500",
                    isHighlighted && isDiag
                      ? "bg-cyan-500/30 border border-cyan-500/50 text-cyan-300"
                      : isHighlighted
                        ? "bg-purple-500/20 border border-purple-500/30 text-purple-300"
                        : "bg-slate-800 border border-slate-700/50 text-slate-500",
                  )}
                  style={{
                    opacity: Math.max(0.2, intensity),
                  }}
                >
                  {(p * 100).toFixed(0)}%
                </div>
              )
            })}
          </>
        ))}
      </div>
    </div>
  )
}
