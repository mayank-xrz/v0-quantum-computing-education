"use client"

import { useMemo } from "react"

interface BlochSphereProps {
  x: number
  y: number
  z: number
  size?: number
}

// Isometric 3D → 2D projection with fixed camera angle
const cosA = Math.cos(Math.PI / 9)
const sinA = Math.sin(Math.PI / 9)
const cosE = Math.cos(Math.PI / 7)
const sinE = Math.sin(Math.PI / 7)

function project(px: number, py: number, pz: number, r: number, cx: number, cy: number): [number, number] {
  const rx = px * cosA - py * sinA
  const ry = px * sinA * sinE + py * cosA * sinE + pz * cosE
  return [cx + rx * r * 0.8, cy - ry * r * 0.8]
}

function pointsToPath(pts: [number, number][]): string {
  return pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(" ") + " Z"
}

export function BlochSphere({ x, y, z, size = 160 }: BlochSphereProps) {
  const r = size / 2
  const cx = r
  const cy = r
  const proj = (px: number, py: number, pz: number) => project(px, py, pz, r, cx, cy)

  const [vx, vy] = proj(x, y, z)
  const [ox, oy] = proj(0, 0, 0)
  const [ax1, ay1] = proj(1.25, 0, 0)
  const [axn, ayn] = proj(-1.25, 0, 0)
  const [ay1p, ay1py] = proj(0, 1.25, 0)
  const [ayn1p, ayn1py] = proj(0, -1.25, 0)
  const [az1x, az1y] = proj(0, 0, 1.25)
  const [azn1x, azn1y] = proj(0, 0, -1.25)

  const shadowPt = proj(x, y, 0)

  const equatorFront = useMemo(() =>
    Array.from({ length: 33 }, (_, i) => {
      const a = (i / 64) * Math.PI * 2
      return proj(Math.cos(a), Math.sin(a), 0)
    }), [r, cx, cy])

  const equatorBack = useMemo(() =>
    Array.from({ length: 33 }, (_, i) => {
      const a = ((i + 32) / 64) * Math.PI * 2
      return proj(Math.cos(a), Math.sin(a), 0)
    }), [r, cx, cy])

  const meridFront = useMemo(() =>
    Array.from({ length: 33 }, (_, i) => {
      const a = (i / 64) * Math.PI * 2
      return proj(Math.cos(a), 0, Math.sin(a))
    }), [r, cx, cy])

  const meridBack = useMemo(() =>
    Array.from({ length: 33 }, (_, i) => {
      const a = ((i + 32) / 64) * Math.PI * 2
      return proj(Math.cos(a), 0, Math.sin(a))
    }), [r, cx, cy])

  const isOrigin = Math.sqrt(x * x + y * y + z * z) < 0.01

  const stateLabel = useMemo(() => {
    if (isOrigin) return "mixed"
    if (z > 0.97) return "|0⟩"
    if (z < -0.97) return "|1⟩"
    if (x > 0.97 && Math.abs(y) < 0.1) return "|+⟩"
    if (x < -0.97 && Math.abs(y) < 0.1) return "|-⟩"
    return null
  }, [x, y, z, isOrigin])

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
        <defs>
          <radialGradient id="bloch-grad" cx="38%" cy="32%">
            <stop offset="0%" stopColor="rgba(167,139,250,0.18)" />
            <stop offset="100%" stopColor="rgba(96,165,250,0.05)" />
          </radialGradient>
          <filter id="bloch-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        <circle cx={cx} cy={cy} r={r * 0.8} fill="url(#bloch-grad)" stroke="rgba(167,139,250,0.2)" strokeWidth="0.5" />

        {/* Back hemisphere grid (dashed) */}
        <path d={pointsToPath(meridBack)} fill="none" stroke="rgba(167,139,250,0.12)" strokeWidth="0.8" strokeDasharray="3,3" />
        <path d={pointsToPath(equatorBack)} fill="none" stroke="rgba(96,165,250,0.12)" strokeWidth="0.8" strokeDasharray="3,3" />

        {/* Negative axes */}
        <line x1={ox} y1={oy} x2={axn} y2={ayn} stroke="rgba(248,113,113,0.2)" strokeWidth="0.8" strokeDasharray="3,2" />
        <line x1={ox} y1={oy} x2={ayn1p} y2={ayn1py} stroke="rgba(52,211,153,0.2)" strokeWidth="0.8" strokeDasharray="3,2" />
        <line x1={ox} y1={oy} x2={azn1x} y2={azn1y} stroke="rgba(167,139,250,0.2)" strokeWidth="0.8" strokeDasharray="3,2" />

        {/* Equatorial projection of state vector */}
        {!isOrigin && (
          <line x1={ox} y1={oy} x2={shadowPt[0]} y2={shadowPt[1]}
            stroke="rgba(167,139,250,0.18)" strokeWidth="1" strokeDasharray="4,3" />
        )}

        {/* Front hemisphere grid */}
        <path d={pointsToPath(meridFront)} fill="none" stroke="rgba(167,139,250,0.22)" strokeWidth="0.8" />
        <path d={pointsToPath(equatorFront)} fill="none" stroke="rgba(96,165,250,0.22)" strokeWidth="0.8" />

        {/* Positive axes */}
        <line x1={ox} y1={oy} x2={ax1} y2={ay1} stroke="rgba(248,113,113,0.55)" strokeWidth="1" />
        <line x1={ox} y1={oy} x2={ay1p} y2={ay1py} stroke="rgba(52,211,153,0.55)" strokeWidth="1" />
        <line x1={ox} y1={oy} x2={az1x} y2={az1y} stroke="rgba(167,139,250,0.8)" strokeWidth="1.2" />

        {/* Pole labels */}
        <text x={cx} y={az1y - 8} fontSize="8.5" fill="rgba(167,139,250,0.85)" fontFamily="monospace" textAnchor="middle">|0⟩</text>
        <text x={cx} y={azn1y + 14} fontSize="8.5" fill="rgba(167,139,250,0.55)" fontFamily="monospace" textAnchor="middle">|1⟩</text>

        {/* Axis tip labels */}
        <text x={ax1 + 3} y={ay1 + 3} fontSize="8" fill="rgba(248,113,113,0.7)" fontFamily="monospace">x</text>
        <text x={ay1p + 3} y={ay1py + 3} fontSize="8" fill="rgba(52,211,153,0.7)" fontFamily="monospace">y</text>

        {/* State vector */}
        {!isOrigin && (
          <>
            <line x1={ox} y1={oy} x2={vx} y2={vy}
              stroke="#a78bfa" strokeWidth="2.2" strokeLinecap="round" filter="url(#bloch-glow)" />
            <circle cx={vx} cy={vy} r={4.5} fill="#a78bfa" filter="url(#bloch-glow)" />
          </>
        )}

        <circle cx={ox} cy={oy} r={2} fill="rgba(255,255,255,0.45)" />
      </svg>

      <p className="text-[10px] font-mono text-center">
        {stateLabel
          ? <span className="text-violet-400">{stateLabel}</span>
          : <span className="text-muted-foreground">({x.toFixed(2)}, {y.toFixed(2)}, {z.toFixed(2)})</span>
        }
      </p>
    </div>
  )
}
