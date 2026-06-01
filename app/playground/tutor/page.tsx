"use client"

import { useState, useEffect } from "react"
import { QuantumTutor } from "@/components/tutor/QuantumTutor"
import { decodeCircuit } from "@/lib/quantum/share"
import type { CircuitState } from "@/lib/quantum/circuit"

const INITIAL: CircuitState = { numQubits: 1, gates: [] }

export default function TutorPage() {
  const [circuit, setCircuit] = useState<CircuitState>(INITIAL)

  useEffect(() => {
    const hash = window.location.hash.slice(1)
    if (hash) {
      const decoded = decodeCircuit(hash)
      if (decoded) setCircuit(decoded)
    }
  }, [])

  return (
    <div className="flex flex-col w-full min-h-0 overflow-hidden">
      <QuantumTutor circuit={circuit} />
    </div>
  )
}
