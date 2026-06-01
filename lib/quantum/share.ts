import type { CircuitState, CircuitGate } from "./circuit"

/** Compact wire format — keeps URLs short */
interface CompactCircuit {
  n: number
  g: [string, number, number, number?, number?, number?][]
  // [gateId, qubit, column, targetQubit?, param?]
}

export function encodeCircuit(circuit: CircuitState): string {
  const compact: CompactCircuit = {
    n: circuit.numQubits,
    g: circuit.gates.map((gate) => {
      const row: [string, number, number, number?, number?, number?] = [
        gate.gateId,
        gate.qubit,
        gate.column,
      ]
      if (gate.targetQubit !== undefined) row[3] = gate.targetQubit
      if (gate.param !== undefined) row[4] = gate.param
      return row
    }),
  }
  return btoa(JSON.stringify(compact))
}

export function decodeCircuit(encoded: string): CircuitState | null {
  try {
    const compact: CompactCircuit = JSON.parse(atob(encoded))
    if (typeof compact.n !== "number" || !Array.isArray(compact.g)) return null

    const gates: CircuitGate[] = compact.g.map((row, i) => ({
      id: `shared-${i}`,
      gateId: row[0] as CircuitGate["gateId"],
      qubit: row[1],
      column: row[2],
      targetQubit: row[3],
      param: row[4],
    }))

    return { numQubits: compact.n, gates }
  } catch {
    return null
  }
}

/** Download an SVG element as a PNG via Canvas */
export async function exportSvgAsPng(
  svgEl: SVGSVGElement,
  filename = "quantum-state.png",
): Promise<void> {
  const serializer = new XMLSerializer()
  const svgStr = serializer.serializeToString(svgEl)
  const svgBlob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" })
  const url = URL.createObjectURL(svgBlob)

  const img = new Image()
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = reject
    img.src = url
  })

  const canvas = document.createElement("canvas")
  const scale = 2 // retina
  canvas.width = svgEl.clientWidth * scale
  canvas.height = svgEl.clientHeight * scale

  const ctx = canvas.getContext("2d")!
  ctx.scale(scale, scale)
  ctx.fillStyle = "#0d1117"
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(img, 0, 0)

  URL.revokeObjectURL(url)

  const link = document.createElement("a")
  link.download = filename
  link.href = canvas.toDataURL("image/png")
  link.click()
}
