"use client"

import { useMemo, type Ref } from "react"
import type { StateVector } from "@/lib/quantum/state-vector"

interface Props {
  stateVector: StateVector
  size?: number
  svgRef?: Ref<SVGSVGElement>
}

/** Mathematically correct Bloch sphere driven by the live state vector. */
export function BlochSphereSVG({ stateVector, size = 200, svgRef }: Props) {
  const bloch = stateVector.blochVector()

  const { arrowX, arrowY, arrowTip, theta, phi } = useMemo(() => {
    if (!bloch) return { arrowX: 0, arrowY: 0, arrowTip: { x: 0, y: 0 }, theta: 0, phi: 0 }

    const { x, y, z } = bloch
    // Project onto SVG: x→right, z→up (y is depth, ignored in 2D)
    // Flatten y slightly so depth gives a hint via x offset
    const projX = x * 0.7 + y * 0.3
    const projY = -z

    const cx = size / 2
    const cy = size / 2
    const r = size * 0.38

    const theta = Math.acos(Math.max(-1, Math.min(1, z)))
    const phi = Math.atan2(y, x)

    return {
      arrowX: projX,
      arrowY: projY,
      arrowTip: { x: cx + projX * r, y: cy + projY * r },
      theta,
      phi,
    }
  }, [bloch, size])

  if (!bloch) return null

  const cx = size / 2
  const cy = size / 2
  const r = size * 0.38

  // Axis endpoints
  const axes = [
    { label: "|0⟩", x: cx, y: cy - r - 14 },
    { label: "|1⟩", x: cx, y: cy + r + 14 },
    { label: "+X", x: cx + r + 14, y: cy + 4 },
    { label: "+Y", x: cx + r * 0.5 + 14, y: cy - r * 0.5 - 6 },
  ]

  return (
    <div className="flex flex-col items-center gap-2">
      <svg
        ref={svgRef}
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="drop-shadow-lg"
        data-bloch-sphere
        aria-label="Bloch sphere visualization of qubit state"
      >
        {/* Outer glow */}
        <defs>
          <radialGradient id="sphereGrad" cx="40%" cy="35%">
            <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#0c4a6e" stopOpacity="0.8" />
          </radialGradient>
          <radialGradient id="glowGrad" cx="50%" cy="50%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
          </radialGradient>
          <marker
            id="arrowHead"
            markerWidth="8"
            markerHeight="8"
            refX="4"
            refY="4"
            orient="auto"
          >
            <path d="M0,0 L8,4 L0,8 Z" fill="#38bdf8" />
          </marker>
        </defs>

        {/* Glow circle behind sphere */}
        <circle cx={cx} cy={cy} r={r + 8} fill="url(#glowGrad)" />

        {/* Sphere body */}
        <circle cx={cx} cy={cy} r={r} fill="url(#sphereGrad)" stroke="#38bdf8" strokeWidth="1.5" strokeOpacity="0.6" />

        {/* Equator ellipse */}
        <ellipse cx={cx} cy={cy} rx={r} ry={r * 0.28} fill="none" stroke="#38bdf8" strokeWidth="0.8" strokeOpacity="0.4" strokeDasharray="4 3" />

        {/* Vertical great circle (meridian) */}
        <ellipse cx={cx} cy={cy} rx={r * 0.28} ry={r} fill="none" stroke="#38bdf8" strokeWidth="0.8" strokeOpacity="0.3" strokeDasharray="4 3" />

        {/* Axes */}
        <line x1={cx} y1={cy - r} x2={cx} y2={cy + r} stroke="#94a3b8" strokeWidth="0.8" strokeOpacity="0.5" />
        <line x1={cx - r} y1={cy} x2={cx + r} y2={cy} stroke="#94a3b8" strokeWidth="0.8" strokeOpacity="0.5" />
        <line x1={cx} y1={cy} x2={cx + r * 0.5} y2={cy - r * 0.5} stroke="#94a3b8" strokeWidth="0.8" strokeOpacity="0.5" strokeDasharray="3 2" />

        {/* State vector arrow */}
        <line
          x1={cx}
          y1={cy}
          x2={arrowTip.x}
          y2={arrowTip.y}
          stroke="#38bdf8"
          strokeWidth="2.5"
          strokeLinecap="round"
          markerEnd="url(#arrowHead)"
          style={{ transition: "x2 0.4s ease, y2 0.4s ease" }}
        />

        {/* Center dot */}
        <circle cx={cx} cy={cy} r={3} fill="#38bdf8" />

        {/* Labels */}
        <text x={axes[0].x} y={axes[0].y} textAnchor="middle" fill="#7dd3fc" fontSize={size * 0.07} fontFamily="monospace">|0⟩</text>
        <text x={axes[1].x} y={axes[1].y} textAnchor="middle" fill="#34d399" fontSize={size * 0.07} fontFamily="monospace">|1⟩</text>
        <text x={axes[2].x} y={axes[2].y} textAnchor="middle" fill="#94a3b8" fontSize={size * 0.055}>+x</text>
        <text x={axes[3].x} y={axes[3].y} textAnchor="middle" fill="#94a3b8" fontSize={size * 0.055}>+y</text>
      </svg>

      {/* Angles display */}
      <div className="text-xs font-mono text-muted-foreground grid grid-cols-2 gap-x-4 gap-y-0.5">
        <span className="text-right text-slate-400">θ =</span>
        <span className="text-cyan-400">{((theta * 180) / Math.PI).toFixed(1)}°</span>
        <span className="text-right text-slate-400">φ =</span>
        <span className="text-cyan-400">{((phi * 180) / Math.PI).toFixed(1)}°</span>
        <span className="text-right text-slate-400">z =</span>
        <span className="text-cyan-400">{bloch.z.toFixed(3)}</span>
      </div>
    </div>
  )
}
