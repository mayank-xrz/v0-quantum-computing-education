import { describe, it, expect } from "vitest"
import { buildTeleportSnapshots, TELEPORT_STEPS } from "../teleportation"
import { StateVector } from "../state-vector"
import { simulateCircuit } from "../circuit"
import { GATE_MATRICES, applySingleQubitGate } from "../gates"
import { c } from "../complex"

const near = (a: number, b: number, eps = 1e-6) => Math.abs(a - b) < eps

const snapshots = buildTeleportSnapshots()

// ── Initial state ─────────────────────────────────────────────────────────

describe("Teleportation step 0 — initial |000⟩", () => {
  it("probability of |000⟩ is 1", () => {
    expect(near(snapshots[0].probabilities[0], 1)).toBe(true)
  })
})

// ── Step 1: message qubit prepared in |+⟩ ─────────────────────────────────

describe("Teleportation step 1 — message qubit |+⟩", () => {
  const snap = snapshots[1]

  it("q1 and q2 are still |0⟩", () => {
    // Only |000⟩ and |100⟩ should have amplitude
    const p000 = snap.probabilities[0]
    const p100 = snap.probabilities[4]
    const rest = snap.probabilities.filter((_, i) => i !== 0 && i !== 4)
      .reduce((a, b) => a + b, 0)
    expect(near(p000, 0.5)).toBe(true)
    expect(near(p100, 0.5)).toBe(true)
    expect(near(rest, 0)).toBe(true)
  })
})

// ── Step 2: Bell pair created between q1 and q2 ───────────────────────────

describe("Teleportation step 2 — Bell pair q1⊗q2", () => {
  const snap = snapshots[2]

  it("q1q2 joint probabilities show entanglement: P(00)=P(11)=0.5", () => {
    // q1q2Joint: [P(00), P(01), P(10), P(11)]
    expect(near(snap.q1q2Joint[0], 0.5)).toBe(true)  // P(00)
    expect(near(snap.q1q2Joint[1], 0)).toBe(true)     // P(01)
    expect(near(snap.q1q2Joint[2], 0)).toBe(true)     // P(10)
    expect(near(snap.q1q2Joint[3], 0.5)).toBe(true)   // P(11)
  })

  it("all 8-qubit probabilities sum to 1", () => {
    const sum = snap.probabilities.reduce((a, b) => a + b, 0)
    expect(near(sum, 1)).toBe(true)
  })
})

// ── Step 3: Alice's encoding ──────────────────────────────────────────────

describe("Teleportation step 3 — Alice's encoding", () => {
  const snap = snapshots[3]

  it("measurement outcomes are uniformly distributed across 4 branches", () => {
    // After Alice's encoding, each pair (q0,q1) is equally likely: 25% each
    const { q0q1Joint } = snap
    q0q1Joint.forEach((p) => expect(near(p, 0.25, 1e-5)).toBe(true))
  })
})

// ── Step 4: full circuit (Bob's corrections) ──────────────────────────────

describe("Teleportation step 4 — after Bob's corrections", () => {
  const snap = snapshots[4]

  it("all probabilities still sum to 1 (unitary evolution preserved)", () => {
    const sum = snap.probabilities.reduce((a, b) => a + b, 0)
    expect(near(sum, 1)).toBe(true)
  })
})

// ── Fidelity API ──────────────────────────────────────────────────────────

describe("StateVector.fidelity", () => {
  it("fidelity of a state with itself is 1", () => {
    const state = simulateCircuit({
      numQubits: 1,
      gates: [{ id: "h", gateId: "H", qubit: 0, column: 0 }],
    }).stateVector
    expect(near(state.fidelity(state), 1)).toBe(true)
  })

  it("fidelity of |0⟩ and |1⟩ is 0 (orthogonal)", () => {
    const s0 = StateVector.zero(1)
    const s1 = simulateCircuit({
      numQubits: 1,
      gates: [{ id: "x", gateId: "X", qubit: 0, column: 0 }],
    }).stateVector
    expect(near(s0.fidelity(s1), 0)).toBe(true)
  })

  it("fidelity of |+⟩ and |−⟩ is 0 (orthogonal)", () => {
    const plus  = simulateCircuit({ numQubits: 1, gates: [{ id: "h",  gateId: "H", qubit: 0, column: 0 }] }).stateVector
    const minus = simulateCircuit({ numQubits: 1, gates: [{ id: "x",  gateId: "X", qubit: 0, column: 0 }, { id: "h2", gateId: "H", qubit: 0, column: 1 }] }).stateVector
    expect(near(plus.fidelity(minus), 0, 1e-10)).toBe(true)
  })
})
