"use client"

import { useState, useEffect, useMemo } from "react"
import { Trophy, Flame, Share2, Check, RefreshCw, Lightbulb, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  todaysPuzzle, checkPuzzle, recordSolve, loadStreak, isSolvedToday,
  buildShareText, type Puzzle,
} from "@/lib/quantum/puzzle"
import type { CircuitState } from "@/lib/quantum/circuit"

interface Props {
  circuit: CircuitState
  onSetup: (numQubits: number) => void
}

export function DailyPuzzle({ circuit, onSetup }: Props) {
  const puzzle = useMemo(todaysPuzzle, [])
  const today = new Date().toISOString().slice(0, 10)

  const [alreadySolved]  = useState(isSolvedToday)
  const [solved, setSolved] = useState(alreadySolved)
  const [fidelity, setFidelity] = useState(0)
  const [streak, setStreak] = useState(() => loadStreak())
  const [showHint, setShowHint] = useState(false)
  const [copied, setCopied] = useState(false)
  const [checking, setChecking] = useState(false)

  // Re-check whenever the circuit changes
  useEffect(() => {
    if (solved) return
    const { passed, fidelity: f } = checkPuzzle(circuit, puzzle)
    setFidelity(f)
    if (passed) {
      setSolved(true)
      const updated = recordSolve(today)
      setStreak(updated)
    }
  }, [circuit, puzzle, solved, today])

  const handleSetup = () => {
    onSetup(puzzle.numQubits)
  }

  const handleShare = async () => {
    const gatesUsed = circuit.gates.length
    const text = buildShareText(puzzle, gatesUsed, fidelity)
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const fidelityPct = fidelity * 100

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-800 shrink-0 flex items-center gap-2">
        <Trophy className={cn("w-4 h-4", solved ? "text-yellow-400" : "text-slate-500")} />
        <span className="text-sm font-semibold text-slate-200">Daily Puzzle</span>
        <span className="text-[10px] text-slate-600 font-mono ml-auto">{today}</span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto min-h-0 p-4 flex flex-col gap-4">

        {/* Streak */}
        <div className="flex gap-2">
          <StreakBadge icon={<Flame className="w-3.5 h-3.5 text-orange-400" />} label="Streak" value={streak.currentStreak} />
          <StreakBadge icon={<Trophy className="w-3.5 h-3.5 text-yellow-400" />} label="Best" value={streak.bestStreak} />
        </div>

        {/* Puzzle card */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-700/50 flex flex-col gap-3">
          <div>
            <p className="text-base font-bold text-slate-100">{puzzle.title}</p>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">{puzzle.description}</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-xs text-slate-500">
              <span>Target state</span>
              <span>Max {puzzle.maxGates} gate{puzzle.maxGates > 1 ? "s" : ""}</span>
            </div>
            <div className="font-mono text-sm text-cyan-300 bg-slate-950/60 rounded-lg px-3 py-1.5 border border-slate-800">
              {puzzle.targetKet}
            </div>
          </div>

          {/* Qubit setup */}
          {circuit.numQubits !== puzzle.numQubits && (
            <button
              onClick={handleSetup}
              className="flex items-center justify-between px-3 py-2 rounded-lg bg-amber-900/20 border border-amber-700/30 text-xs text-amber-300 hover:bg-amber-900/30 transition-colors"
            >
              <span>This puzzle needs {puzzle.numQubits} qubit{puzzle.numQubits > 1 ? "s" : ""}.</span>
              <span className="font-semibold">Set up →</span>
            </button>
          )}
        </div>

        {/* Fidelity meter */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-500">Fidelity to target</span>
            <span className={cn("font-mono font-semibold", solved ? "text-emerald-400" : fidelityPct > 50 ? "text-yellow-400" : "text-slate-500")}>
              {fidelityPct.toFixed(1)}%
            </span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                solved ? "bg-emerald-500" : fidelityPct > 80 ? "bg-yellow-500" : "bg-cyan-700",
              )}
              style={{ width: `${fidelityPct}%` }}
            />
          </div>
          {fidelityPct > 50 && fidelityPct < 99.9 && !solved && (
            <p className="text-[10px] text-yellow-400/70 mt-1">Getting warmer… try adjusting your gates</p>
          )}
        </div>

        {/* Solved state */}
        {solved && (
          <div className="p-3 rounded-xl bg-emerald-900/20 border border-emerald-700/30 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-emerald-300 font-semibold text-sm">
              <Check className="w-4 h-4" />
              Puzzle solved! 🎉
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">{puzzle.explanation}</p>
            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition-colors mt-1"
            >
              {copied ? <Check className="w-3 h-3" /> : <Share2 className="w-3 h-3" />}
              {copied ? "Copied!" : "Share result"}
            </button>
          </div>
        )}

        {/* Hint */}
        {!solved && (
          <div>
            <button
              onClick={() => setShowHint((v) => !v)}
              className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-yellow-400 transition-colors"
            >
              <Lightbulb className="w-3 h-3" />
              {showHint ? "Hide hint" : "Show hint"}
            </button>
            {showHint && (
              <p className="mt-2 text-xs text-yellow-300/80 pl-4 border-l border-yellow-700/40">
                {puzzle.hint}
              </p>
            )}
          </div>
        )}

        {/* Instructions */}
        {!solved && circuit.numQubits === puzzle.numQubits && (
          <p className="text-[10px] text-slate-600 leading-relaxed">
            Use the circuit builder to add gates. The fidelity meter updates live as you build. A new puzzle drops every day at midnight UTC.
          </p>
        )}
      </div>
    </div>
  )
}

function StreakBadge({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: number
}) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50 flex-1">
      {icon}
      <div>
        <div className="text-base font-bold text-slate-100 leading-none">{value}</div>
        <div className="text-[9px] text-slate-500 mt-0.5">{label}</div>
      </div>
    </div>
  )
}
