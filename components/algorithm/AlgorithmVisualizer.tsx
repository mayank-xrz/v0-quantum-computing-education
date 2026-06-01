"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ChevronRight,
  ExternalLink,
  FlaskConical,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { AlgorithmDef, AlgorithmSnapshot } from "@/lib/quantum/algorithms"
import { ALGORITHMS, buildSnapshots } from "@/lib/quantum/algorithms"
import type { CircuitState } from "@/lib/quantum/circuit"
import { BlochSphere } from "@/components/bloch/BlochSphere"

interface Props {
  onLoadCircuit: (circuit: CircuitState) => void
}

export function AlgorithmVisualizer({ onLoadCircuit }: Props) {
  const [selectedAlgo, setSelectedAlgo] = useState<AlgorithmDef>(ALGORITHMS[0])
  const [stepIndex, setStepIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const snapshots = useMemo<AlgorithmSnapshot[]>(
    () => buildSnapshots(selectedAlgo),
    [selectedAlgo],
  )

  const current = snapshots[stepIndex]
  const maxStep = snapshots.length - 1

  // Auto-play
  useEffect(() => {
    if (playing) {
      intervalRef.current = setInterval(() => {
        setStepIndex((prev) => {
          if (prev >= maxStep) {
            setPlaying(false)
            return prev
          }
          return prev + 1
        })
      }, 1800)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [playing, maxStep])

  const selectAlgo = (algo: AlgorithmDef) => {
    setSelectedAlgo(algo)
    setStepIndex(0)
    setPlaying(false)
  }

  const goTo = useCallback(
    (i: number) => {
      setStepIndex(Math.max(0, Math.min(maxStep, i)))
      setPlaying(false)
    },
    [maxStep],
  )

  const handleLoadCircuit = () => {
    onLoadCircuit({
      numQubits: selectedAlgo.numQubits,
      gates: current.step.gates,
    })
  }

  const isSingleQubit = selectedAlgo.numQubits === 1

  return (
    <div className="flex flex-col gap-0 h-full">
      {/* Algorithm selector */}
      <div className="flex gap-2 p-3 border-b border-slate-800 shrink-0 flex-wrap">
        {ALGORITHMS.map((algo) => (
          <button
            key={algo.id}
            onClick={() => selectAlgo(algo)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
              selectedAlgo.id === algo.id
                ? "bg-cyan-600 text-white shadow-[0_0_12px_rgba(8,145,178,0.4)]"
                : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200",
            )}
          >
            {algo.name}
          </button>
        ))}
      </div>

      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-800 shrink-0">
        <p className="text-sm font-semibold text-slate-200">{selectedAlgo.name}</p>
        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{selectedAlgo.tagline}</p>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto min-h-0 flex flex-col gap-4 p-4">
        {/* Step label */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500 font-mono">
            Step {stepIndex + 1} / {maxStep + 1}
          </span>
          <span className="text-sm font-semibold text-cyan-300">
            {current.step.label}
          </span>
        </div>

        {/* Amplitude bars */}
        <AmplitudeBars
          probabilities={current.probabilities}
          numQubits={selectedAlgo.numQubits}
        />

        {/* State vector */}
        <div className="font-mono text-xs text-cyan-300 bg-slate-900/60 rounded-lg px-3 py-2 border border-slate-700/50 break-all leading-relaxed">
          {current.stateVector.toKetString(3)}
        </div>

        {/* Bloch sphere for single qubit */}
        {isSingleQubit && (
          <div className="flex justify-center">
            <BlochSphere stateVector={current.stateVector} size={150} />
          </div>
        )}

        {/* Explanation */}
        <div className="flex flex-col gap-2">
          <p className="text-sm text-slate-300 leading-relaxed">
            {current.step.explanation}
          </p>

          <details className="group">
            <summary className="flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer hover:text-slate-300 transition-colors select-none list-none">
              <ChevronRight className="w-3 h-3 transition-transform group-open:rotate-90" />
              Why does this work?
            </summary>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed pl-4 border-l border-slate-700/50">
              {current.step.insight}
            </p>
          </details>

          {current.step.reference && (
            <a
              href={current.step.reference.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-cyan-400 transition-colors"
            >
              <ExternalLink className="w-3 h-3 shrink-0" />
              {current.step.reference.text}
            </a>
          )}
        </div>

        {/* Load into circuit builder */}
        <button
          onClick={handleLoadCircuit}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-700/50 bg-slate-800/40 text-xs text-slate-400 hover:text-cyan-300 hover:border-cyan-700 hover:bg-cyan-900/20 transition-all"
        >
          <FlaskConical className="w-3.5 h-3.5" />
          Load this step into the circuit builder
        </button>
      </div>

      {/* Timeline controls */}
      <div className="px-4 py-3 border-t border-slate-800 shrink-0 flex flex-col gap-2">
        {/* Scrubber */}
        <div className="relative h-1.5 bg-slate-800 rounded-full cursor-pointer group" onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect()
          const ratio = (e.clientX - rect.left) / rect.width
          goTo(Math.round(ratio * maxStep))
        }}>
          <div
            className="h-full bg-cyan-600 rounded-full transition-all"
            style={{ width: `${(stepIndex / maxStep) * 100}%` }}
          />
          {/* Step markers */}
          {snapshots.map((_, i) => (
            <div
              key={i}
              className={cn(
                "absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border-2 transition-all",
                i === stepIndex
                  ? "border-cyan-400 bg-cyan-400 scale-125"
                  : i < stepIndex
                    ? "border-cyan-700 bg-cyan-800"
                    : "border-slate-600 bg-slate-900",
              )}
              style={{ left: `${(i / maxStep) * 100}%`, transform: "translate(-50%, -50%)" }}
              onClick={(e) => { e.stopPropagation(); goTo(i) }}
            />
          ))}
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => goTo(0)}
            disabled={stepIndex === 0}
            className="p-1.5 rounded text-slate-400 hover:text-slate-200 disabled:opacity-30 transition-colors"
            aria-label="Go to first step"
          >
            <SkipBack className="w-4 h-4" />
          </button>
          <button
            onClick={() => goTo(stepIndex - 1)}
            disabled={stepIndex === 0}
            className="p-1.5 rounded text-slate-400 hover:text-slate-200 disabled:opacity-30 transition-colors"
            aria-label="Previous step"
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
          </button>

          <button
            onClick={() => setPlaying((p) => !p)}
            disabled={stepIndex === maxStep}
            className={cn(
              "p-2 rounded-full transition-all",
              playing
                ? "bg-slate-700 text-slate-200 hover:bg-slate-600"
                : "bg-cyan-600 text-white hover:bg-cyan-500 shadow-[0_0_12px_rgba(8,145,178,0.5)]",
              "disabled:opacity-30",
            )}
            aria-label={playing ? "Pause" : "Play"}
          >
            {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>

          <button
            onClick={() => goTo(stepIndex + 1)}
            disabled={stepIndex === maxStep}
            className="p-1.5 rounded text-slate-400 hover:text-slate-200 disabled:opacity-30 transition-colors"
            aria-label="Next step"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => goTo(maxStep)}
            disabled={stepIndex === maxStep}
            className="p-1.5 rounded text-slate-400 hover:text-slate-200 disabled:opacity-30 transition-colors"
            aria-label="Go to last step"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Amplitude bar chart ───────────────────────────────────────────────────

function AmplitudeBars({
  probabilities,
  numQubits,
}: {
  probabilities: number[]
  numQubits: number
}) {
  const max = Math.max(...probabilities, 0.001)
  return (
    <div className="flex gap-1 items-end h-16">
      {probabilities.map((prob, i) => {
        const label = `|${i.toString(2).padStart(numQubits, "0")}⟩`
        const pct = (prob / max) * 100
        return (
          <div key={i} className="flex flex-col items-center gap-0.5 flex-1">
            <span className="text-[9px] font-mono text-cyan-400 tabular-nums">
              {(prob * 100).toFixed(0)}%
            </span>
            <div className="w-full bg-slate-800 rounded-t overflow-hidden" style={{ height: "32px" }}>
              <div
                className={cn(
                  "w-full rounded-t transition-all duration-700",
                  prob > 0.5 ? "bg-cyan-500" : prob > 0.1 ? "bg-cyan-700" : "bg-slate-700",
                )}
                style={{ height: `${pct}%`, marginTop: `${100 - pct}%` }}
              />
            </div>
            <span className="text-[9px] font-mono text-slate-500">{label}</span>
          </div>
        )
      })}
    </div>
  )
}
