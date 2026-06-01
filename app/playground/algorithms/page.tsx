"use client"

import { useRouter } from "next/navigation"
import { AlgorithmVisualizer } from "@/components/algorithm/AlgorithmVisualizer"
import { TeleportVisualizer } from "@/components/algorithm/TeleportVisualizer"
import { encodeCircuit } from "@/lib/quantum/share"
import type { CircuitState } from "@/lib/quantum/circuit"

export default function AlgorithmsPage() {
  const router = useRouter()

  const handleLoadCircuit = (c: CircuitState) => {
    // Encode circuit into hash and navigate to builder
    router.push(`/playground#${encodeCircuit(c)}`)
  }

  return (
    <div className="flex flex-col w-full min-h-0 overflow-y-auto">
      <div className="border-b border-slate-800">
        <AlgorithmVisualizer onLoadCircuit={handleLoadCircuit} />
      </div>
      <TeleportVisualizer onLoadCircuit={handleLoadCircuit} />
    </div>
  )
}
