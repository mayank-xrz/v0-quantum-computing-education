"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { ArrowRight, Sparkles, FlaskConical, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { encodeCircuit } from "@/lib/quantum/share"
import { PRESET_CIRCUITS } from "@/lib/quantum/algorithms"
import type { CircuitState } from "@/lib/quantum/circuit"
import { simulateCircuit } from "@/lib/quantum/circuit"
import { StateVector } from "@/lib/quantum/state-vector"

// Precompute the Bell state hash for the "Try demo" CTA
const BELL = PRESET_CIRCUITS.find((p) => p.id === "bell")!.circuit
const BELL_HASH = encodeCircuit(BELL)

// Animated state vector that cycles through interesting states
const DEMO_STATES: { label: string; circuit: CircuitState }[] = [
  { label: "|0⟩ ground state",        circuit: { numQubits: 1, gates: [] } },
  { label: "|+⟩ superposition",        circuit: { numQubits: 1, gates: [{ id: "h", gateId: "H", qubit: 0, column: 0 }] } },
  { label: "T gate phase",              circuit: { numQubits: 1, gates: [{ id: "h", gateId: "H", qubit: 0, column: 0 }, { id: "t", gateId: "T", qubit: 0, column: 1 }] } },
  { label: "S gate rotation",           circuit: { numQubits: 1, gates: [{ id: "h", gateId: "H", qubit: 0, column: 0 }, { id: "s", gateId: "S", qubit: 0, column: 1 }] } },
  { label: "|1⟩ excited state",         circuit: { numQubits: 1, gates: [{ id: "x", gateId: "X", qubit: 0, column: 0 }] } },
  { label: "|−⟩ interference",          circuit: { numQubits: 1, gates: [{ id: "x", gateId: "X", qubit: 0, column: 0 }, { id: "h", gateId: "H", qubit: 0, column: 1 }] } },
]

function HeroBloch() {
  const [stateIdx, setStateIdx] = useState(0)
  const [bloch, setBloch] = useState({ x: 0, y: 0, z: 1 })
  const animRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    animRef.current = setInterval(() => {
      setStateIdx((i) => (i + 1) % DEMO_STATES.length)
    }, 2200)
    return () => { if (animRef.current) clearInterval(animRef.current) }
  }, [])

  useEffect(() => {
    try {
      const result = simulateCircuit(DEMO_STATES[stateIdx].circuit)
      const v = result.stateVector.blochVector()
      if (v) setBloch(v)
    } catch {}
  }, [stateIdx])

  const size = 220
  const cx = size / 2, cy = size / 2, r = size * 0.38

  const projX = bloch.x * 0.7 + bloch.y * 0.3
  const projY = -bloch.z
  const tipX = cx + projX * r
  const tipY = cy + projY * r

  return (
    <div className="flex flex-col items-center gap-4">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="drop-shadow-2xl"
        aria-label="Animated Bloch sphere demo"
      >
        <defs>
          <radialGradient id="heroSphereGrad" cx="38%" cy="32%">
            <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#0c4a6e" stopOpacity="0.9" />
          </radialGradient>
          <radialGradient id="heroGlowGrad" cx="50%" cy="50%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
          </radialGradient>
          <marker id="heroArrow" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 Z" fill="#38bdf8" />
          </marker>
        </defs>

        {/* Glow */}
        <circle cx={cx} cy={cy} r={r + 20} fill="url(#heroGlowGrad)" />

        {/* Sphere */}
        <circle cx={cx} cy={cy} r={r} fill="url(#heroSphereGrad)" stroke="#38bdf8" strokeWidth="1.5" strokeOpacity="0.5" />

        {/* Grid lines */}
        <ellipse cx={cx} cy={cy} rx={r} ry={r * 0.28} fill="none" stroke="#38bdf8" strokeWidth="0.8" strokeOpacity="0.3" strokeDasharray="4 3" />
        <ellipse cx={cx} cy={cy} rx={r * 0.28} ry={r} fill="none" stroke="#38bdf8" strokeWidth="0.8" strokeOpacity="0.25" strokeDasharray="4 3" />
        <line x1={cx} y1={cy - r} x2={cx} y2={cy + r} stroke="#94a3b8" strokeWidth="0.8" strokeOpacity="0.4" />
        <line x1={cx - r} y1={cy} x2={cx + r} y2={cy} stroke="#94a3b8" strokeWidth="0.8" strokeOpacity="0.4" />

        {/* State vector */}
        <line
          x1={cx} y1={cy}
          x2={tipX} y2={tipY}
          stroke="#38bdf8"
          strokeWidth="3"
          strokeLinecap="round"
          markerEnd="url(#heroArrow)"
          style={{ transition: "x2 0.6s cubic-bezier(0.4,0,0.2,1), y2 0.6s cubic-bezier(0.4,0,0.2,1)" }}
        />
        <circle cx={cx} cy={cy} r={3.5} fill="#38bdf8" />

        {/* Pole labels */}
        <text x={cx} y={cy - r - 10} textAnchor="middle" fill="#7dd3fc" fontSize="13" fontFamily="monospace">|0⟩</text>
        <text x={cx} y={cy + r + 18} textAnchor="middle" fill="#34d399" fontSize="13" fontFamily="monospace">|1⟩</text>
      </svg>

      {/* State label cycling */}
      <div className="text-xs font-mono text-cyan-400/80 h-5 text-center tabular-nums transition-opacity duration-300">
        {DEMO_STATES[stateIdx].label}
      </div>
    </div>
  )
}

// Feature chips shown below the CTA
const FEATURES = [
  { icon: "⚛", label: "Live circuit simulator" },
  { icon: "🤖", label: "AI quantum tutor" },
  { icon: "📊", label: "Grover's & Deutsch-Jozsa" },
  { icon: "🐍", label: "Qiskit export" },
]

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
      {/* Deep space background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_30%,rgba(6,182,212,0.08),transparent)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_80%_60%,rgba(139,92,246,0.06),transparent)]" />

      {/* Subtle grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(56,189,248,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(56,189,248,0.025)_1px,transparent_1px)] bg-[size:60px_60px]" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">

          {/* Left: copy */}
          <div className="text-center lg:text-left">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-cyan-400 text-xs font-semibold mb-6 tracking-wide">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400" />
              </span>
              Interactive Quantum Education
            </div>

            {/* Headline */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05] text-balance">
              <span className="text-slate-100">Quantum</span>
              <br />
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-400 bg-clip-text text-transparent">
                Computing
              </span>
              <br />
              <span className="text-slate-300 text-4xl sm:text-5xl lg:text-6xl font-semibold">you can touch</span>
            </h1>

            {/* Sub */}
            <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-lg mx-auto lg:mx-0 leading-relaxed">
              Build real quantum circuits, watch the state vector update live,
              and ask an AI tutor questions grounded in <em>your</em> circuit —
              not generic theory.
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <Button
                size="lg"
                className="group bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_24px_rgba(8,145,178,0.4)] hover:shadow-[0_0_32px_rgba(8,145,178,0.6)] transition-all"
                asChild
              >
                <Link href="/playground">
                  <FlaskConical className="mr-2 w-5 h-5" />
                  Open Playground
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-slate-600 text-slate-300 hover:border-cyan-700 hover:text-cyan-300 hover:bg-cyan-950/30 transition-all"
                asChild
              >
                <Link href={`/playground#${BELL_HASH}`}>
                  <Sparkles className="mr-2 w-4 h-4 text-cyan-400" />
                  Try Bell State demo
                  <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </div>

            {/* Feature chips */}
            <div className="mt-8 flex flex-wrap gap-2 justify-center lg:justify-start">
              {FEATURES.map((f) => (
                <span
                  key={f.label}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/60 border border-slate-700/60 text-xs text-slate-400"
                >
                  <span>{f.icon}</span>
                  {f.label}
                </span>
              ))}
            </div>

            {/* Social proof */}
            <div className="mt-10 flex items-center gap-6 justify-center lg:justify-start">
              {[
                { n: "26", label: "verified tests" },
                { n: "12+", label: "quantum gates" },
                { n: "2", label: "algorithms" },
              ].map((s, i, arr) => (
                <div key={s.label} className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-slate-100">{s.n}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
                  </div>
                  {i < arr.length - 1 && <div className="w-px h-8 bg-slate-800" />}
                </div>
              ))}
            </div>
          </div>

          {/* Right: live Bloch sphere */}
          <div className="flex flex-col items-center justify-center gap-6">
            <HeroBloch />

            {/* Mini feature cards */}
            <div className="grid grid-cols-2 gap-2 w-full max-w-xs">
              {[
                { icon: <Zap className="w-3.5 h-3.5 text-cyan-400" />, title: "Real-time state", body: "State vector updates with every gate" },
                { icon: <Sparkles className="w-3.5 h-3.5 text-violet-400" />, title: "AI Tutor", body: "Explains your actual circuit" },
              ].map((card) => (
                <div
                  key={card.title}
                  className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-left"
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    {card.icon}
                    <span className="text-xs font-semibold text-slate-200">{card.title}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-relaxed">{card.body}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
