import { StateVector } from "./state-vector"
import {
  GATE_MATRICES,
  CNOT,
  CZ,
  SWAP,
  Rx,
  Ry,
  Rz,
  applySingleQubitGate,
  applyTwoQubitGate,
  type GateId,
} from "./gates"

export interface CircuitGate {
  id: string
  gateId: GateId
  /** Which qubit this gate is on (single-qubit gates) */
  qubit: number
  /** For two-qubit gates, the second qubit */
  targetQubit?: number
  /** Column/step in the circuit */
  column: number
  /** Optional rotation angle for Rx/Ry/Rz */
  param?: number
}

export interface CircuitState {
  numQubits: number
  gates: CircuitGate[]
}

export interface SimulationResult {
  stateVector: StateVector
  /** Snapshot after each column of gates */
  steps: { column: number; stateVector: StateVector }[]
  probabilities: number[]
}

/** Execute the circuit gate-by-gate, returning intermediate states. */
export function simulateCircuit(circuit: CircuitState): SimulationResult {
  let state = StateVector.zero(circuit.numQubits)
  const steps: SimulationResult["steps"] = []

  // Group gates by column, execute left to right
  const columns = groupByColumn(circuit.gates)
  const sortedCols = Object.keys(columns)
    .map(Number)
    .sort((a, b) => a - b)

  for (const col of sortedCols) {
    for (const gate of columns[col]) {
      state = applyGate(state, gate)
    }
    steps.push({ column: col, stateVector: state })
  }

  return {
    stateVector: state,
    steps,
    probabilities: state.probabilities(),
  }
}

function groupByColumn(
  gates: CircuitGate[],
): Record<number, CircuitGate[]> {
  const result: Record<number, CircuitGate[]> = {}
  for (const gate of gates) {
    if (!result[gate.column]) result[gate.column] = []
    result[gate.column].push(gate)
  }
  return result
}

function applyGate(state: StateVector, gate: CircuitGate): StateVector {
  const { gateId, qubit, targetQubit, param = 0 } = gate

  // Two-qubit gates
  if (gateId === "CNOT" && targetQubit !== undefined) {
    return applyTwoQubitGate(state, CNOT, qubit, targetQubit)
  }
  if (gateId === "CZ" && targetQubit !== undefined) {
    return applyTwoQubitGate(state, CZ, qubit, targetQubit)
  }
  if (gateId === "SWAP" && targetQubit !== undefined) {
    return applyTwoQubitGate(state, SWAP, qubit, targetQubit)
  }

  // Parameterised rotations
  if (gateId === "Rx") return applySingleQubitGate(state, Rx(param), qubit)
  if (gateId === "Ry") return applySingleQubitGate(state, Ry(param), qubit)
  if (gateId === "Rz") return applySingleQubitGate(state, Rz(param), qubit)

  // Fixed single-qubit gates
  const matrix = GATE_MATRICES[gateId]
  if (!matrix) throw new Error(`Unknown gate: ${gateId}`)
  return applySingleQubitGate(state, matrix, qubit)
}

/** Describe the circuit in a compact, human-readable string for the AI prompt. */
export function circuitToPromptString(circuit: CircuitState): string {
  const lines: string[] = [`${circuit.numQubits}-qubit circuit:`]
  if (circuit.gates.length === 0) {
    lines.push("  (empty — all qubits in |0⟩)")
    return lines.join("\n")
  }
  const sorted = [...circuit.gates].sort((a, b) => a.column - b.column)
  for (const g of sorted) {
    const param = g.param !== undefined ? `(θ=${g.param.toFixed(3)})` : ""
    const target =
      g.targetQubit !== undefined ? `, target=q${g.targetQubit}` : ""
    lines.push(
      `  col ${g.column}: ${g.gateId}${param} on q${g.qubit}${target}`,
    )
  }
  return lines.join("\n")
}

/** Matrix LaTeX string for display */
export function gateMatrixLatex(gateId: string, param?: number): string {
  const matrices: Record<string, string> = {
    H: "\\frac{1}{\\sqrt{2}}\\begin{pmatrix}1&1\\\\1&-1\\end{pmatrix}",
    X: "\\begin{pmatrix}0&1\\\\1&0\\end{pmatrix}",
    Y: "\\begin{pmatrix}0&-i\\\\i&0\\end{pmatrix}",
    Z: "\\begin{pmatrix}1&0\\\\0&-1\\end{pmatrix}",
    S: "\\begin{pmatrix}1&0\\\\0&i\\end{pmatrix}",
    T: "\\begin{pmatrix}1&0\\\\0&e^{i\\pi/4}\\end{pmatrix}",
    CNOT:
      "\\begin{pmatrix}1&0&0&0\\\\0&1&0&0\\\\0&0&0&1\\\\0&0&1&0\\end{pmatrix}",
  }
  if (gateId === "Rx" && param !== undefined) {
    return `\\begin{pmatrix}\\cos\\frac{\\theta}{2}&-i\\sin\\frac{\\theta}{2}\\\\-i\\sin\\frac{\\theta}{2}&\\cos\\frac{\\theta}{2}\\end{pmatrix},\\ \\theta=${param.toFixed(3)}`
  }
  return matrices[gateId] ?? ""
}
