"use client"

import { useState, useEffect, useRef } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from "recharts"
import { Slider } from "@/components/ui/slider"
import { Zap, Search, Lock, FlaskConical, Cpu } from "lucide-react"

type Algorithm = "grover" | "shor" | "vqe" | "qft"

interface AlgorithmInfo {
  label: string
  classical: (n: number) => number
  quantum: (n: number) => number
  classicalLabel: string
  quantumLabel: string
  icon: React.ReactNode
  color: string
  description: string
  application: string
}

const ALGORITHMS: Record<Algorithm, AlgorithmInfo> = {
  grover: {
    label: "Grover's Search",
    classical: n => n,
    quantum: n => Math.ceil(Math.PI / 4 * Math.sqrt(n)),
    classicalLabel: "O(N)",
    quantumLabel: "O(√N)",
    icon: <Search className="w-4 h-4" />,
    color: "#a78bfa",
    description: "Searches an unsorted database of N items. Quantum provides quadratic speedup.",
    application: "Database search, cryptanalysis, optimization",
  },
  shor: {
    label: "Shor's Factoring",
    classical: n => Math.pow(Math.exp(Math.pow(Math.log(n), 1 / 3) * Math.pow(Math.log(Math.log(n)), 2 / 3) * 1.923), 1),
    quantum: n => Math.pow(Math.log2(n), 3),
    classicalLabel: "sub-exp",
    quantumLabel: "O((log N)³)",
    icon: <Lock className="w-4 h-4" />,
    color: "#f472b6",
    description: "Factors large integers. Exponential speedup threatens RSA encryption.",
    application: "Breaking RSA-2048, post-quantum crypto motivation",
  },
  vqe: {
    label: "VQE (Chemistry)",
    classical: n => Math.pow(n, 6),
    quantum: n => Math.pow(n, 3),
    classicalLabel: "O(N⁶)",
    quantumLabel: "O(N³)",
    icon: <FlaskConical className="w-4 h-4" />,
    color: "#34d399",
    description: "Finds ground state energies of molecules. Exponential classical scaling.",
    application: "Drug discovery, materials science, catalyst design",
  },
  qft: {
    label: "Quantum Fourier Transform",
    classical: n => n * Math.log2(n),
    quantum: n => Math.pow(Math.log2(n), 2),
    classicalLabel: "O(N log N)",
    quantumLabel: "O((log N)²)",
    icon: <Cpu className="w-4 h-4" />,
    color: "#60a5fa",
    description: "Quantum analog of FFT. Exponential gate reduction vs classical DFT.",
    application: "Shor's algorithm, phase estimation, signal processing",
  },
}

function formatSteps(n: number): string {
  if (n >= 1e12) return `${(n / 1e12).toFixed(1)}T`
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`
  return n.toFixed(0)
}

// Animated search grid to visually demonstrate Grover's vs classical
function SearchGrid({ n, quantum, searching, found }: { n: number; quantum: boolean; searching: boolean; found: number | null }) {
  const gridSize = Math.min(n, 64)
  const target = useRef(Math.floor(Math.random() * gridSize)).current

  return (
    <div className="flex flex-wrap gap-0.5" style={{ maxWidth: 300 }}>
      {Array.from({ length: gridSize }, (_, i) => {
        const isFound = found !== null && i === target
        const isActive = searching && !quantum && found === null && i === Math.floor(found ?? 0)
        return (
          <div
            key={i}
            className="transition-all duration-150 rounded-sm"
            style={{
              width: 10,
              height: 10,
              background: isFound
                ? "#34d399"
                : searching && quantum
                  ? `rgba(167,139,250,${0.1 + Math.random() * 0.5})`
                  : "rgba(255,255,255,0.07)",
              boxShadow: isFound ? "0 0 6px #34d399" : undefined,
              transition: quantum ? `opacity ${Math.random() * 0.3}s` : undefined,
            }}
          />
        )
      })}
    </div>
  )
}

export function SpeedupExplorer() {
  const [algorithm, setAlgorithm] = useState<Algorithm>("grover")
  const [inputSize, setInputSize] = useState(64)
  const [searching, setSearching] = useState(false)
  const [found, setFound] = useState<number | null>(null)
  const [classicalStep, setClassicalStep] = useState(0)

  const algo = ALGORITHMS[algorithm]
  const classicalSteps = Math.min(algo.classical(inputSize), 1e13)
  const quantumSteps = Math.min(algo.quantum(inputSize), 1e13)
  const speedup = classicalSteps / quantumSteps

  // Scaling chart data
  const chartData = Array.from({ length: 12 }, (_, i) => {
    const n = Math.pow(2, i + 2)
    const c = Math.min(algo.classical(n), 1e9)
    const q = Math.min(algo.quantum(n), 1e9)
    return { n: n <= 1024 ? `${n}` : `2^${i + 2}`, classical: c, quantum: q }
  })

  const runDemo = () => {
    setFound(null)
    setClassicalStep(0)
    setSearching(true)
    const target = Math.floor(Math.random() * Math.min(inputSize, 64))
    const qSteps = Math.ceil(algo.quantum(Math.min(inputSize, 64)))
    setTimeout(() => {
      setFound(target)
      setSearching(false)
    }, Math.min(qSteps * 80, 2000))
  }

  return (
    <div className="w-full rounded-2xl overflow-hidden"
      style={{ background: "rgba(15,15,30,0.8)", border: "1px solid rgba(167,139,250,0.15)" }}>

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-violet-400" />
          <span className="text-sm font-semibold text-white/80 font-mono tracking-wide">QUANTUM SPEEDUP EXPLORER</span>
        </div>
        <div className="text-xs font-mono px-2 py-0.5 rounded" style={{ color: "#f472b6", background: "rgba(244,114,182,0.1)" }}>
          {speedup >= 1e6 ? `${(speedup / 1e6).toFixed(0)}M×` : speedup >= 1000 ? `${(speedup / 1000).toFixed(0)}K×` : `${speedup.toFixed(1)}×`} faster
        </div>
      </div>

      <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-white/5">

        {/* Controls */}
        <div className="p-5 lg:w-60 space-y-5 shrink-0">
          <div>
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-3">Algorithm</p>
            <div className="space-y-1.5">
              {(Object.entries(ALGORITHMS) as [Algorithm, AlgorithmInfo][]).map(([key, a]) => (
                <button
                  key={key}
                  onClick={() => { setAlgorithm(key); setFound(null); setSearching(false) }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-mono text-left transition-all"
                  style={{
                    background: algorithm === key ? a.color + "18" : "rgba(255,255,255,0.03)",
                    border: algorithm === key ? `1px solid ${a.color}44` : "1px solid transparent",
                    color: algorithm === key ? a.color : "#9ca3af",
                  }}
                >
                  <span style={{ color: a.color }}>{a.icon}</span>
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Input size N</span>
              <span className="text-xs font-mono text-white/70">{inputSize}</span>
            </div>
            <Slider value={[inputSize]} min={4} max={512} step={4}
              onValueChange={([v]) => { setInputSize(v); setFound(null) }} />
          </div>

          {/* Step counts */}
          <div className="space-y-2">
            <div className="p-3 rounded-xl" style={{ background: "rgba(96,165,250,0.06)", border: "1px solid rgba(96,165,250,0.12)" }}>
              <p className="text-[10px] font-mono text-blue-400/70 uppercase tracking-wide">Classical</p>
              <div className="text-xl font-bold font-mono text-blue-300">{formatSteps(classicalSteps)}</div>
              <p className="text-[10px] text-muted-foreground">{algo.classicalLabel} operations</p>
            </div>
            <div className="p-3 rounded-xl" style={{ background: `${algo.color}0d`, border: `1px solid ${algo.color}22` }}>
              <p className="text-[10px] font-mono uppercase tracking-wide" style={{ color: algo.color + "bb" }}>Quantum</p>
              <div className="text-xl font-bold font-mono" style={{ color: algo.color }}>{formatSteps(quantumSteps)}</div>
              <p className="text-[10px] text-muted-foreground">{algo.quantumLabel} operations</p>
            </div>
          </div>

          <p className="text-[10px] text-muted-foreground/80 leading-relaxed">{algo.description}</p>
        </div>

        {/* Visualization */}
        <div className="flex-1 p-5 space-y-6">
          {/* Scaling chart */}
          <div>
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-3">Operation count vs input size</p>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="n" tick={{ fontSize: 9, fill: "#6b7280", fontFamily: "monospace" }} tickLine={false} />
                  <YAxis scale="log" domain={["auto", "auto"]} tick={{ fontSize: 9, fill: "#6b7280", fontFamily: "monospace" }} tickLine={false}
                    tickFormatter={v => formatSteps(v)} />
                  <Tooltip
                    contentStyle={{ background: "rgba(15,15,30,0.95)", border: "1px solid rgba(167,139,250,0.2)", borderRadius: 8, fontSize: 11, fontFamily: "monospace" }}
                    formatter={(v: number, name: string) => [formatSteps(v) + " ops", name === "classical" ? "Classical" : "Quantum"]}
                  />
                  <Line type="monotone" dataKey="classical" stroke="#60a5fa" strokeWidth={2} dot={false} name="classical" />
                  <Line type="monotone" dataKey="quantum" stroke={algo.color} strokeWidth={2.5} dot={false} name="quantum" strokeDasharray="none" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bar comparison for current N */}
          <div>
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-3">Comparison at N={inputSize}</p>
            <div className="space-y-3">
              {[
                { label: "Classical", steps: classicalSteps, color: "#60a5fa", bg: "rgba(96,165,250,0.1)" },
                { label: "Quantum", steps: quantumSteps, color: algo.color, bg: algo.color + "18" },
              ].map(({ label, steps, color, bg }) => {
                const maxSteps = Math.max(classicalSteps, quantumSteps)
                const pct = (steps / maxSteps) * 100
                return (
                  <div key={label}>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs font-mono" style={{ color }}>{label}</span>
                      <span className="text-xs font-mono text-muted-foreground">{formatSteps(steps)} ops</span>
                    </div>
                    <div className="h-5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${Math.max(pct, 1)}%`, background: color, boxShadow: `0 0 8px ${color}55` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Application tags */}
          <div>
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-2">Real-world applications</p>
            <div className="flex flex-wrap gap-2">
              {algo.application.split(",").map(app => (
                <span key={app} className="px-2 py-1 rounded-full text-[10px] font-mono"
                  style={{ background: algo.color + "14", border: `1px solid ${algo.color}33`, color: algo.color + "cc" }}>
                  {app.trim()}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
