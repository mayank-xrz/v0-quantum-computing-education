"use client"

import { basisLabel } from "@/lib/quantum"

interface ProbabilityDisplayProps {
  probabilities: number[]
  numQubits: number
  measured?: number | null
}

const STATE_COLORS = [
  { bar: "#a78bfa", text: "#c4b5fd" },
  { bar: "#60a5fa", text: "#93c5fd" },
  { bar: "#34d399", text: "#6ee7b7" },
  { bar: "#f472b6", text: "#f9a8d4" },
]

export function ProbabilityDisplay({ probabilities, numQubits, measured }: ProbabilityDisplayProps) {
  return (
    <div className="space-y-2 w-full">
      {probabilities.map((prob, i) => {
        const pct = Math.round(prob * 1000) / 10
        const col = STATE_COLORS[i % STATE_COLORS.length]
        const isMeasured = measured === i
        return (
          <div key={i} className="group">
            <div className="flex items-center justify-between mb-1">
              <span
                className="text-xs font-mono"
                style={{ color: col.text }}
              >
                {basisLabel(i, numQubits)}
              </span>
              <span className="text-xs font-mono text-muted-foreground tabular-nums">
                {pct.toFixed(1)}%
              </span>
            </div>
            <div className="h-4 w-full rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
              <div
                className="h-full rounded-full transition-all duration-500 ease-out relative"
                style={{
                  width: `${pct}%`,
                  background: isMeasured
                    ? `linear-gradient(90deg, ${col.bar}, white)`
                    : `linear-gradient(90deg, ${col.bar}cc, ${col.bar})`,
                  boxShadow: pct > 1 ? `0 0 8px ${col.bar}66` : "none",
                }}
              >
                {isMeasured && (
                  <span className="absolute right-1 top-0 bottom-0 flex items-center text-[8px] text-white font-bold">
                    ✓
                  </span>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
