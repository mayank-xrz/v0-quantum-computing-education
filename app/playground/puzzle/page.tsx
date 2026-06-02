"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { DailyPuzzle } from "@/components/puzzle/DailyPuzzle"
import { decodeCircuit, encodeCircuit } from "@/lib/quantum/share"
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

export default function PuzzlePage() {
  const [circuit] = useState<CircuitState>(initialCircuit)
  const router = useRouter()

  const handleSetup = (numQubits: number) => {
    const blank: CircuitState = { numQubits, gates: [] }
    router.push(`/playground#${encodeCircuit(blank)}`)
  }

  return (
    <div className="flex flex-col w-full min-h-0 overflow-hidden">
      <DailyPuzzle circuit={circuit} onSetup={handleSetup} />
    </div>
  )
}
