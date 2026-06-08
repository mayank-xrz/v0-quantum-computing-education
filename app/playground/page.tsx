"use client"

import { useState, useMemo, useCallback, useEffect, useRef } from "react"
import {
  Share2,
  Download,
  ChevronDown,
  Sparkles,
  HelpCircle,
} from "lucide-react"
import { CircuitBuilder } from "@/components/circuit/CircuitBuilder"
import { GatePalette } from "@/components/circuit/GatePalette"
import { StateDisplay } from "@/components/circuit/StateDisplay"
import { QiskitExportModal } from "@/components/circuit/QiskitExportModal"
import { OpenQASMModal } from "@/components/circuit/OpenQASMModal"
import { BlochSphere } from "@/components/bloch/BlochSphere"
import { Tour } from "@/components/onboarding/Tour"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import { simulateCircuit } from "@/lib/quantum/circuit"
import { encodeCircuit, decodeCircuit, exportSvgAsPng } from "@/lib/quantum/share"
import { PRESET_CIRCUITS } from "@/lib/quantum/algorithms"
import type { CircuitState, CircuitGate } from "@/lib/quantum/circuit"
import type { GateDef } from "@/lib/quantum/gates"

const INITIAL_CIRCUIT: CircuitState = { numQubits: 1, gates: [] }
const TOUR_KEY = "qlearn-tour-done"

export default function PlaygroundPage() {
  const [circuit, setCircuit] = useState<CircuitState>(INITIAL_CIRCUIT)
  const [dragGate, setDragGate] = useState<GateDef | null>(null)
  const [selectedGateId, setSelectedGateId] = useState<string | null>(null)
  const [showTour, setShowTour] = useState(false)
  const [shareToast, setShareToast] = useState(false)
  const [showDemoMenu, setShowDemoMenu] = useState(false)
  const [showQiskit, setShowQiskit] = useState(false)
  const [showQASM, setShowQASM] = useState(false)
  const blochRef = useRef<SVGSVGElement | null>(null)
  const demoMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const hash = window.location.hash.slice(1)
    if (hash) {
      const decoded = decodeCircuit(hash)
      if (decoded) setCircuit(decoded)
    }
    if (!localStorage.getItem(TOUR_KEY)) {
      setTimeout(() => setShowTour(true), 600)
    }
  }, [])

  useEffect(() => {
    const encoded = encodeCircuit(circuit)
    window.history.replaceState(null, "", `#${encoded}`)
  }, [circuit])

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
    navigator.clipboard.writeText(window.location.href).then(() => {
      setShareToast(true)
      setTimeout(() => setShareToast(false), 2500)
    })
  }

  const handleExport = async () => {
    // 3D canvas takes priority; fall back to SVG if only the 2D fallback is rendered
    const canvas = document.querySelector<HTMLCanvasElement>("canvas[data-bloch-canvas]")
    if (canvas) {
      const url = canvas.toDataURL("image/png")
      const a = document.createElement("a")
      a.href = url
      a.download = "bloch-sphere.png"
      a.click()
      return
    }
    const svg = document.querySelector<SVGSVGElement>("[data-bloch-sphere]")
    if (svg) await exportSvgAsPng(svg, "bloch-sphere.png")
  }

  const isSingleQubit = circuit.numQubits === 1

  return (
    <div className="flex flex-col w-full min-h-0">
      {showTour && (
        <Tour
          onDone={() => {
            setShowTour(false)
            localStorage.setItem(TOUR_KEY, "1")
          }}
        />
      )}
      {showQiskit && (
        <QiskitExportModal circuit={circuit} onClose={() => setShowQiskit(false)} />
      )}
      {showQASM && (
        <OpenQASMModal
          circuit={circuit}
          onClose={() => setShowQASM(false)}
          onImport={(c) => { handleCircuitChange(c); setShowQASM(false) }}
        />
      )}
      {shareToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-slate-800 border border-slate-600 text-sm text-slate-200 shadow-xl">
          Link copied to clipboard!
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-800 shrink-0">
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
            <div className="absolute left-0 top-full mt-1 w-52 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-20 overflow-hidden">
              {PRESET_CIRCUITS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => { handleCircuitChange(p.circuit); setShowDemoMenu(false) }}
                  className="w-full text-left px-3 py-2.5 hover:bg-slate-800 transition-colors"
                >
                  <p className="text-xs font-semibold text-slate-200">{p.name}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{p.description}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => setShowTour(true)}
          className="p-1.5 rounded text-slate-500 hover:text-slate-300 transition-colors"
          aria-label="Show interactive tour"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        <button
          onClick={() => setShowQiskit(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:text-cyan-300 border border-transparent hover:border-cyan-900 hover:bg-cyan-950/30 transition-all"
        >
          <span className="font-mono font-bold text-[10px]">Py</span>
          <span className="hidden sm:inline">Qiskit</span>
        </button>

        <button
          onClick={() => setShowQASM(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:text-cyan-300 border border-transparent hover:border-cyan-900 hover:bg-cyan-950/30 transition-all"
        >
          <span className="font-mono font-bold text-[10px]">QS</span>
          <span className="hidden sm:inline">QASM</span>
        </button>

        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200 border border-transparent hover:border-slate-700 transition-all"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Share</span>
        </button>

        {isSingleQubit && (
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200 border border-transparent hover:border-slate-700 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>
        )}
      </div>

      {/* Three-column body */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left: gate palette */}
        <aside className="hidden lg:flex flex-col p-2.5 border-r border-slate-800 overflow-y-auto shrink-0">
          <GatePalette
            onDragStart={setDragGate}
            selectedGate={dragGate?.id ?? null}
            onSelectGate={(id) => setDragGate(id ? { id } as GateDef : null)}
          />
        </aside>

        {/* Center: circuit + Bloch */}
        <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          <div id="tour-circuit" className="p-4 border-b border-slate-800">
            <ErrorBoundary label="Circuit Builder">
              <CircuitBuilder circuit={circuit} onChange={handleCircuitChange} />
            </ErrorBoundary>
          </div>

          {isSingleQubit && (
            <div id="tour-bloch" className="flex flex-col items-center gap-2 py-5 border-b border-slate-800">
              <p className="text-[10px] uppercase tracking-widest text-slate-600">Bloch Sphere — q0</p>
              <ErrorBoundary label="Bloch Sphere">
                <BlochSphere stateVector={simulation.stateVector} size={200} svgRef={blochRef} />
              </ErrorBoundary>
            </div>
          )}

          <div className="lg:hidden p-3 border-b border-slate-800 overflow-x-auto">
            <GatePalette
              onDragStart={setDragGate}
              selectedGate={dragGate?.id ?? null}
              onSelectGate={(id) => setDragGate(id ? { id } as GateDef : null)}
            />
          </div>
        </main>

        {/* Right: state display */}
        <aside
          id="tour-state-panel"
          className="w-72 xl:w-80 shrink-0 flex flex-col border-l border-slate-800"
        >
          <div className="px-3 py-2 border-b border-slate-800 shrink-0">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-cyan-400">State</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <ErrorBoundary label="State Display">
              <StateDisplay result={simulation} numQubits={circuit.numQubits} selectedGate={selectedGate} />
            </ErrorBoundary>
          </div>
        </aside>
      </div>
    </div>
  )
}
