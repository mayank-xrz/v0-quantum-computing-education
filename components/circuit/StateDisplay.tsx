"use client"

import { useMemo } from "react"
import type { SimulationResult } from "@/lib/quantum/circuit"
import { gateMatrixLatex } from "@/lib/quantum/circuit"
import type { CircuitGate } from "@/lib/quantum/circuit"
import { cn } from "@/lib/utils"

interface Props {
  result: SimulationResult
  numQubits: number
  selectedGate?: CircuitGate | null
}

export function StateDisplay({ result, numQubits, selectedGate }: Props) {
  const { probabilities, stateVector } = result

  const sortedProbs = useMemo(
    () =>
      probabilities
        .map((p, i) => ({
          index: i,
          label: `|${i.toString(2).padStart(numQubits, "0")}⟩`,
          prob: p,
        }))
        .sort((a, b) => b.prob - a.prob),
    [probabilities, numQubits],
  )

  const maxProb = Math.max(...probabilities, 0.001)

  return (
    <div className="flex flex-col gap-4">
      {/* State vector */}
      <div>
        <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1.5">State Vector |ψ⟩</p>
        <div className="font-mono text-sm text-cyan-300 bg-slate-900/60 rounded-lg px-3 py-2 border border-slate-700/50 break-all">
          {stateVector.toKetString(3) || "|0…0⟩"}
        </div>
      </div>

      {/* Measurement probabilities */}
      <div>
        <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1.5">Measurement Probabilities</p>
        <div className="flex flex-col gap-1.5">
          {sortedProbs.map(({ index, label, prob }) => (
            <div key={index} className="flex items-center gap-2">
              <span className="font-mono text-xs text-slate-400 w-14 shrink-0">{label}</span>
              <div className="flex-1 h-4 bg-slate-800 rounded overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded transition-all duration-500",
                    prob > 0.5 ? "bg-cyan-500" : prob > 0.1 ? "bg-cyan-600/80" : "bg-slate-600/50",
                  )}
                  style={{ width: `${(prob / maxProb) * 100}%` }}
                />
              </div>
              <span className="font-mono text-xs text-slate-400 w-12 shrink-0 text-right">
                {(prob * 100).toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Amplitudes table */}
      <div>
        <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1.5">Amplitudes</p>
        <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
          {stateVector.amplitudes.map((amp, i) => {
            if (amp.absSquared() < 1e-10) return null
            const label = `|${i.toString(2).padStart(numQubits, "0")}⟩`
            return (
              <div key={i} className="flex gap-1.5 items-center font-mono text-xs">
                <span className="text-slate-500">{label}</span>
                <span className="text-emerald-400">{amp.toString(3)}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Gate matrix (shown when gate is selected) */}
      {selectedGate && (
        <div>
          <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1.5">
            Unitary Matrix — {selectedGate.gateId}
          </p>
          <MatrixDisplay gateId={selectedGate.gateId} param={selectedGate.param} />
        </div>
      )}
    </div>
  )
}

function MatrixDisplay({ gateId, param }: { gateId: string; param?: number }) {
  const matrices: Record<string, number[][]> = {
    H: [[1, 1], [1, -1]],
    X: [[0, 1], [1, 0]],
    Y: [[0, 0], [0, 0]], // displayed differently
    Z: [[1, 0], [0, -1]],
    S: [[1, 0], [0, 0]],
    T: [[1, 0], [0, 0]],
    I: [[1, 0], [0, 1]],
  }

  const matrixLabels: Record<string, string[][]> = {
    H: [["1/√2", "1/√2"], ["1/√2", "-1/√2"]],
    X: [["0", "1"], ["1", "0"]],
    Y: [["0", "-i"], ["i", "0"]],
    Z: [["1", "0"], ["0", "-1"]],
    S: [["1", "0"], ["0", "i"]],
    T: [["1", "0"], ["0", "e^{iπ/4}"]],
    I: [["1", "0"], ["0", "1"]],
    CNOT: [["1","0","0","0"],["0","1","0","0"],["0","0","0","1"],["0","0","1","0"]],
    CZ:   [["1","0","0","0"],["0","1","0","0"],["0","0","1","0"],["0","0","0","-1"]],
    SWAP: [["1","0","0","0"],["0","0","1","0"],["0","1","0","0"],["0","0","0","1"]],
  }

  const rows = matrixLabels[gateId]
  if (!rows) return (
    <p className="text-xs text-slate-500 font-mono">
      {gateId}(θ = {param?.toFixed(3) ?? "π/2"})
    </p>
  )

  const prefix = gateId === "H" ? "1/√2 · " : ""

  return (
    <div className="font-mono text-xs text-slate-300">
      <span className="text-slate-500">{prefix}</span>
      <div className="inline-grid gap-px border border-slate-600 rounded p-1 bg-slate-900/60" style={{ gridTemplateColumns: `repeat(${rows[0].length}, minmax(2.5rem, 1fr))` }}>
        {rows.map((row, ri) =>
          row.map((cell, ci) => (
            <span key={`${ri}-${ci}`} className="text-center px-1 text-emerald-300">
              {cell}
            </span>
          ))
        )}
      </div>
    </div>
  )
}
