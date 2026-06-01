import type { CircuitState } from "./circuit"
import { simulateCircuit } from "./circuit"
import { StateVector } from "./state-vector"
import { c } from "./complex"

export interface Puzzle {
  id: string
  title: string
  description: string
  numQubits: number
  maxGates: number
  /** Human-readable target ket string (for display) */
  targetKet: string
  /** Target amplitudes for fidelity check */
  targetAmplitudes: { re: number; im: number }[]
  hint: string
  /** Shown after solving */
  explanation: string
}

const INV_SQRT2 = 1 / Math.sqrt(2)

/**
 * The puzzle pool — one is selected per day via date-seeded index.
 * All target states are verified against the simulation engine.
 */
export const PUZZLES: Puzzle[] = [
  {
    id: "superposition",
    title: "Born in superposition",
    description: "Start from |0⟩ and reach the equal superposition state |+⟩.",
    numQubits: 1,
    maxGates: 2,
    targetKet: "(|0⟩+|1⟩)/√2",
    targetAmplitudes: [{ re: INV_SQRT2, im: 0 }, { re: INV_SQRT2, im: 0 }],
    hint: "One gate is enough.",
    explanation: "H|0⟩ = (|0⟩+|1⟩)/√2. The Hadamard gate creates a perfect 50/50 superposition.",
  },
  {
    id: "excited",
    title: "Flip it",
    description: "Flip the qubit from |0⟩ to |1⟩ using a single gate.",
    numQubits: 1,
    maxGates: 1,
    targetKet: "|1⟩",
    targetAmplitudes: [{ re: 0, im: 0 }, { re: 1, im: 0 }],
    hint: "The quantum NOT gate.",
    explanation: "X|0⟩ = |1⟩. Pauli-X is the quantum NOT gate — it swaps |0⟩ and |1⟩.",
  },
  {
    id: "minus",
    title: "The dark superposition",
    description: "Reach the |−⟩ = (|0⟩−|1⟩)/√2 state in at most 2 gates.",
    numQubits: 1,
    maxGates: 2,
    targetKet: "(|0⟩−|1⟩)/√2",
    targetAmplitudes: [{ re: INV_SQRT2, im: 0 }, { re: -INV_SQRT2, im: 0 }],
    hint: "First flip, then Hadamard.",
    explanation: "H|1⟩ = (|0⟩−|1⟩)/√2. The minus sign is a phase — it can't be detected by a single measurement, but interference reveals it.",
  },
  {
    id: "phase-i",
    title: "Imaginary phase",
    description: "Reach |i⟩ = (|0⟩+i|1⟩)/√2 in at most 2 gates.",
    numQubits: 1,
    maxGates: 2,
    targetKet: "(|0⟩+i|1⟩)/√2",
    targetAmplitudes: [{ re: INV_SQRT2, im: 0 }, { re: 0, im: INV_SQRT2 }],
    hint: "Superposition first, then a quarter-turn phase.",
    explanation: "S|+⟩ = (|0⟩+i|1⟩)/√2. The S gate applies a π/2 phase to |1⟩, rotating the Bloch vector to the +Y pole.",
  },
  {
    id: "bell",
    title: "Entangle me",
    description: "Create the Bell state |Φ+⟩ = (|00⟩+|11⟩)/√2 on 2 qubits.",
    numQubits: 2,
    maxGates: 3,
    targetKet: "(|00⟩+|11⟩)/√2",
    targetAmplitudes: [
      { re: INV_SQRT2, im: 0 }, { re: 0, im: 0 },
      { re: 0, im: 0 }, { re: INV_SQRT2, im: 0 },
    ],
    hint: "Superposition on q0, then entangle.",
    explanation: "H on q0 creates superposition, then CNOT entangles: (|0⟩+|1⟩)|0⟩ → |00⟩+|11⟩. This is maximum entanglement.",
  },
  {
    id: "t-gate",
    title: "Tiny twist",
    description: "Apply a π/4 phase rotation to |+⟩. Target: T|+⟩.",
    numQubits: 1,
    maxGates: 2,
    targetKet: "(|0⟩+e^{iπ/4}|1⟩)/√2",
    targetAmplitudes: [
      { re: INV_SQRT2, im: 0 },
      { re: INV_SQRT2 * Math.cos(Math.PI / 4), im: INV_SQRT2 * Math.sin(Math.PI / 4) },
    ],
    hint: "Hadamard then T.",
    explanation: "T|+⟩ = (|0⟩ + e^{iπ/4}|1⟩)/√2. The T gate applies a π/4 phase — small twist, but critical for universal quantum computation.",
  },
  {
    id: "z-flip",
    title: "Phase flip",
    description: "Apply a phase flip to |+⟩ to reach |−⟩, but use Z — not X.",
    numQubits: 1,
    maxGates: 2,
    targetKet: "(|0⟩−|1⟩)/√2",
    targetAmplitudes: [{ re: INV_SQRT2, im: 0 }, { re: -INV_SQRT2, im: 0 }],
    hint: "Create superposition, then phase flip.",
    explanation: "Z|+⟩ = |−⟩. The Z gate flips the phase of |1⟩ without affecting |0⟩. In the Bloch sphere, it's a π rotation around the Z axis.",
  },
  {
    id: "ghz",
    title: "Three in one",
    description: "Create the 3-qubit GHZ state (|000⟩+|111⟩)/√2.",
    numQubits: 3,
    maxGates: 4,
    targetKet: "(|000⟩+|111⟩)/√2",
    targetAmplitudes: [
      { re: INV_SQRT2, im: 0 }, { re: 0, im: 0 }, { re: 0, im: 0 }, { re: 0, im: 0 },
      { re: 0, im: 0 }, { re: 0, im: 0 }, { re: 0, im: 0 }, { re: INV_SQRT2, im: 0 },
    ],
    hint: "Bell state, then extend.",
    explanation: "H(q0), CNOT(q0→q1), CNOT(q0→q2). The GHZ state is maximally entangled across all 3 qubits — measuring any one collapses all.",
  },
]

/** Deterministically pick today's puzzle from the date string. */
export function todaysPuzzle(): Puzzle {
  const dateStr = new Date().toISOString().slice(0, 10) // "2026-06-01"
  const seed = dateStr
    .split("")
    .reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  return PUZZLES[seed % PUZZLES.length]
}

/** Quantum fidelity check: returns true if circuit output ≈ target state. */
export function checkPuzzle(
  circuit: CircuitState,
  puzzle: Puzzle,
): { passed: boolean; fidelity: number } {
  if (circuit.numQubits !== puzzle.numQubits) return { passed: false, fidelity: 0 }

  let result
  try {
    result = simulateCircuit(circuit)
  } catch {
    return { passed: false, fidelity: 0 }
  }

  const target = new StateVector(
    puzzle.targetAmplitudes.map((a) => c(a.re, a.im)),
  )

  const fidelity = result.stateVector.fidelity(target)
  return { passed: fidelity > 0.999, fidelity }
}

// ── Streak storage (localStorage, no backend) ─────────────────────────────

const STREAK_KEY = "qlearn-puzzle-streak"

interface StreakData {
  /** ISO date strings of solved days */
  solvedDates: string[]
  currentStreak: number
  bestStreak: number
}

export function loadStreak(): StreakData {
  if (typeof window === "undefined") {
    return { solvedDates: [], currentStreak: 0, bestStreak: 0 }
  }
  try {
    const raw = localStorage.getItem(STREAK_KEY)
    return raw
      ? (JSON.parse(raw) as StreakData)
      : { solvedDates: [], currentStreak: 0, bestStreak: 0 }
  } catch {
    return { solvedDates: [], currentStreak: 0, bestStreak: 0 }
  }
}

export function recordSolve(date: string): StreakData {
  const data = loadStreak()
  if (data.solvedDates.includes(date)) return data

  const newDates = [...data.solvedDates, date].sort()

  // Count current streak (consecutive days ending today)
  let streak = 0
  const today = new Date(date)
  for (let i = 0; ; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    const ds = d.toISOString().slice(0, 10)
    if (newDates.includes(ds)) streak++
    else break
  }

  const updated: StreakData = {
    solvedDates: newDates,
    currentStreak: streak,
    bestStreak: Math.max(data.bestStreak, streak),
  }
  localStorage.setItem(STREAK_KEY, JSON.stringify(updated))
  return updated
}

export function isSolvedToday(): boolean {
  const today = new Date().toISOString().slice(0, 10)
  return loadStreak().solvedDates.includes(today)
}

/** Build a shareable result string (no user data, just score). */
export function buildShareText(puzzle: Puzzle, gatesUsed: number, fidelity: number): string {
  const today = new Date().toISOString().slice(0, 10)
  const stars = gatesUsed <= Math.ceil(puzzle.maxGates / 2) ? "⭐⭐⭐" : gatesUsed < puzzle.maxGates ? "⭐⭐" : "⭐"
  return `QuantumLearn Daily Puzzle — ${today}\n${stars} "${puzzle.title}" solved in ${gatesUsed}/${puzzle.maxGates} gates (fidelity ${(fidelity * 100).toFixed(1)}%)\nhttps://quantum-study.netlify.app/playground`
}
