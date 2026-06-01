"use client"

import { useState, useMemo, useCallback, useEffect, useRef } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Share2,
  Download,
  ChevronDown,
  FlaskConical,
  HelpCircle,
  Sparkles,
} from "lucide-react"
import { CircuitBuilder } from "@/components/circuit/CircuitBuilder"
import { GatePalette } from "@/components/circuit/GatePalette"
import { StateDisplay } from "@/components/circuit/StateDisplay"
import { QiskitExportModal } from "@/components/circuit/QiskitExportModal"
import { BlochSphere } from "@/components/bloch/BlochSphere"
import { QuantumTutor } from "@/components/tutor/QuantumTutor"
import { AlgorithmVisualizer } from "@/components/algorithm/AlgorithmVisualizer"
import { TeleportVisualizer } from "@/components/algorithm/TeleportVisualizer"
import { DailyPuzzle } from "@/components/puzzle/DailyPuzzle"
import { Tour } from "@/components/onboarding/Tour"
import { simulateCircuit } from "@/lib/quantum/circuit"
import { encodeCircuit, decodeCircuit, exportSvgAsPng } from "@/lib/quantum/share"
import { PRESET_CIRCUITS } from "@/lib/quantum/algorithms"
import type { CircuitState, CircuitGate } from "@/lib/quantum/circuit"
import type { GateDef } from "@/lib/quantum/gates"
import { cn } from "@/lib/utils"

const INITIAL_CIRCUIT: CircuitState = { numQubits: 1, gates: [] }
const TOUR_KEY = "qlearn-tour-done"

type RightPanel = "state" | "tutor" | "algorithms" | "teleport" | "puzzle"

export default function PlaygroundPage() {
  const [circuit, setCircuit] = useState<CircuitState>(INITIAL_CIRCUIT)
  const [dragGate, setDragGate] = useState<GateDef | null>(null)
  const [selectedGateId, setSelectedGateId] = useState<string | null>(null)
  const [rightPanel, setRightPanel] = useState<RightPanel>("state")
  const [showTour, setShowTour] = useState(false)
  const [shareToast, setShareToast] = useState(false)
  const [showDemoMenu, setShowDemoMenu] = useState(false)
  const [showQiskit, setShowQiskit] = useState(false)
  const blochRef = useRef<SVGSVGElement | null>(null)
  const demoMenuRef = useRef<HTMLDivElement>(null)

  // Load circuit from URL hash on first mount
  useEffect(() => {
    const hash = window.location.hash.slice(1)
    if (hash) {
      const decoded = decodeCircuit(hash)
      if (decoded) setCircuit(decoded)
    }
    // Show tour if first visit
    if (!localStorage.getItem(TOUR_KEY)) {
      setTimeout(() => setShowTour(true), 600)
    }
  }, [])

  // Sync circuit to URL hash
  useEffect(() => {
    const encoded = encodeCircuit(circuit)
    window.history.replaceState(null, "", `#${encoded}`)
  }, [circuit])

  // Close demo menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (demoMenuRef.current && !demoMenuRef.current.contains(e.target as Node)) {
        setShowDemoMenu(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const simulation = useMemo(() => {
    try {
      return simulateCircuit(circuit)
    } catch {
      return simulateCircuit({ numQubits: circuit.numQubits, gates: [] })
    }
  }, [circuit])

  const selectedGate: CircuitGate | null = useMemo(
    () => circuit.gates.find((g) => g.id === selectedGateId) ?? null,
    [circuit.gates, selectedGateId],
  )

  const handleCircuitChange = useCallback((next: CircuitState) => {
    setCircuit(next)
    setSelectedGateId(null)
  }, [])

  const handleShare = () => {
    const url = window.location.href
    navigator.clipboard.writeText(url).then(() => {
      setShareToast(true)
      setTimeout(() => setShareToast(false), 2500)
    })
  }

  const handleExport = async () => {
    const svg = document.querySelector<SVGSVGElement>("[data-bloch-sphere]")
    if (svg) {
      await exportSvgAsPng(svg, "bloch-sphere.png")
    }
  }

  const handleLoadAlgoCircuit = useCallback((c: CircuitState) => {
    handleCircuitChange(c)
    setRightPanel("state")
  }, [handleCircuitChange])

  const isSingleQubit = circuit.numQubits === 1

  const PANELS: { id: RightPanel; label: string }[] = [
    { id: "state", label: "State" },
    { id: "tutor", label: "AI Tutor" },
    { id: "algorithms", label: "Algorithms" },
    { id: "teleport", label: "Teleport" },
    { id: "puzzle", label: "🏆 Daily" },
  ]

  return (
    <div className="min-h-screen bg-[oklch(0.13_0.01_265)] text-foreground flex flex-col">
      {/* Tour overlay */}
      {showTour && (
        <Tour
          onDone={() => {
            setShowTour(false)
            localStorage.setItem(TOUR_KEY, "1")
          }}
        />
      )}

      {/* Qiskit export modal */}
      {showQiskit && (
        <QiskitExportModal circuit={circuit} onClose={() => setShowQiskit(false)} />
      )}

      {/* Share toast */}
      {shareToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-slate-800 border border-slate-600 text-sm text-slate-200 shadow-xl">
          Link copied to clipboard!
        </div>
      )}

      {/* Top bar */}
      <header className="flex items-center gap-3 px-4 py-2.5 border-b border-slate-800 shrink-0">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          QuantumLearn
        </Link>
        <span className="text-slate-700">|</span>
        <h1 className="text-sm font-semibold text-slate-200">Playground</h1>

        <div className="flex-1" />

        {/* Demo / Surprise me */}
        <div className="relative" ref={demoMenuRef}>
          <button
            onClick={() => setShowDemoMenu((v) => !v)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 border border-slate-700 text-slate-300 hover:text-slate-100 hover:border-slate-600 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            Demo
            <ChevronDown className="w-3 h-3" />
          </button>
          {showDemoMenu && (
            <div className="absolute right-0 top-full mt-1 w-52 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-20 overflow-hidden">
              {PRESET_CIRCUITS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    handleCircuitChange(p.circuit)
                    setShowDemoMenu(false)
                  }}
                  className="w-full text-left px-3 py-2.5 hover:bg-slate-800 transition-colors"
                >
                  <p className="text-xs font-semibold text-slate-200">{p.name}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{p.description}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Tour button */}
        <button
          onClick={() => setShowTour(true)}
          className="p-1.5 rounded text-slate-500 hover:text-slate-300 transition-colors"
          title="Show tour"
          aria-label="Show interactive tour"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        {/* Export to Qiskit */}
        <button
          onClick={() => setShowQiskit(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:text-cyan-300 border border-transparent hover:border-cyan-900 hover:bg-cyan-950/30 transition-all"
          title="Export circuit as Qiskit Python code"
          aria-label="Export to Qiskit"
        >
          <span className="font-mono font-bold text-[10px]">Py</span>
          <span className="hidden sm:inline">Qiskit</span>
        </button>

        {/* Share */}
        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200 border border-transparent hover:border-slate-700 transition-all"
          title="Copy shareable link"
          aria-label="Share circuit via link"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Share</span>
        </button>

        {/* Export Bloch sphere */}
        {isSingleQubit && (
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200 border border-transparent hover:border-slate-700 transition-all"
            title="Export Bloch sphere as PNG"
            aria-label="Download Bloch sphere image"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>
        )}
      </header>

      {/* Main layout */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left: Gate palette */}
        <aside className="hidden lg:flex flex-col p-2.5 border-r border-slate-800 overflow-y-auto shrink-0">
          <GatePalette
            onDragStart={setDragGate}
            selectedGate={dragGate?.id ?? null}
            onSelectGate={(id) => {
              if (!id) { setDragGate(null); return }
              const def = PRESET_CIRCUITS.length // dummy import guard
              // Build a minimal GateDef-like object for the drag state
              setDragGate({ id } as GateDef)
            }}
          />
        </aside>

        {/* Center: Circuit grid + Bloch sphere */}
        <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {/* Circuit */}
          <div id="tour-circuit" className="p-4 border-b border-slate-800">
            <CircuitBuilder circuit={circuit} onChange={handleCircuitChange} />
          </div>

          {/* Bloch sphere */}
          {isSingleQubit && (
            <div
              id="tour-bloch"
              className="flex flex-col items-center gap-2 py-5 border-b border-slate-800"
            >
              <p className="text-[10px] uppercase tracking-widest text-slate-600">Bloch Sphere — q0</p>
              <BlochSphere
                stateVector={simulation.stateVector}
                size={200}
                svgRef={blochRef}
              />
            </div>
          )}

          {/* Mobile gate palette */}
          <div className="lg:hidden p-3 border-b border-slate-800 overflow-x-auto">
            <GatePalette
              onDragStart={setDragGate}
              selectedGate={dragGate?.id ?? null}
              onSelectGate={(id) => setDragGate(id ? { id } as GateDef : null)}
            />
          </div>
        </main>

        {/* Right panel */}
        <aside
          id="tour-state-panel"
          className="w-72 xl:w-80 shrink-0 flex flex-col border-l border-slate-800 min-h-0"
        >
          {/* Tabs */}
          <div className="flex border-b border-slate-800 shrink-0">
            {PANELS.map((p) => (
              <button
                key={p.id}
                id={p.id === "tutor" ? "tour-tutor-tab" : undefined}
                onClick={() => setRightPanel(p.id)}
                className={cn(
                  "flex-1 py-2 text-[10px] font-semibold uppercase tracking-wider transition-colors",
                  rightPanel === p.id
                    ? "text-cyan-400 border-b-2 border-cyan-500"
                    : "text-slate-500 hover:text-slate-300",
                )}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Panel content */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {rightPanel === "state" && (
              <div className="p-4">
                <StateDisplay
                  result={simulation}
                  numQubits={circuit.numQubits}
                  selectedGate={selectedGate}
                />
              </div>
            )}
            {rightPanel === "tutor" && (
              <QuantumTutor circuit={circuit} />
            )}
            {rightPanel === "algorithms" && (
              <AlgorithmVisualizer onLoadCircuit={handleLoadAlgoCircuit} />
            )}
            {rightPanel === "teleport" && (
              <TeleportVisualizer onLoadCircuit={handleLoadAlgoCircuit} />
            )}
            {rightPanel === "puzzle" && (
              <DailyPuzzle
                circuit={circuit}
                onSetup={(n) =>
                  handleCircuitChange({ numQubits: n, gates: [] })
                }
              />
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}
