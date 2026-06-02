import { describe, it, expect } from "vitest"
import { Complex, c } from "../complex"
import { StateVector } from "../state-vector"
import { GATE_MATRICES, CNOT, applySingleQubitGate, applyTwoQubitGate } from "../gates"
import { simulateCircuit } from "../circuit"

const INV_SQRT2 = 1 / Math.sqrt(2)
const near = (a: number, b: number) => Math.abs(a - b) < 1e-9

// ── Complex arithmetic ────────────────────────────────────────────────────

describe("Complex", () => {
  it("multiplies correctly", () => {
    const i = c(0, 1)
    const result = i.mul(i)
    expect(near(result.re, -1)).toBe(true)
    expect(near(result.im, 0)).toBe(true)
  })

  it("abs is correct", () => {
    expect(near(c(3, 4).abs(), 5)).toBe(true)
  })

  it("polar form: e^{iπ} = -1", () => {
    const r = Complex.polar(1, Math.PI)
    expect(near(r.re, -1)).toBe(true)
    expect(near(r.im, 0)).toBe(true)
  })
})

// ── H|0⟩ = (|0⟩ + |1⟩)/√2 ────────────────────────────────────────────────

describe("Hadamard gate", () => {
  it("H|0⟩ creates equal superposition", () => {
    const state = StateVector.zero(1)
    const result = applySingleQubitGate(state, GATE_MATRICES.H, 0)
    expect(near(result.amplitudes[0].re, INV_SQRT2)).toBe(true)
    expect(near(result.amplitudes[1].re, INV_SQRT2)).toBe(true)
    expect(near(result.probability(0), 0.5)).toBe(true)
    expect(near(result.probability(1), 0.5)).toBe(true)
  })

  it("H|1⟩ = (|0⟩ - |1⟩)/√2", () => {
    // Prepare |1⟩ first with X gate
    const state = StateVector.zero(1)
    const one = applySingleQubitGate(state, GATE_MATRICES.X, 0)
    const result = applySingleQubitGate(one, GATE_MATRICES.H, 0)
    expect(near(result.amplitudes[0].re, INV_SQRT2)).toBe(true)
    expect(near(result.amplitudes[1].re, -INV_SQRT2)).toBe(true)
  })

  it("H is its own inverse: H²|0⟩ = |0⟩", () => {
    let state = StateVector.zero(1)
    state = applySingleQubitGate(state, GATE_MATRICES.H, 0)
    state = applySingleQubitGate(state, GATE_MATRICES.H, 0)
    expect(near(state.amplitudes[0].re, 1)).toBe(true)
    expect(near(state.amplitudes[1].re, 0)).toBe(true)
  })
})

// ── Pauli gates ───────────────────────────────────────────────────────────

describe("Pauli gates", () => {
  it("X flips |0⟩ to |1⟩", () => {
    const state = StateVector.zero(1)
    const result = applySingleQubitGate(state, GATE_MATRICES.X, 0)
    expect(near(result.amplitudes[0].re, 0)).toBe(true)
    expect(near(result.amplitudes[1].re, 1)).toBe(true)
  })

  it("Z flips phase of |1⟩: Z(|1⟩) = -|1⟩", () => {
    const state = StateVector.zero(1)
    const one = applySingleQubitGate(state, GATE_MATRICES.X, 0)
    const result = applySingleQubitGate(one, GATE_MATRICES.Z, 0)
    expect(near(result.amplitudes[1].re, -1)).toBe(true)
  })

  it("X² = Identity", () => {
    let state = StateVector.zero(1)
    state = applySingleQubitGate(state, GATE_MATRICES.X, 0)
    state = applySingleQubitGate(state, GATE_MATRICES.X, 0)
    expect(near(state.amplitudes[0].re, 1)).toBe(true)
    expect(near(state.amplitudes[1].re, 0)).toBe(true)
  })
})

// ── Bell state (entanglement) ─────────────────────────────────────────────

describe("Bell state (entanglement)", () => {
  it("H⊗I followed by CNOT creates |Φ+⟩ = (|00⟩+|11⟩)/√2", () => {
    // Start |00⟩
    let state = StateVector.zero(2)
    // H on qubit 0
    state = applySingleQubitGate(state, GATE_MATRICES.H, 0)
    // CNOT with control=0, target=1
    state = applyTwoQubitGate(state, CNOT, 0, 1)

    // |Φ+⟩: amplitudes[0] = 1/√2 (|00⟩), amplitudes[3] = 1/√2 (|11⟩)
    expect(near(state.amplitudes[0].re, INV_SQRT2)).toBe(true)
    expect(near(state.amplitudes[1].re, 0)).toBe(true)
    expect(near(state.amplitudes[2].re, 0)).toBe(true)
    expect(near(state.amplitudes[3].re, INV_SQRT2)).toBe(true)

    expect(near(state.probability(0), 0.5)).toBe(true)
    expect(near(state.probability(3), 0.5)).toBe(true)
  })
})

// ── Circuit simulation ────────────────────────────────────────────────────

describe("simulateCircuit", () => {
  it("empty circuit stays |0⟩", () => {
    const result = simulateCircuit({ numQubits: 1, gates: [] })
    expect(near(result.probabilities[0], 1)).toBe(true)
  })

  it("H gate via circuit sim matches direct application", () => {
    const result = simulateCircuit({
      numQubits: 1,
      gates: [{ id: "g1", gateId: "H", qubit: 0, column: 0 }],
    })
    expect(near(result.probabilities[0], 0.5)).toBe(true)
    expect(near(result.probabilities[1], 0.5)).toBe(true)
  })

  it("Bell state via circuit sim", () => {
    const result = simulateCircuit({
      numQubits: 2,
      gates: [
        { id: "g1", gateId: "H", qubit: 0, column: 0 },
        { id: "g2", gateId: "CNOT", qubit: 0, targetQubit: 1, column: 1 },
      ],
    })
    expect(near(result.probabilities[0], 0.5)).toBe(true)
    expect(near(result.probabilities[3], 0.5)).toBe(true)
    expect(near(result.probabilities[1], 0)).toBe(true)
    expect(near(result.probabilities[2], 0)).toBe(true)
  })

  it("probabilities always sum to 1", () => {
    const result = simulateCircuit({
      numQubits: 3,
      gates: [
        { id: "g1", gateId: "H", qubit: 0, column: 0 },
        { id: "g2", gateId: "H", qubit: 1, column: 0 },
        { id: "g3", gateId: "H", qubit: 2, column: 0 },
        { id: "g4", gateId: "CNOT", qubit: 0, targetQubit: 1, column: 1 },
      ],
    })
    const sum = result.probabilities.reduce((a, b) => a + b, 0)
    expect(near(sum, 1)).toBe(true)
  })
})

// ── Bloch vector ──────────────────────────────────────────────────────────

describe("Bloch vector", () => {
  it("|0⟩ → north pole (z=+1, x=0, y=0)", () => {
    const v = StateVector.zero(1).blochVector()!
    expect(near(v.z, 1)).toBe(true)
    expect(near(v.x, 0)).toBe(true)
    expect(near(v.y, 0)).toBe(true)
  })

  it("|1⟩ = X|0⟩ → south pole (z=-1, x=0, y=0)", () => {
    let state = StateVector.zero(1)
    state = applySingleQubitGate(state, GATE_MATRICES.X, 0)
    const v = state.blochVector()!
    expect(near(v.z, -1)).toBe(true)
    expect(near(v.x, 0)).toBe(true)
    expect(near(v.y, 0)).toBe(true)
  })

  it("|+⟩ = H|0⟩ → +X pole (x=+1, y=0, z=0)", () => {
    let state = StateVector.zero(1)
    state = applySingleQubitGate(state, GATE_MATRICES.H, 0)
    const v = state.blochVector()!
    expect(near(v.x, 1)).toBe(true)
    expect(near(v.y, 0)).toBe(true)
    expect(near(v.z, 0)).toBe(true)
  })

  it("|−⟩ = H|1⟩ → -X pole (x=-1, y=0, z=0)", () => {
    let state = StateVector.zero(1)
    state = applySingleQubitGate(state, GATE_MATRICES.X, 0)
    state = applySingleQubitGate(state, GATE_MATRICES.H, 0)
    const v = state.blochVector()!
    expect(near(v.x, -1)).toBe(true)
    expect(near(v.y, 0)).toBe(true)
    expect(near(v.z, 0)).toBe(true)
  })

  it("|+y⟩ = S|+⟩ → +Y pole (x=0, y=+1, z=0)", () => {
    // (|0⟩+i|1⟩)/√2: the +Y eigenstate
    let state = StateVector.zero(1)
    state = applySingleQubitGate(state, GATE_MATRICES.H, 0)
    state = applySingleQubitGate(state, GATE_MATRICES.S, 0)
    const v = state.blochVector()!
    expect(near(v.x, 0)).toBe(true)
    expect(near(v.y, 1)).toBe(true)
    expect(near(v.z, 0)).toBe(true)
  })

  it("|−y⟩ = S†|+⟩ → -Y pole (x=0, y=-1, z=0)", () => {
    // Apply S three times = S†: (|0⟩-i|1⟩)/√2
    let state = StateVector.zero(1)
    state = applySingleQubitGate(state, GATE_MATRICES.H, 0)
    state = applySingleQubitGate(state, GATE_MATRICES.S, 0)
    state = applySingleQubitGate(state, GATE_MATRICES.S, 0)
    state = applySingleQubitGate(state, GATE_MATRICES.S, 0)
    const v = state.blochVector()!
    expect(near(v.x, 0)).toBe(true)
    expect(near(v.y, -1)).toBe(true)
    expect(near(v.z, 0)).toBe(true)
  })

  it("Bloch vector has unit length for any pure state", () => {
    // T|+⟩ — arbitrary state on the sphere
    let state = StateVector.zero(1)
    state = applySingleQubitGate(state, GATE_MATRICES.H, 0)
    state = applySingleQubitGate(state, GATE_MATRICES.T, 0)
    const v = state.blochVector()!
    const len = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z)
    expect(near(len, 1)).toBe(true)
  })

  it("Y gate: Y|0⟩ = i|1⟩ → same Bloch position as |1⟩", () => {
    let state = StateVector.zero(1)
    state = applySingleQubitGate(state, GATE_MATRICES.Y, 0)
    // i|1⟩ has same Bloch vector as |1⟩ (global phase doesn't shift Bloch vector)
    const v = state.blochVector()!
    expect(near(v.z, -1)).toBe(true)
    expect(near(v.x, 0)).toBe(true)
    expect(near(v.y, 0)).toBe(true)
  })
})
