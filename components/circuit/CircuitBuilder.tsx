"use client"

import { useState, useCallback, useId } from "react"
import { Trash2, Plus, Minus } from "lucide-react"
import { cn } from "@/lib/utils"
import type { CircuitState, CircuitGate } from "@/lib/quantum/circuit"
import type { GateDef } from "@/lib/quantum/gates"
import { GATE_DEFS } from "@/lib/quantum/gates"

const MAX_QUBITS = 4
const MAX_COLUMNS = 10

interface Props {
  circuit: CircuitState
  onChange: (circuit: CircuitState) => void
}

export function CircuitBuilder({ circuit, onChange }: Props) {
  const [dragGate, setDragGate] = useState<GateDef | null>(null)
  const [hoverCell, setHoverCell] = useState<{ qubit: number; col: number } | null>(null)
  const [selectedGateId, setSelectedGateId] = useState<string | null>(null)
  const uid = useId()

  const nextId = useCallback(
    () => `${uid}-${Math.random().toString(36).slice(2)}`,
    [uid],
  )

  const addQubit = () => {
    if (circuit.numQubits >= MAX_QUBITS) return
    onChange({ ...circuit, numQubits: circuit.numQubits + 1 })
  }

  const removeQubit = () => {
    if (circuit.numQubits <= 1) return
    const last = circuit.numQubits - 1
    onChange({
      numQubits: last,
      gates: circuit.gates.filter(
        (g) => g.qubit < last && (g.targetQubit === undefined || g.targetQubit < last),
      ),
    })
  }

  const clearCircuit = () => onChange({ numQubits: circuit.numQubits, gates: [] })

  const removeGate = (id: string) => {
    onChange({ ...circuit, gates: circuit.gates.filter((g) => g.id !== id) })
    if (selectedGateId === id) setSelectedGateId(null)
  }

  const placeGate = (qubit: number, col: number) => {
    if (!dragGate) return

    // For 2-qubit gates, target qubit is qubit+1 (wrap if needed)
    let targetQubit: number | undefined
    if (dragGate.qubits === 2) {
      targetQubit = qubit + 1 < circuit.numQubits ? qubit + 1 : qubit - 1
      if (targetQubit < 0) return
    }

    // Remove any existing gate at same (qubit, col) to avoid overlap
    const filtered = circuit.gates.filter(
      (g) => !(g.qubit === qubit && g.column === col),
    )

    const newGate: CircuitGate = {
      id: nextId(),
      gateId: dragGate.id,
      qubit,
      targetQubit,
      column: col,
      param: dragGate.paramName !== undefined ? Math.PI / 2 : undefined,
    }

    onChange({ ...circuit, gates: [...filtered, newGate] })
    setDragGate(null)
    setHoverCell(null)
  }

  const gateAtCell = (qubit: number, col: number) =>
    circuit.gates.find((g) => g.qubit === qubit && g.column === col)

  const isTargetCell = (qubit: number, col: number) =>
    circuit.gates.find(
      (g) => g.targetQubit === qubit && g.column === col,
    )

  const columns = Array.from({ length: MAX_COLUMNS }, (_, i) => i)
  const qubits = Array.from({ length: circuit.numQubits }, (_, i) => i)

  return (
    <div className="flex flex-col gap-3">
      {/* Controls */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-slate-400 font-mono">{circuit.numQubits} qubit{circuit.numQubits > 1 ? "s" : ""}</span>
        <button
          onClick={removeQubit}
          disabled={circuit.numQubits <= 1}
          className="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-red-400/10 disabled:opacity-30 transition-colors"
          aria-label="Remove qubit"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={addQubit}
          disabled={circuit.numQubits >= MAX_QUBITS}
          className="p-1 rounded text-slate-400 hover:text-cyan-400 hover:bg-cyan-400/10 disabled:opacity-30 transition-colors"
          aria-label="Add qubit"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
        <div className="flex-1" />
        <button
          onClick={clearCircuit}
          className="flex items-center gap-1.5 px-2 py-1 rounded text-xs text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-colors"
        >
          <Trash2 className="w-3 h-3" />
          Clear
        </button>
      </div>

      {/* Circuit grid */}
      <div
        className="overflow-x-auto pb-2"
        onDragOver={(e) => e.preventDefault()}
      >
        <div className="inline-flex flex-col gap-0 min-w-max">
          {/* Column indices */}
          <div className="flex items-center mb-1">
            <div className="w-12 shrink-0" />
            {columns.map((col) => (
              <div key={col} className="w-12 text-center text-[10px] text-slate-600 font-mono">
                {col}
              </div>
            ))}
          </div>

          {qubits.map((qubit) => (
            <div key={qubit} className="flex items-center">
              {/* Qubit label */}
              <div className="w-12 shrink-0 flex items-center justify-end pr-2">
                <span className="text-xs font-mono text-cyan-400/80">q{qubit}</span>
              </div>

              {columns.map((col) => {
                const gate = gateAtCell(qubit, col)
                const isTarget = isTargetCell(qubit, col)
                const isHover = hoverCell?.qubit === qubit && hoverCell?.col === col
                const isSelected = gate?.id === selectedGateId
                const gateDef = gate ? GATE_DEFS.find((g) => g.id === gate.gateId) : null

                return (
                  <div
                    key={col}
                    className="w-12 h-10 relative flex items-center justify-center"
                    onDragOver={(e) => {
                      e.preventDefault()
                      setHoverCell({ qubit, col })
                    }}
                    onDragLeave={() => setHoverCell(null)}
                    onDrop={() => placeGate(qubit, col)}
                    onClick={() => {
                      if (gate) {
                        setSelectedGateId(isSelected ? null : gate.id)
                      } else if (dragGate) {
                        placeGate(qubit, col)
                      }
                    }}
                  >
                    {/* Wire */}
                    <div className="absolute inset-y-1/2 left-0 right-0 h-px bg-slate-600/70" />

                    {/* Drop zone highlight */}
                    {isHover && dragGate && !gate && (
                      <div className="absolute inset-1 rounded border-2 border-dashed border-cyan-500/60 bg-cyan-500/10" />
                    )}

                    {/* Control-target connector line */}
                    {isTarget && (
                      <div className="absolute inset-y-0 left-1/2 w-px bg-emerald-500/60" />
                    )}

                    {/* Gate chip */}
                    {gate && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedGateId(isSelected ? null : gate.id)
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Delete" || e.key === "Backspace") removeGate(gate.id)
                        }}
                        aria-label={`${gate.gateId} gate on qubit ${qubit}, column ${col}. Press Delete to remove.`}
                        className={cn(
                          "relative z-10 w-9 h-7 rounded flex items-center justify-center",
                          "text-white text-xs font-mono font-bold",
                          "border shadow-md transition-all select-none",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white",
                          gateDef?.color ?? "bg-slate-600",
                          isSelected
                            ? "ring-2 ring-white scale-110 shadow-lg"
                            : "hover:scale-105 hover:shadow-lg",
                        )}
                      >
                        {gate.gateId.length <= 2 ? gate.gateId : gate.gateId.slice(0, 2)}
                      </button>
                    )}

                    {/* Target indicator for 2-qubit gate */}
                    {isTarget && !gate && (
                      <div className="relative z-10 w-6 h-6 rounded-full border-2 border-emerald-500 bg-emerald-500/20 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-emerald-400" />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Selected gate detail */}
      {selectedGateId && (() => {
        const gate = circuit.gates.find((g) => g.id === selectedGateId)
        if (!gate) return null
        const def = GATE_DEFS.find((g) => g.id === gate.gateId)
        return (
          <div className="flex items-center gap-3 p-2 bg-slate-800/60 rounded-lg border border-slate-700/50 text-xs text-slate-300">
            <span className={cn("px-2 py-0.5 rounded font-mono font-bold text-white", def?.color ?? "bg-slate-600")}>
              {gate.gateId}
            </span>
            <span className="text-slate-400">{def?.description}</span>
            <div className="flex-1" />
            <button
              onClick={() => removeGate(gate.id)}
              className="p-1 rounded hover:text-red-400 hover:bg-red-400/10 transition-colors"
              aria-label="Remove gate"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        )
      })()}

      <p className="text-[10px] text-slate-600 text-center">
        Select a gate from the palette, then click a cell — or drag &amp; drop
      </p>
    </div>
  )
}
