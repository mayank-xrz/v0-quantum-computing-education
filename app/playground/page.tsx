"use client"

import { useState, useMemo, useCallback } from "react"
import Link from "next/link"
import { ArrowLeft, Info } from "lucide-react"
import { CircuitBuilder } from "@/components/circuit/CircuitBuilder"
import { GatePalette } from "@/components/circuit/GatePalette"
import { StateDisplay } from "@/components/circuit/StateDisplay"
import { BlochSphere } from "@/components/bloch/BlochSphere"
import { QuantumTutor } from "@/components/tutor/QuantumTutor"
import { simulateCircuit } from "@/lib/quantum/circuit"
import type { CircuitState, CircuitGate } from "@/lib/quantum/circuit"
import type { GateDef } from "@/lib/quantum/gates"
import { cn } from "@/lib/utils"

const INITIAL_CIRCUIT: CircuitState = { numQubits: 1, gates: [] }

type Panel = "state" | "tutor"

export default function PlaygroundPage() {
  const [circuit, setCircuit] = useState<CircuitState>(INITIAL_CIRCUIT)
  const [dragGate, setDragGate] = useState<GateDef | null>(null)
  const [selectedGateId, setSelectedGateId] = useState<string | null>(null)
  const [activePanel, setActivePanel] = useState<Panel>("state")

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

  const isSingleQubit = circuit.numQubits === 1

  return (
    <div className="min-h-screen bg-[oklch(0.13_0.01_265)] text-foreground flex flex-col">
      {/* Top bar */}
      <header className="flex items-center gap-4 px-4 py-3 border-b border-slate-800 shrink-0">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>QuantumLearn</span>
        </Link>
        <span className="text-slate-700">|</span>
        <h1 className="text-sm font-semibold text-slate-200">Quantum Playground</h1>
        <div className="flex-1" />
        <a
          href="https://en.wikipedia.org/wiki/Quantum_circuit"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors"
        >
          <Info className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Quantum circuits</span>
        </a>
      </header>

      {/* Main layout */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left: Gate palette */}
        <aside className="hidden md:flex flex-col p-3 border-r border-slate-800 overflow-y-auto shrink-0">
          <GatePalette
            onDragStart={setDragGate}
            selectedGate={dragGate?.id ?? null}
            onSelectGate={(id) => {
              const def = id ? ({ id } as GateDef) : null
              setDragGate(def)
            }}
          />
        </aside>

        {/* Center: Circuit + Bloch sphere */}
        <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {/* Circuit */}
          <div className="p-4 border-b border-slate-800">
            <CircuitBuilder
              circuit={circuit}
              onChange={handleCircuitChange}
            />
          </div>

          {/* Bloch sphere (only for 1-qubit) */}
          {isSingleQubit && (
            <div className="flex flex-col items-center gap-2 py-6 border-b border-slate-800">
              <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Bloch Sphere — q0</p>
              <BlochSphere stateVector={simulation.stateVector} size={200} />
            </div>
          )}

          {/* Mobile gate palette */}
          <div className="md:hidden p-3 border-b border-slate-800 overflow-x-auto">
            <GatePalette
              onDragStart={setDragGate}
              selectedGate={dragGate?.id ?? null}
              onSelectGate={(id) => {
                const def = id ? ({ id } as GateDef) : null
                setDragGate(def)
              }}
            />
          </div>
        </main>

        {/* Right panel: State display or Tutor */}
        <aside className="w-80 shrink-0 flex flex-col border-l border-slate-800 min-h-0">
          {/* Panel tabs */}
          <div className="flex border-b border-slate-800 shrink-0">
            {(["state", "tutor"] as Panel[]).map((p) => (
              <button
                key={p}
                onClick={() => setActivePanel(p)}
                className={cn(
                  "flex-1 py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors",
                  activePanel === p
                    ? "text-cyan-400 border-b-2 border-cyan-500"
                    : "text-slate-500 hover:text-slate-300",
                )}
              >
                {p === "state" ? "Quantum State" : "AI Tutor"}
              </button>
            ))}
          </div>

          {/* Panel content */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {activePanel === "state" ? (
              <div className="p-4">
                <StateDisplay
                  result={simulation}
                  numQubits={circuit.numQubits}
                  selectedGate={selectedGate}
                />
              </div>
            ) : (
              <QuantumTutor circuit={circuit} />
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}
