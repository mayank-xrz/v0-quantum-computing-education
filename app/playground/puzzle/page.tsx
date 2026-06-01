"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DailyPuzzle } from "@/components/puzzle/DailyPuzzle"
import { decodeCircuit, encodeCircuit } from "@/lib/quantum/share"
import type { CircuitState } from "@/lib/quantum/circuit"

const INITIAL: CircuitState = { numQubits: 1, gates: [] }

export default function PuzzlePage() {
  const [circuit, setCircuit] = useState<CircuitState>(INITIAL)
  const router = useRouter()

  useEffect(() => {
    const hash = window.location.hash.slice(1)
    if (hash) {
      const decoded = decodeCircuit(hash)
      if (decoded) setCircuit(decoded)
    }
  }, [])

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
