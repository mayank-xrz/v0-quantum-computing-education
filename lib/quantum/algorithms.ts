import type { CircuitGate, CircuitState } from "./circuit"
import { simulateCircuit } from "./circuit"
import type { StateVector } from "./state-vector"

export interface AlgorithmStep {
  label: string
  /** Plain-English explanation shown in the visualizer */
  explanation: string
  /** Deeper "why does this work" insight */
  insight: string
  reference?: { text: string; url: string }
  /** Cumulative gates at this step */
  gates: CircuitGate[]
}

export interface AlgorithmDef {
  id: string
  name: string
  tagline: string
  description: string
  numQubits: number
  steps: AlgorithmStep[]
}

/** Pre-simulated snapshot for each step */
export interface AlgorithmSnapshot {
  step: AlgorithmStep
  stateVector: StateVector
  probabilities: number[]
}

/** Run the simulation for every step prefix and return snapshots. */
export function buildSnapshots(algo: AlgorithmDef): AlgorithmSnapshot[] {
  return algo.steps.map((step) => {
    const circuit: CircuitState = { numQubits: algo.numQubits, gates: step.gates }
    const result = simulateCircuit(circuit)
    return { step, stateVector: result.stateVector, probabilities: result.probabilities }
  })
}

// ── Grover's Search (2 qubits, target |11⟩) ──────────────────────────────

const GROVERS: AlgorithmDef = {
  id: "grovers",
  name: "Grover's Search",
  tagline: "Find a needle in a quantum haystack",
  description:
    "Grover's algorithm finds a marked item among N items in O(√N) queries — " +
    "a quadratic speedup over classical search. Here we search 4 items (2 qubits) " +
    "and mark |11⟩ as the winner. One iteration is sufficient for N=4.",
  numQubits: 2,
  steps: [
    {
      label: "Initialise |00⟩",
      explanation: "Both qubits start in the computational ground state |0⟩.",
      insight:
        "Every quantum computation starts in a known, definite state. The |00⟩ " +
        "state has amplitude 1 and all others have amplitude 0.",
      gates: [],
    },
    {
      label: "Equal superposition",
      explanation:
        "Apply a Hadamard gate to each qubit. The result is the equal superposition " +
        "of all 4 computational basis states, each with amplitude ½.",
      insight:
        "H|0⟩ = (|0⟩+|1⟩)/√2. Applying H to both qubits gives " +
        "H⊗H|00⟩ = ½(|00⟩+|01⟩+|10⟩+|11⟩). " +
        "This is the quantum database: we're in all states at once.",
      reference: {
        text: "Qiskit textbook — Grover's Algorithm",
        url: "https://learning.quantum.ibm.com/course/fundamentals-of-quantum-algorithms/grovers-algorithm",
      },
      gates: [
        { id: "g-h0", gateId: "H", qubit: 0, column: 0 },
        { id: "g-h1", gateId: "H", qubit: 1, column: 0 },
      ],
    },
    {
      label: "Oracle — mark |11⟩",
      explanation:
        "The oracle flips the phase of the marked state |11⟩ from +½ to −½. " +
        "CZ does exactly this: it applies a −1 phase when both qubits are |1⟩.",
      insight:
        "The oracle is a phase kickback: it doesn't collapse the state, it just " +
        "tags the answer with a minus sign. Classically you'd need to check each item; " +
        "here the oracle runs on the entire superposition simultaneously.",
      gates: [
        { id: "g-h0", gateId: "H", qubit: 0, column: 0 },
        { id: "g-h1", gateId: "H", qubit: 1, column: 0 },
        { id: "g-oracle", gateId: "CZ", qubit: 0, targetQubit: 1, column: 1 },
      ],
    },
    {
      label: "Diffusion operator",
      explanation:
        "The diffusion (inversion about average) amplifies the marked state. " +
        "It's implemented as H⊗H → X⊗X → CZ → X⊗X → H⊗H. " +
        "After this, |11⟩ has probability ≈ 1.",
      insight:
        "Geometrically, the oracle reflects the state about the marked state, " +
        "and the diffusion reflects it about the uniform superposition. " +
        "Together they rotate the state vector toward the answer by angle 2θ " +
        "where sin θ = 1/√N. For N=4, one iteration is exact.",
      reference: {
        text: "Nielsen & Chuang §6.1",
        url: "https://www.cambridge.org/quantum",
      },
      gates: [
        { id: "g-h0", gateId: "H", qubit: 0, column: 0 },
        { id: "g-h1", gateId: "H", qubit: 1, column: 0 },
        { id: "g-oracle", gateId: "CZ", qubit: 0, targetQubit: 1, column: 1 },
        // Diffusion: H⊗H
        { id: "g-dh0", gateId: "H", qubit: 0, column: 2 },
        { id: "g-dh1", gateId: "H", qubit: 1, column: 2 },
        // X⊗X
        { id: "g-dx0", gateId: "X", qubit: 0, column: 3 },
        { id: "g-dx1", gateId: "X", qubit: 1, column: 3 },
        // CZ (controlled-Z on |00⟩)
        { id: "g-dcz", gateId: "CZ", qubit: 0, targetQubit: 1, column: 4 },
        // X⊗X
        { id: "g-dx02", gateId: "X", qubit: 0, column: 5 },
        { id: "g-dx12", gateId: "X", qubit: 1, column: 5 },
        // H⊗H
        { id: "g-dh02", gateId: "H", qubit: 0, column: 6 },
        { id: "g-dh12", gateId: "H", qubit: 1, column: 6 },
      ],
    },
  ],
}

// ── Deutsch-Jozsa (2 qubits, balanced oracle f(x)=x) ─────────────────────

const DEUTSCH_JOZSA: AlgorithmDef = {
  id: "deutsch-jozsa",
  name: "Deutsch-Jozsa",
  tagline: "Constant or balanced? One query suffices",
  description:
    "Given a black-box function f: {0,1} → {0,1}, determine whether it's constant " +
    "(same output for all inputs) or balanced (outputs 0 for half, 1 for half). " +
    "Classically requires 2 queries; Deutsch-Jozsa solves it in 1. " +
    "Here we use a balanced oracle f(x) = x (CNOT).",
  numQubits: 2,
  steps: [
    {
      label: "Initialise |00⟩",
      explanation: "Start with both qubits in |0⟩.",
      insight:
        "The algorithm uses two registers: a query qubit q0 and an ancilla q1. " +
        "The ancilla will be prepared in |−⟩ so the oracle can write its result as a phase.",
      gates: [],
    },
    {
      label: "Prepare ancilla |01⟩",
      explanation: "Apply X to q1 to flip it to |1⟩. Now the state is |01⟩.",
      insight:
        "The ancilla qubit |1⟩ will become |−⟩ after a Hadamard. This '|−⟩ trick' " +
        "is called phase kickback: when the oracle flips the ancilla conditionally, " +
        "the phase ends up on the query qubit instead.",
      gates: [{ id: "dj-x1", gateId: "X", qubit: 1, column: 0 }],
    },
    {
      label: "Apply Hadamard to both",
      explanation:
        "H on q0 creates superposition |+⟩. H on q1 turns |1⟩ into |−⟩ = (|0⟩−|1⟩)/√2.",
      insight:
        "The full state is now |+⟩|−⟩ = ½(|00⟩ − |01⟩ + |10⟩ − |11⟩). " +
        "The query qubit is in superposition — the oracle will evaluate f on both 0 and 1 simultaneously.",
      gates: [
        { id: "dj-x1", gateId: "X", qubit: 1, column: 0 },
        { id: "dj-h0", gateId: "H", qubit: 0, column: 1 },
        { id: "dj-h1", gateId: "H", qubit: 1, column: 1 },
      ],
    },
    {
      label: "Balanced oracle Uf (CNOT)",
      explanation:
        "The balanced oracle f(x)=x is implemented as CNOT(q0→q1). " +
        "Phase kickback writes f into the phase of q0: the state becomes |−⟩|−⟩.",
      insight:
        "After the CNOT, q0's |+⟩ becomes |−⟩ (phase flipped) because f is balanced. " +
        "If f were constant, q0 would remain |+⟩. The difference is entirely in the phase.",
      reference: {
        text: "Qiskit textbook — Deutsch-Jozsa Algorithm",
        url: "https://learning.quantum.ibm.com/course/fundamentals-of-quantum-algorithms/deutsch-jozsa-algorithm",
      },
      gates: [
        { id: "dj-x1", gateId: "X", qubit: 1, column: 0 },
        { id: "dj-h0", gateId: "H", qubit: 0, column: 1 },
        { id: "dj-h1", gateId: "H", qubit: 1, column: 1 },
        { id: "dj-cnot", gateId: "CNOT", qubit: 0, targetQubit: 1, column: 2 },
      ],
    },
    {
      label: "Final Hadamard on q0",
      explanation:
        "H on q0 maps |−⟩ → |1⟩. Measuring q0 gives |1⟩, which tells us the function is balanced.",
      insight:
        "H converts phase differences into amplitude differences. |+⟩ → |0⟩ (constant), " +
        "|−⟩ → |1⟩ (balanced). The measurement outcome is deterministic — " +
        "quantum interference makes the 'wrong' answer impossible.",
      gates: [
        { id: "dj-x1", gateId: "X", qubit: 1, column: 0 },
        { id: "dj-h0", gateId: "H", qubit: 0, column: 1 },
        { id: "dj-h1", gateId: "H", qubit: 1, column: 1 },
        { id: "dj-cnot", gateId: "CNOT", qubit: 0, targetQubit: 1, column: 2 },
        { id: "dj-h0f", gateId: "H", qubit: 0, column: 3 },
      ],
    },
  ],
}

export const ALGORITHMS: AlgorithmDef[] = [GROVERS, DEUTSCH_JOZSA]

// ── Preset demo circuits ──────────────────────────────────────────────────

export interface PresetCircuit {
  id: string
  name: string
  description: string
  circuit: CircuitState
}

export const PRESET_CIRCUITS: PresetCircuit[] = [
  {
    id: "bell",
    name: "Bell State |Φ+⟩",
    description: "Maximum entanglement between two qubits",
    circuit: {
      numQubits: 2,
      gates: [
        { id: "p-h", gateId: "H", qubit: 0, column: 0 },
        { id: "p-cnot", gateId: "CNOT", qubit: 0, targetQubit: 1, column: 1 },
      ],
    },
  },
  {
    id: "superposition",
    name: "Equal Superposition",
    description: "Single qubit in pure |+⟩ state",
    circuit: {
      numQubits: 1,
      gates: [{ id: "p-h", gateId: "H", qubit: 0, column: 0 }],
    },
  },
  {
    id: "ghz",
    name: "GHZ State",
    description: "Three-qubit maximally entangled state",
    circuit: {
      numQubits: 3,
      gates: [
        { id: "p-h", gateId: "H", qubit: 0, column: 0 },
        { id: "p-c1", gateId: "CNOT", qubit: 0, targetQubit: 1, column: 1 },
        { id: "p-c2", gateId: "CNOT", qubit: 0, targetQubit: 2, column: 2 },
      ],
    },
  },
  {
    id: "phase-kickback",
    name: "Phase Kickback",
    description: "T gate creates a π/4 phase; interference reveals it",
    circuit: {
      numQubits: 1,
      gates: [
        { id: "p-h1", gateId: "H", qubit: 0, column: 0 },
        { id: "p-t", gateId: "T", qubit: 0, column: 1 },
        { id: "p-h2", gateId: "H", qubit: 0, column: 2 },
      ],
    },
  },
]
