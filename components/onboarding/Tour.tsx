"use client"

import { useState, useEffect, useLayoutEffect, useCallback, useRef } from "react"
import { X, ArrowRight, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

export interface TourStep {
  targetId: string
  title: string
  body: string
  placement?: "top" | "bottom" | "left" | "right"
}

interface Rect { top: number; left: number; width: number; height: number }
const EMPTY_RECT: Rect = { top: 0, left: 0, width: 0, height: 0 }
const CARD_W = 280
const GAP = 14

const TOUR_STEPS: TourStep[] = [
  {
    targetId: "tour-circuit",
    title: "Circuit Builder",
    body: "Select a gate from the palette on the left, then click any cell to place it. Each row is a qubit, each column is a time step.",
    placement: "bottom",
  },
  {
    targetId: "tour-bloch",
    title: "Bloch Sphere",
    body: "This is your qubit's live state — not a decoration. Every gate you add moves the state vector in real time.",
    placement: "right",
  },
  {
    targetId: "tour-state-panel",
    title: "Quantum State Panel",
    body: "See the exact state vector, measurement probabilities, and the unitary matrix for any selected gate.",
    placement: "left",
  },
  {
    targetId: "tour-tutor-tab",
    title: "AI Quantum Tutor",
    body: "The tutor reads your live circuit and answers questions grounded in what you've built. Ask \"why did my qubit collapse?\" and it knows.",
    placement: "left",
  },
]

interface Props {
  onDone: () => void
}

export function Tour({ onDone }: Props) {
  const [step, setStep] = useState(0)
  const [targetRect, setTargetRect] = useState<Rect>(EMPTY_RECT)
  const cardRef = useRef<HTMLDivElement>(null)

  const current = TOUR_STEPS[step]

  const measureTarget = useCallback(() => {
    const el = document.getElementById(current.targetId)
    if (!el) return
    const r = el.getBoundingClientRect()
    setTargetRect({ top: r.top, left: r.left, width: r.width, height: r.height })
  }, [current.targetId])

  useLayoutEffect(() => {
    measureTarget()
    window.addEventListener("resize", measureTarget)
    return () => window.removeEventListener("resize", measureTarget)
  }, [measureTarget])

  const next = () => {
    if (step < TOUR_STEPS.length - 1) setStep((s) => s + 1)
    else onDone()
  }

  const skip = () => onDone()

  const placement = current.placement ?? "bottom"

  // Card position
  const cardStyle: React.CSSProperties = (() => {
    const { top, left, width, height } = targetRect
    switch (placement) {
      case "bottom": return { top: top + height + GAP, left: Math.max(8, left + width / 2 - CARD_W / 2) }
      case "top":    return { top: top - GAP - 160, left: Math.max(8, left + width / 2 - CARD_W / 2) }
      case "right":  return { top: Math.max(8, top + height / 2 - 80), left: left + width + GAP }
      case "left":   return { top: Math.max(8, top + height / 2 - 80), left: Math.max(8, left - CARD_W - GAP) }
    }
  })()

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Spotlight overlay */}
      <svg className="absolute inset-0 w-full h-full pointer-events-auto" onClick={skip}>
        <defs>
          <mask id="spotlight">
            <rect width="100%" height="100%" fill="white" />
            <rect
              x={targetRect.left - 6}
              y={targetRect.top - 6}
              width={targetRect.width + 12}
              height={targetRect.height + 12}
              rx="10"
              fill="black"
            />
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(0,0,0,0.65)"
          mask="url(#spotlight)"
        />
      </svg>

      {/* Highlight ring */}
      <div
        className="absolute pointer-events-none rounded-xl ring-2 ring-cyan-500 ring-offset-2 ring-offset-transparent transition-all duration-300"
        style={{
          top: targetRect.top - 6,
          left: targetRect.left - 6,
          width: targetRect.width + 12,
          height: targetRect.height + 12,
          boxShadow: "0 0 0 9999px transparent, 0 0 24px rgba(6,182,212,0.6)",
        }}
      />

      {/* Card */}
      <div
        ref={cardRef}
        className="absolute pointer-events-auto bg-slate-900 border border-cyan-500/40 rounded-2xl p-4 shadow-2xl shadow-black/50 transition-all duration-300"
        style={{ ...cardStyle, width: CARD_W }}
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center shrink-0">
              <Sparkles className="w-2.5 h-2.5 text-white" />
            </div>
            <p className="text-sm font-semibold text-slate-100">{current.title}</p>
          </div>
          <button onClick={skip} className="text-slate-500 hover:text-slate-300 transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed mb-3">{current.body}</p>

        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            {TOUR_STEPS.map((_, i) => (
              <div
                key={i}
                className={cn(
                  "w-1.5 h-1.5 rounded-full transition-all",
                  i === step ? "bg-cyan-500 w-3" : i < step ? "bg-cyan-800" : "bg-slate-700",
                )}
              />
            ))}
          </div>
          <button
            onClick={next}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition-colors"
          >
            {step < TOUR_STEPS.length - 1 ? (
              <>Next <ArrowRight className="w-3 h-3" /></>
            ) : (
              "Let's go!"
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
