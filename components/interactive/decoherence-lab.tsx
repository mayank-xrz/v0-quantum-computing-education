"use client"

import { useState, useEffect, useRef } from "react"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts"
import { Play, Pause, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"

const SAMPLE_COUNT = 80

function buildFidelityData(t2: number, errorRate: number, correction: boolean) {
  return Array.from({ length: SAMPLE_COUNT }, (_, i) => {
    const t = i / (SAMPLE_COUNT - 1)
    const decoh = Math.exp(-t / (t2 / 100))
    const noise = errorRate > 0 ? Math.exp(-errorRate * t * 4) : 1
    const correctionBoost = correction ? Math.pow(1 - errorRate * 0.01, Math.floor(t * 10)) : 1
    const fidelity = Math.max(0, decoh * noise * correctionBoost)
    const quantum = Math.max(0, Math.sin(t * Math.PI * 3) * fidelity * 0.5 + fidelity * 0.5)
    return {
      t: (t * 100).toFixed(0),
      fidelity: parseFloat((fidelity * 100).toFixed(2)),
      coherence: parseFloat((quantum * 100).toFixed(2)),
    }
  })
}

interface QubitBlobProps {
  fidelity: number
  index: number
}

function QubitBlob({ fidelity, index }: QubitBlobProps) {
  const size = 40 + fidelity * 0.2
  const blur = Math.max(0, (1 - fidelity / 100) * 14)
  const opacity = 0.3 + fidelity * 0.007
  const colors = [
    { from: "#a78bfa", to: "#60a5fa" },
    { from: "#f472b6", to: "#fb923c" },
    { from: "#34d399", to: "#22d3ee" },
  ]
  const col = colors[index % colors.length]
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="rounded-full transition-all duration-300 relative"
        style={{
          width: size,
          height: size,
          background: `radial-gradient(circle at 35% 35%, ${col.from}, ${col.to})`,
          boxShadow: `0 0 ${16 + fidelity * 0.2}px ${col.from}${Math.round(opacity * 255).toString(16).padStart(2, "0")}`,
          filter: `blur(${blur}px)`,
          opacity,
        }}
      />
      <span className="text-[10px] font-mono text-muted-foreground">q{index}</span>
    </div>
  )
}

export function DecoherenceLab() {
  const [t2, setT2] = useState(60)
  const [errorRate, setErrorRate] = useState(15)
  const [correction, setCorrection] = useState(false)
  const [running, setRunning] = useState(false)
  const [time, setTime] = useState(0)
  const rafRef = useRef<number | null>(null)
  const lastRef = useRef<number>(0)

  useEffect(() => {
    if (!running) return
    const tick = (now: number) => {
      if (lastRef.current === 0) lastRef.current = now
      const dt = (now - lastRef.current) / 1000
      lastRef.current = now
      setTime(prev => {
        const next = prev + dt * 20
        if (next >= 100) { setRunning(false); return 100 }
        return next
      })
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); lastRef.current = 0 }
  }, [running])

  const reset = () => { setTime(0); setRunning(false) }

  const data = buildFidelityData(t2, errorRate, correction)
  const currentIndex = Math.min(SAMPLE_COUNT - 1, Math.floor((time / 100) * (SAMPLE_COUNT - 1)))
  const currentFidelity = data[currentIndex]?.fidelity ?? 100

  const threshold = errorRate < 5 ? "Below error threshold" : errorRate < 20 ? "Near threshold" : "Above threshold — correction needed"
  const thresholdColor = errorRate < 5 ? "#34d399" : errorRate < 20 ? "#fbbf24" : "#f87171"

  return (
    <div className="w-full rounded-2xl overflow-hidden"
      style={{ background: "rgba(15,15,30,0.8)", border: "1px solid rgba(167,139,250,0.15)" }}>

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: thresholdColor, boxShadow: `0 0 6px ${thresholdColor}` }} />
          <span className="text-sm font-semibold text-white/80 font-mono tracking-wide">DECOHERENCE LAB</span>
        </div>
        <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ color: thresholdColor, background: thresholdColor + "18" }}>
          {threshold}
        </span>
      </div>

      <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-white/5">

        {/* Controls */}
        <div className="p-5 lg:w-56 space-y-6 shrink-0">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">T₂ (dephasing time)</span>
              <span className="text-xs font-mono text-white/70">{t2}%</span>
            </div>
            <Slider
              value={[t2]} min={10} max={100} step={1}
              onValueChange={([v]) => { setT2(v); reset() }}
              className="cursor-pointer"
            />
            <p className="text-[10px] text-muted-foreground mt-1.5">Higher → slower decoherence</p>
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Error rate</span>
              <span className="text-xs font-mono" style={{ color: thresholdColor }}>{errorRate}%</span>
            </div>
            <Slider
              value={[errorRate]} min={0} max={50} step={1}
              onValueChange={([v]) => { setErrorRate(v); reset() }}
              className="cursor-pointer"
            />
            <p className="text-[10px] text-muted-foreground mt-1.5">Surface code threshold ≈ 1%</p>
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Error correction</span>
            </div>
            <button
              onClick={() => { setCorrection(c => !c); reset() }}
              className="w-full py-2 rounded-lg text-xs font-mono transition-all duration-200"
              style={{
                background: correction ? "rgba(52,211,153,0.15)" : "rgba(255,255,255,0.05)",
                border: correction ? "1px solid rgba(52,211,153,0.4)" : "1px solid rgba(255,255,255,0.1)",
                color: correction ? "#34d399" : "#9ca3af",
              }}
            >
              {correction ? "✓ Surface Code ON" : "Surface Code OFF"}
            </button>
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1 font-mono text-xs h-8"
              style={{ background: running ? "rgba(248,113,113,0.2)" : "rgba(167,139,250,0.2)", border: "1px solid rgba(167,139,250,0.3)", color: running ? "#f87171" : "#c4b5fd" }}
              onClick={() => { if (time >= 100) reset(); setRunning(r => !r) }}
            >
              {running ? <><Pause className="w-3 h-3 mr-1" />Pause</> : <><Play className="w-3 h-3 mr-1" />Run</>}
            </Button>
            <Button size="sm" variant="ghost" className="h-8 px-2 text-muted-foreground" onClick={reset}>
              <RotateCcw className="w-3 h-3" />
            </Button>
          </div>

          {/* Fidelity readout */}
          <div className="p-3 rounded-xl" style={{ background: "rgba(167,139,250,0.06)", border: "1px solid rgba(167,139,250,0.1)" }}>
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-1">Fidelity</p>
            <div className="text-3xl font-bold font-mono" style={{ color: currentFidelity > 60 ? "#a78bfa" : currentFidelity > 30 ? "#fbbf24" : "#f87171" }}>
              {currentFidelity.toFixed(1)}%
            </div>
            <div className="mt-2 h-1.5 rounded-full overflow-hidden bg-white/5">
              <div className="h-full rounded-full transition-all duration-100"
                style={{
                  width: `${currentFidelity}%`,
                  background: currentFidelity > 60 ? "linear-gradient(90deg,#7c3aed,#a78bfa)" : currentFidelity > 30 ? "#fbbf24" : "#ef4444",
                }} />
            </div>
          </div>
        </div>

        {/* Visualization */}
        <div className="flex-1 p-5 space-y-6">
          {/* Qubit blobs */}
          <div>
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-4">Qubit Coherence</p>
            <div className="flex items-end justify-center gap-8 h-20">
              {[0, 1, 2, 3].map(i => (
                <QubitBlob key={i} fidelity={currentFidelity} index={i} />
              ))}
            </div>
            <p className="text-center text-[10px] text-muted-foreground mt-3">
              {currentFidelity > 80 ? "Qubits in coherent superposition" :
                currentFidelity > 40 ? "Decoherence progressing — quantum info degrading" :
                  "Classical noise dominates — quantum advantage lost"}
            </p>
          </div>

          {/* Fidelity chart */}
          <div>
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-3">Fidelity over time</p>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.slice(0, currentIndex + 1)} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="fidGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#a78bfa" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="cohGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#34d399" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#34d399" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="t" tick={{ fontSize: 9, fill: "#6b7280", fontFamily: "monospace" }} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: "#6b7280", fontFamily: "monospace" }} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: "rgba(15,15,30,0.95)", border: "1px solid rgba(167,139,250,0.2)", borderRadius: 8, fontSize: 11, fontFamily: "monospace" }}
                    formatter={(v: number, name: string) => [`${v.toFixed(1)}%`, name === "fidelity" ? "Fidelity" : "Coherence"]}
                  />
                  <Area type="monotone" dataKey="fidelity" stroke="#a78bfa" strokeWidth={2} fill="url(#fidGrad)" dot={false} />
                  <Area type="monotone" dataKey="coherence" stroke="#34d399" strokeWidth={1.5} fill="url(#cohGrad)" dot={false} strokeDasharray="4 2" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Error correction explainer */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Physical qubits", value: correction ? "1,000" : "1", color: "#60a5fa" },
              { label: "Logical qubits", value: correction ? "1" : "1", color: "#a78bfa" },
              { label: "Gate fidelity", value: correction ? ">99.9%" : `${(100 - errorRate).toFixed(0)}%`, color: correction ? "#34d399" : thresholdColor },
            ].map(({ label, value, color }) => (
              <div key={label} className="p-2 rounded-lg text-center" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="text-sm font-bold font-mono" style={{ color }}>{value}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
