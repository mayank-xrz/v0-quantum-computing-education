import { Complex, c } from "./complex"
import { StateVector } from "./state-vector"

/** A 2x2 or 4x4 unitary matrix, stored row-major. */
export type Matrix = Complex[][]

const INV_SQRT2 = 1 / Math.sqrt(2)

// ── Single-qubit gates ─────────────────────────────────────────────────────

export const GATE_MATRICES: Record<string, Matrix> = {
  H: [
    [c(INV_SQRT2), c(INV_SQRT2)],
    [c(INV_SQRT2), c(-INV_SQRT2)],
  ],
  X: [
    [c(0), c(1)],
    [c(1), c(0)],
  ],
  Y: [
    [c(0), c(0, -1)],
    [c(0, 1), c(0)],
  ],
  Z: [
    [c(1), c(0)],
    [c(0), c(-1)],
  ],
  S: [
    [c(1), c(0)],
    [c(0), c(0, 1)],
  ],
  T: [
    [c(1), c(0)],
    [c(0), Complex.polar(1, Math.PI / 4)],
  ],
  I: [
    [c(1), c(0)],
    [c(0), c(1)],
  ],
}

/** Rotation gates — parameterised */
export function Rx(theta: number): Matrix {
  const cos = Math.cos(theta / 2)
  const sin = Math.sin(theta / 2)
  return [
    [c(cos), c(0, -sin)],
    [c(0, -sin), c(cos)],
  ]
}

export function Ry(theta: number): Matrix {
  const cos = Math.cos(theta / 2)
  const sin = Math.sin(theta / 2)
  return [
    [c(cos), c(-sin)],
    [c(sin), c(cos)],
  ]
}

export function Rz(theta: number): Matrix {
  return [
    [Complex.polar(1, -theta / 2), c(0)],
    [c(0), Complex.polar(1, theta / 2)],
  ]
}

/** Phase gate P(φ) = diag(1, e^{iφ}) */
export function Phase(phi: number): Matrix {
  return [
    [c(1), c(0)],
    [c(0), Complex.polar(1, phi)],
  ]
}

// ── Two-qubit gates (4×4 matrices) ────────────────────────────────────────

export const CNOT: Matrix = [
  [c(1), c(0), c(0), c(0)],
  [c(0), c(1), c(0), c(0)],
  [c(0), c(0), c(0), c(1)],
  [c(0), c(0), c(1), c(0)],
]

export const CZ: Matrix = [
  [c(1), c(0), c(0), c(0)],
  [c(0), c(1), c(0), c(0)],
  [c(0), c(0), c(1), c(0)],
  [c(0), c(0), c(0), c(-1)],
]

export const SWAP: Matrix = [
  [c(1), c(0), c(0), c(0)],
  [c(0), c(0), c(1), c(0)],
  [c(0), c(1), c(0), c(0)],
  [c(0), c(0), c(0), c(1)],
]

// ── Gate application ──────────────────────────────────────────────────────

/**
 * Apply a single-qubit gate (2×2 matrix U) to `targetQubit` of a state vector.
 * Uses the standard tensor-product embedding trick.
 */
export function applySingleQubitGate(
  state: StateVector,
  U: Matrix,
  targetQubit: number,
): StateVector {
  const n = state.numQubits
  const dim = state.dim
  const newAmps = state.amplitudes.map(() => c(0))

  for (let i = 0; i < dim; i++) {
    // Extract bit at targetQubit position (0 = LSB = qubit 0)
    const bit = (i >> (n - 1 - targetQubit)) & 1
    const partner = i ^ (1 << (n - 1 - targetQubit))

    if (bit === 0) {
      // |0⟩ row: U[0][0]|i⟩ + U[0][1]|partner⟩
      newAmps[i] = newAmps[i]
        .add(U[0][0].mul(state.amplitudes[i]))
        .add(U[0][1].mul(state.amplitudes[partner]))
    } else {
      // |1⟩ row
      newAmps[i] = newAmps[i]
        .add(U[1][0].mul(state.amplitudes[partner]))
        .add(U[1][1].mul(state.amplitudes[i]))
    }
  }

  return new StateVector(newAmps)
}

/**
 * Apply a two-qubit gate (4×4 matrix) to (controlQubit, targetQubit).
 * The gate acts on the 2-qubit subspace {control, target} in big-endian order.
 */
export function applyTwoQubitGate(
  state: StateVector,
  U: Matrix,
  qubit0: number,
  qubit1: number,
): StateVector {
  const n = state.numQubits
  const dim = state.dim
  const newAmps = Array.from({ length: dim }, () => c(0))

  for (let i = 0; i < dim; i++) {
    const b0 = (i >> (n - 1 - qubit0)) & 1
    const b1 = (i >> (n - 1 - qubit1)) & 1
    const rowIdx = (b0 << 1) | b1

    // Enumerate all 4 basis pairs and accumulate into newAmps[i]
    for (let colIdx = 0; colIdx < 4; colIdx++) {
      const c0 = (colIdx >> 1) & 1
      const c1 = colIdx & 1
      // Build the source index j by flipping qubit0 and qubit1
      let j = i
      if (c0 !== b0) j ^= 1 << (n - 1 - qubit0)
      if (c1 !== b1) j ^= 1 << (n - 1 - qubit1)
      newAmps[i] = newAmps[i].add(U[rowIdx][colIdx].mul(state.amplitudes[j]))
    }
  }

  return new StateVector(newAmps)
}

// ── Gate metadata (for the UI palette) ────────────────────────────────────

export type GateId =
  | "H"
  | "X"
  | "Y"
  | "Z"
  | "S"
  | "T"
  | "I"
  | "CNOT"
  | "CZ"
  | "SWAP"
  | "Rx"
  | "Ry"
  | "Rz"

export interface GateDef {
  id: GateId
  label: string
  description: string
  color: string
  qubits: 1 | 2
  paramName?: string
}

export const GATE_DEFS: GateDef[] = [
  {
    id: "H",
    label: "H",
    description: "Hadamard — creates superposition",
    color: "bg-cyan-500",
    qubits: 1,
  },
  {
    id: "X",
    label: "X",
    description: "Pauli-X — bit flip (NOT gate)",
    color: "bg-red-500",
    qubits: 1,
  },
  {
    id: "Y",
    label: "Y",
    description: "Pauli-Y — bit+phase flip",
    color: "bg-orange-500",
    qubits: 1,
  },
  {
    id: "Z",
    label: "Z",
    description: "Pauli-Z — phase flip",
    color: "bg-yellow-500",
    qubits: 1,
  },
  {
    id: "S",
    label: "S",
    description: "S gate — phase shift π/2",
    color: "bg-purple-500",
    qubits: 1,
  },
  {
    id: "T",
    label: "T",
    description: "T gate — phase shift π/4",
    color: "bg-pink-500",
    qubits: 1,
  },
  {
    id: "CNOT",
    label: "CNOT",
    description: "Controlled-NOT — creates entanglement",
    color: "bg-emerald-500",
    qubits: 2,
  },
  {
    id: "CZ",
    label: "CZ",
    description: "Controlled-Z — controlled phase flip",
    color: "bg-teal-500",
    qubits: 2,
  },
  {
    id: "SWAP",
    label: "SWAP",
    description: "Swap two qubit states",
    color: "bg-indigo-500",
    qubits: 2,
  },
  {
    id: "Rx",
    label: "Rx",
    description: "Rotation around X axis",
    color: "bg-red-400",
    qubits: 1,
    paramName: "θ",
  },
  {
    id: "Ry",
    label: "Ry",
    description: "Rotation around Y axis",
    color: "bg-orange-400",
    qubits: 1,
    paramName: "θ",
  },
  {
    id: "Rz",
    label: "Rz",
    description: "Rotation around Z axis",
    color: "bg-yellow-400",
    qubits: 1,
    paramName: "θ",
  },
]
