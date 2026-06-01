export type Complex = { re: number; im: number }
export type StateVector = Complex[]
export type GateName = "H" | "X" | "Y" | "Z" | "S" | "T" | "CNOT"

export interface CircuitGate {
  id: string
  gate: GateName
  qubit: number
  col: number
}

const c = (re: number, im = 0): Complex => ({ re, im })
const add = (a: Complex, b: Complex): Complex => ({ re: a.re + b.re, im: a.im + b.im })
const mul = (a: Complex, b: Complex): Complex => ({
  re: a.re * b.re - a.im * b.im,
  im: a.re * b.im + a.im * b.re,
})
export const abs2 = (a: Complex): number => a.re * a.re + a.im * a.im

const INV_SQRT2 = 1 / Math.sqrt(2)
type Matrix2 = [[Complex, Complex], [Complex, Complex]]

const GATE_MATRICES: Record<Exclude<GateName, "CNOT">, Matrix2> = {
  H: [[c(INV_SQRT2), c(INV_SQRT2)], [c(INV_SQRT2), c(-INV_SQRT2)]],
  X: [[c(0), c(1)], [c(1), c(0)]],
  Y: [[c(0), c(0, -1)], [c(0, 1), c(0)]],
  Z: [[c(1), c(0)], [c(0), c(-1)]],
  S: [[c(1), c(0)], [c(0), c(0, 1)]],
  T: [[c(1), c(0)], [c(0), c(Math.cos(Math.PI / 4), Math.sin(Math.PI / 4))]],
}

export const GATE_INFO: Record<GateName, { label: string; color: string; bg: string; description: string }> = {
  H: { label: "H", color: "#a78bfa", bg: "rgba(167,139,250,0.15)", description: "Hadamard — creates superposition" },
  X: { label: "X", color: "#f87171", bg: "rgba(248,113,113,0.15)", description: "Pauli-X — quantum NOT gate" },
  Y: { label: "Y", color: "#34d399", bg: "rgba(52,211,153,0.15)", description: "Pauli-Y — Y-axis rotation" },
  Z: { label: "Z", color: "#60a5fa", bg: "rgba(96,165,250,0.15)", description: "Pauli-Z — phase flip" },
  S: { label: "S", color: "#fbbf24", bg: "rgba(251,191,36,0.15)", description: "Phase gate — |1⟩ → i|1⟩" },
  T: { label: "T", color: "#f472b6", bg: "rgba(244,114,182,0.15)", description: "T gate — |1⟩ → e^(iπ/4)|1⟩" },
  CNOT: { label: "⊕", color: "#c084fc", bg: "rgba(192,132,252,0.15)", description: "CNOT — entangles two qubits" },
}

export function initialState(n: number): StateVector {
  const state: StateVector = Array.from({ length: 1 << n }, () => c(0))
  state[0] = c(1)
  return state
}

function applyGate1(state: StateVector, gate: Matrix2, target: number, n: number): StateVector {
  const size = 1 << n
  const result = state.map(x => ({ ...x }))
  const stride = 1 << (n - 1 - target)
  for (let i = 0; i < size; i++) {
    if (i & stride) continue
    const j = i | stride
    result[i] = add(mul(gate[0][0], state[i]), mul(gate[0][1], state[j]))
    result[j] = add(mul(gate[1][0], state[i]), mul(gate[1][1], state[j]))
  }
  return result
}

function applyCNOT(state: StateVector, control: number, target: number, n: number): StateVector {
  const size = 1 << n
  const result = state.map(x => ({ ...x }))
  const cStride = 1 << (n - 1 - control)
  const tStride = 1 << (n - 1 - target)
  for (let i = 0; i < size; i++) {
    if (!(i & cStride) || i & tStride) continue
    const j = i | tStride
    result[i] = { ...state[j] }
    result[j] = { ...state[i] }
  }
  return result
}

export function simulateCircuit(gates: CircuitGate[], numQubits = 2): StateVector {
  let state = initialState(numQubits)
  const sorted = [...gates].sort((a, b) => a.col - b.col)
  for (const g of sorted) {
    if (g.gate === "CNOT") {
      const ctrl = g.qubit === 0 ? 1 : 0
      state = applyCNOT(state, ctrl, g.qubit, numQubits)
    } else {
      state = applyGate1(state, GATE_MATRICES[g.gate], g.qubit, numQubits)
    }
  }
  return state
}

export function getProbabilities(state: StateVector): number[] {
  return state.map(abs2)
}

export function basisLabel(index: number, n: number): string {
  return `|${index.toString(2).padStart(n, "0")}⟩`
}

// Reduced single-qubit Bloch vector for qubit 0 (tracing out qubit 1)
export function getBlochVector(state: StateVector): { x: number; y: number; z: number } {
  if (state.length === 2) {
    const [a, b] = state
    return {
      x: 2 * (a.re * b.re + a.im * b.im),
      y: 2 * (a.im * b.re - a.re * b.im),
      z: abs2(a) - abs2(b),
    }
  }
  // 2-qubit: partial trace over qubit 1
  const [a00, a01, a10, a11] = state
  const r00 = abs2(a00) + abs2(a01)
  const r11 = abs2(a10) + abs2(a11)
  const rx = 2 * ((a00.re * a10.re + a00.im * a10.im) + (a01.re * a11.re + a01.im * a11.im))
  const ry = 2 * ((a00.im * a10.re - a00.re * a10.im) + (a01.im * a11.re - a01.re * a11.im))
  return { x: rx, y: ry, z: r00 - r11 }
}

export const PRESETS: Record<string, { label: string; description: string; gates: Omit<CircuitGate, "id">[] }> = {
  superposition: {
    label: "Superposition",
    description: "H on q₀ creates equal |0⟩+|1⟩ superposition",
    gates: [{ gate: "H", qubit: 0, col: 0 }],
  },
  bell: {
    label: "Bell State",
    description: "H + CNOT creates maximally entangled state (|00⟩+|11⟩)/√2",
    gates: [{ gate: "H", qubit: 0, col: 0 }, { gate: "CNOT", qubit: 1, col: 1 }],
  },
  phaseKickback: {
    label: "Phase Kickback",
    description: "Demonstrates how phase propagates backwards through a CNOT",
    gates: [
      { gate: "H", qubit: 0, col: 0 },
      { gate: "X", qubit: 1, col: 0 },
      { gate: "H", qubit: 1, col: 1 },
      { gate: "CNOT", qubit: 1, col: 2 },
    ],
  },
  ghz: {
    label: "T Gate",
    description: "H + S + T: universal gate combination showing phase stack",
    gates: [
      { gate: "H", qubit: 0, col: 0 },
      { gate: "S", qubit: 0, col: 1 },
      { gate: "T", qubit: 0, col: 2 },
      { gate: "H", qubit: 1, col: 0 },
    ],
  },
}
