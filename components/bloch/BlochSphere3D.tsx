"use client"

import { useRef, useEffect, useMemo } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { OrbitControls, Line, Html } from "@react-three/drei"
import * as THREE from "three"
import type { StateVector } from "@/lib/quantum/state-vector"

// Bloch → Three.js coordinate mapping:
// Bloch is Z-up (|0⟩ at +Z, |1⟩ at -Z).
// Three.js is Y-up. To make |0⟩ appear at the visual top:
//   three(x, y, z) = (bloch.x, bloch.z, bloch.y)
function blochToThree(b: { x: number; y: number; z: number }): THREE.Vector3 {
  return new THREE.Vector3(b.x, b.z, b.y)
}

// ── Sphere + great circles ──────────────────────────────────────────────────

function SphereShell() {
  return (
    <>
      {/* Translucent sphere */}
      <mesh>
        <sphereGeometry args={[1, 48, 48]} />
        <meshStandardMaterial
          color="#0ea5e9"
          transparent
          opacity={0.08}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Wireframe overlay */}
      <mesh>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial
          color="#38bdf8"
          wireframe
          transparent
          opacity={0.12}
        />
      </mesh>
    </>
  )
}

// Generates points for a great circle in a given plane
function greatCirclePoints(normalAxis: "x" | "y" | "z", count = 80): THREE.Vector3[] {
  const pts: THREE.Vector3[] = []
  for (let i = 0; i <= count; i++) {
    const t = (i / count) * Math.PI * 2
    const a = Math.cos(t)
    const b = Math.sin(t)
    if (normalAxis === "x") pts.push(new THREE.Vector3(0, a, b))
    else if (normalAxis === "y") pts.push(new THREE.Vector3(a, 0, b))
    else pts.push(new THREE.Vector3(a, b, 0))
  }
  return pts
}

function GreatCircles() {
  return (
    <>
      <Line points={greatCirclePoints("x")} color="#38bdf8" lineWidth={0.5} transparent opacity={0.3} />
      <Line points={greatCirclePoints("y")} color="#38bdf8" lineWidth={0.5} transparent opacity={0.3} />
      <Line points={greatCirclePoints("z")} color="#38bdf8" lineWidth={0.5} transparent opacity={0.2} dashed dashSize={0.1} gapSize={0.05} />
    </>
  )
}

// ── Axes + pole labels ───────────────────────────────────────────────────────

function Axes() {
  const R = 1.25 // extend slightly past sphere surface
  return (
    <>
      {/* Z-axis (|0⟩/|1⟩) — maps to Three.js Y */}
      <Line points={[new THREE.Vector3(0, -R, 0), new THREE.Vector3(0, R, 0)]} color="#94a3b8" lineWidth={0.8} transparent opacity={0.5} />
      {/* X-axis — same in both spaces */}
      <Line points={[new THREE.Vector3(-R, 0, 0), new THREE.Vector3(R, 0, 0)]} color="#94a3b8" lineWidth={0.8} transparent opacity={0.5} />
      {/* Y-axis (Bloch) — maps to Three.js Z */}
      <Line points={[new THREE.Vector3(0, 0, -R), new THREE.Vector3(0, 0, R)]} color="#94a3b8" lineWidth={0.8} transparent opacity={0.5} />

      {/* Pole labels */}
      <Html position={[0, R + 0.12, 0]} center style={{ pointerEvents: "none" }}>
        <span style={{ color: "#7dd3fc", fontFamily: "monospace", fontSize: 11, whiteSpace: "nowrap" }}>|0⟩</span>
      </Html>
      <Html position={[0, -(R + 0.12), 0]} center style={{ pointerEvents: "none" }}>
        <span style={{ color: "#34d399", fontFamily: "monospace", fontSize: 11, whiteSpace: "nowrap" }}>|1⟩</span>
      </Html>
      <Html position={[R + 0.12, 0, 0]} center style={{ pointerEvents: "none" }}>
        <span style={{ color: "#94a3b8", fontFamily: "monospace", fontSize: 10 }}>+X</span>
      </Html>
      <Html position={[0, 0, R + 0.12]} center style={{ pointerEvents: "none" }}>
        <span style={{ color: "#94a3b8", fontFamily: "monospace", fontSize: 10 }}>+Y</span>
      </Html>
    </>
  )
}

// ── Animated state-vector arrow ──────────────────────────────────────────────

interface ArrowProps {
  target: THREE.Vector3
}

function StateArrow({ target }: ArrowProps) {
  const arrowRef = useRef<THREE.ArrowHelper | null>(null)
  const current = useRef(new THREE.Vector3(0, 1, 0)) // start at |0⟩

  useFrame((_, delta) => {
    if (!arrowRef.current) return
    // Smooth lerp toward target (60fps-independent)
    const lerpSpeed = 1 - Math.pow(0.01, delta)
    current.current.lerp(target, lerpSpeed)
    const len = current.current.length()
    if (len < 0.001) return
    const dir = current.current.clone().normalize()
    arrowRef.current.setDirection(dir)
    arrowRef.current.setLength(Math.min(len, 1), 0.18, 0.08)
  })

  // ArrowHelper needs to be created imperatively
  const arrow = useMemo(() => {
    const dir = target.clone().normalize()
    const helper = new THREE.ArrowHelper(dir, new THREE.Vector3(0, 0, 0), 1, 0x38bdf8, 0.18, 0.08)
    // Style the shaft and head
    ;(helper.line.material as THREE.LineBasicMaterial).linewidth = 2
    return helper
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // intentionally no deps — we animate via useFrame

  useEffect(() => {
    arrowRef.current = arrow
    return () => { arrow.dispose?.() }
  }, [arrow])

  return <primitive object={arrow} />
}

// ── Camera setup ─────────────────────────────────────────────────────────────

function CameraSetup() {
  const { camera } = useThree()
  useEffect(() => {
    camera.position.set(1.8, 1.4, 2.2)
    camera.lookAt(0, 0, 0)
  }, [camera])
  return null
}

// ── Invalidate on each orbit so frameloop="demand" redraws ──────────────────

function InvalidateOnOrbit() {
  const { invalidate } = useThree()
  return (
    <OrbitControls
      enableDamping
      dampingFactor={0.1}
      minDistance={1.5}
      maxDistance={5}
      onChange={invalidate}
    />
  )
}

// ── Educational overlay (DOM, not R3F) ───────────────────────────────────────

interface OverlayProps {
  stateVector: StateVector
  visible: boolean
}

function EducationalOverlay({ stateVector, visible }: OverlayProps) {
  if (!visible) return null
  const bloch = stateVector.blochVector()
  if (!bloch) return null

  const { x, y, z } = bloch
  const theta = Math.acos(Math.max(-1, Math.min(1, z)))
  const phi = Math.atan2(y, x)
  const [a, b] = stateVector.amplitudes
  const p0 = a.absSquared()
  const p1 = b.absSquared()

  return (
    <div className="absolute bottom-2 left-2 right-2 pointer-events-none">
      <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded-lg px-3 py-2 text-[10px] font-mono text-slate-300 grid grid-cols-2 gap-x-3 gap-y-0.5">
        <span className="text-slate-500">α</span>
        <span className="text-cyan-400">{a.re.toFixed(3)}{a.im >= 0 ? "+" : ""}{a.im.toFixed(3)}i</span>
        <span className="text-slate-500">β</span>
        <span className="text-cyan-400">{b.re.toFixed(3)}{b.im >= 0 ? "+" : ""}{b.im.toFixed(3)}i</span>
        <span className="text-slate-500">θ</span>
        <span className="text-emerald-400">{((theta * 180) / Math.PI).toFixed(1)}°</span>
        <span className="text-slate-500">φ</span>
        <span className="text-emerald-400">{((phi * 180) / Math.PI).toFixed(1)}°</span>
        <span className="text-slate-500">P(|0⟩)</span>
        <span className="text-violet-400">{(p0 * 100).toFixed(1)}%</span>
        <span className="text-slate-500">P(|1⟩)</span>
        <span className="text-violet-400">{(p1 * 100).toFixed(1)}%</span>
      </div>
    </div>
  )
}

// ── Main scene ───────────────────────────────────────────────────────────────

interface SceneProps {
  blochTarget: THREE.Vector3
}

function Scene({ blochTarget }: SceneProps) {
  return (
    <>
      <CameraSetup />
      <ambientLight intensity={0.6} />
      <pointLight position={[3, 3, 3]} intensity={0.8} />
      <SphereShell />
      <GreatCircles />
      <Axes />
      <StateArrow target={blochTarget} />
      <InvalidateOnOrbit />
    </>
  )
}

// ── Public component ─────────────────────────────────────────────────────────

export interface BlochSphere3DProps {
  stateVector: StateVector
  size?: number
  showOverlay?: boolean
  onToggleOverlay?: () => void
}

export function BlochSphere3D({ stateVector, size = 280, showOverlay = true, onToggleOverlay }: BlochSphere3DProps) {
  const bloch = stateVector.blochVector()
  const blochTarget = bloch ? blochToThree(bloch) : new THREE.Vector3(0, 1, 0)

  if (!bloch) return null

  return (
    <div
      className="relative flex flex-col items-center gap-2"
      style={{ width: size, height: size }}
    >
      <Canvas
        data-bloch-canvas
        frameloop="demand"
        dpr={[1, 2]}
        gl={{ antialias: true, preserveDrawingBuffer: true }}
        style={{ width: size, height: size, borderRadius: 12 }}
        aria-label="Interactive 3D Bloch sphere visualization of qubit state"
      >
        <Scene blochTarget={blochTarget} />
      </Canvas>

      {onToggleOverlay && (
        <button
          onClick={onToggleOverlay}
          className="absolute top-2 right-2 px-2 py-0.5 rounded text-[9px] bg-slate-800/70 border border-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
          style={{ pointerEvents: "auto" }}
        >
          {showOverlay ? "hide info" : "show info"}
        </button>
      )}

      <EducationalOverlay stateVector={stateVector} visible={showOverlay} />
    </div>
  )
}
