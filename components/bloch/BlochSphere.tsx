"use client"

import { useState, useEffect, useRef, type Ref } from "react"
import { BlochSphere3D } from "./BlochSphere3D"
import { BlochSphereSVG } from "./BlochSphereSVG"
import type { StateVector } from "@/lib/quantum/state-vector"

interface Props {
  stateVector: StateVector
  size?: number
  svgRef?: Ref<SVGSVGElement>
}

function detectWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas")
    return !!(canvas.getContext("webgl2") || canvas.getContext("webgl"))
  } catch {
    return false
  }
}

/** Renders the 3D Bloch sphere when WebGL is available, otherwise falls back to SVG. */
export function BlochSphere({ stateVector, size = 200, svgRef }: Props) {
  const [webgl, setWebgl] = useState<boolean | null>(null)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [showOverlay, setShowOverlay] = useState(true)

  useEffect(() => {
    setWebgl(detectWebGL())
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    setReducedMotion(mq.matches)
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])

  // While detecting (SSR / first paint) render nothing to avoid flash
  if (webgl === null) return null

  // Fallback: no WebGL or user prefers reduced motion
  if (!webgl || reducedMotion) {
    return <BlochSphereSVG stateVector={stateVector} size={size} svgRef={svgRef} />
  }

  return (
    <BlochSphere3D
      stateVector={stateVector}
      size={Math.max(size, 280)}
      showOverlay={showOverlay}
      onToggleOverlay={() => setShowOverlay((v) => !v)}
    />
  )
}
