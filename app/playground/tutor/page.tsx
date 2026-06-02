"use client"

import { useState } from "react"
import { QuantumTutor } from "@/components/tutor/QuantumTutor"
import { decodeCircuit } from "@/lib/quantum/share"
import type { CircuitState } from "@/lib/quantum/circuit"

const INITIAL: CircuitState = { numQubits: 1, gates: [] }

function initialCircuit(): CircuitState {
  if (typeof window === "undefined") return INITIAL
  const hash = window.location.hash.slice(1)
  if (hash) {
    const decoded = decodeCircuit(hash)
    if (decoded) return decoded
  }
  return INITIAL
}

export default function TutorPage() {
  // Decode circuit synchronously on first render so quick-action buttons
  // always send the correct circuit even if clicked immediately.
  const [circuit] = useState<CircuitState>(initialCircuit)

  return (
    <div className="flex flex-col w-full min-h-0 overflow-hidden">
      <QuantumTutor circuit={circuit} />
    </div>
  )
}
