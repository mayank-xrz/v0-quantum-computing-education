import { describe, it, expect } from "vitest"
import { c } from "../complex"
import { StateVector } from "../state-vector"
import { GATE_MATRICES, applySingleQubitGate, applyTwoQubitGate, CNOT, CZ, Rx, Ry, Rz } from "../gates"

const INV_SQRT2 = 1 / Math.sqrt(2)
const near = (a: number, b: number, eps = 1e-9) => Math.abs(a - b) < eps

describe("Mathematical correctness audit", () => {
  it("H gate matrix has correct values: (1/√2)[[1,1],[1,-1]]", () => {
    const H = GATE_MATRICES.H
    expect(near(H[0][0].re, INV_SQRT2)).toBe(true)
    expect(near(H[0][1].re, INV_SQRT2)).toBe(true)
    expect(near(H[1][0].re, INV_SQRT2)).toBe(true)
    expect(near(H[1][1].re, -INV_SQRT2)).toBe(true)
    expect(near(H[0][0].im, 0)).toBe(true)
    expect(near(H[1][1].im, 0)).toBe(true)
  })

  it("Pauli X gate: [[0,1],[1,0]]", () => {
    const X = GATE_MATRICES.X
    expect(near(X[0][0].re, 0)).toBe(true)
    expect(near(X[0][1].re, 1)).toBe(true)
    expect(near(X[1][0].re, 1)).toBe(true)
    expect(near(X[1][1].re, 0)).toBe(true)
  })

  it("Pauli Y gate: [[0,-i],[i,0]]", () => {
    const Y = GATE_MATRICES.Y
    expect(near(Y[0][0].re, 0)).toBe(true)
    expect(near(Y[0][1].im, -1)).toBe(true)
    expect(near(Y[1][0].im, 1)).toBe(true)
    expect(near(Y[1][1].re, 0)).toBe(true)
  })

  it("Pauli Z gate: [[1,0],[0,-1]]", () => {
    const Z = GATE_MATRICES.Z
    expect(near(Z[0][0].re, 1)).toBe(true)
    expect(near(Z[1][1].re, -1)).toBe(true)
  })

  it("S gate: [[1,0],[0,i]]", () => {
    const S = GATE_MATRICES.S
    expect(near(S[0][0].re, 1)).toBe(true)
    expect(near(S[1][1].im, 1)).toBe(true)
  })

  it("T gate: [[1,0],[0,e^(iπ/4)]]", () => {
    const T = GATE_MATRICES.T
    const exp_i_pi_4 = Math.cos(Math.PI / 4)
    expect(near(T[0][0].re, 1)).toBe(true)
    expect(near(T[1][1].re, exp_i_pi_4)).toBe(true)
    expect(near(T[1][1].im, exp_i_pi_4)).toBe(true)
  })

  it("Rx(π/2) rotates |0⟩ correctly: [cos(π/4), -i*sin(π/4); -i*sin(π/4), cos(π/4)]", () => {
    const theta = Math.PI / 2
    const cos = Math.cos(theta / 2)
    const sin = Math.sin(theta / 2)
    const Rx_pi2 = Rx(theta)
    expect(near(Rx_pi2[0][0].re, cos)).toBe(true)
    expect(near(Rx_pi2[0][1].im, -sin)).toBe(true)
    expect(near(Rx_pi2[1][0].im, -sin)).toBe(true)
    expect(near(Rx_pi2[1][1].re, cos)).toBe(true)
  })

  it("Ry(π) maps |0⟩ to |1⟩ (amplitude +1, no phase)", () => {
    // Ry(π) = [[cos π/2, -sin π/2],[sin π/2, cos π/2]] = [[0,-1],[1,0]]
    // Ry(π)|0⟩ = [0, 1] — positive amplitude on |1⟩
    let state = StateVector.zero(1)
    state = applySingleQubitGate(state, Ry(Math.PI), 0)
    expect(near(state.amplitudes[0].re, 0)).toBe(true)
    expect(near(state.amplitudes[1].re, 1)).toBe(true)
  })

  it("Rz applies correct phase: diag(e^(-iθ/2), e^(iθ/2))", () => {
    const theta = Math.PI / 4
    const Rz_theta = Rz(theta)
    const exp_minus_i_theta_2 = Math.cos(-theta / 2)
    const exp_i_theta_2 = Math.cos(theta / 2)
    expect(near(Rz_theta[0][0].re, exp_minus_i_theta_2)).toBe(true)
    expect(near(Rz_theta[1][1].re, exp_i_theta_2)).toBe(true)
  })

  it("Bloch vector for |0⟩ is (0, 0, 1)", () => {
    const state = StateVector.zero(1)
    const b = state.blochVector()!
    expect(near(b.x, 0)).toBe(true)
    expect(near(b.y, 0)).toBe(true)
    expect(near(b.z, 1)).toBe(true)
  })

  it("Bloch vector for |1⟩ is (0, 0, -1)", () => {
    let state = StateVector.zero(1)
    state = applySingleQubitGate(state, GATE_MATRICES.X, 0)
    const b = state.blochVector()!
    expect(near(b.x, 0)).toBe(true)
    expect(near(b.y, 0)).toBe(true)
    expect(near(b.z, -1)).toBe(true)
  })

  it("Bloch vector for |+⟩ is (1, 0, 0)", () => {
    let state = StateVector.zero(1)
    state = applySingleQubitGate(state, GATE_MATRICES.H, 0)
    const b = state.blochVector()!
    expect(near(b.x, 1)).toBe(true)
    expect(near(b.y, 0)).toBe(true)
    expect(near(b.z, 0)).toBe(true)
  })

  it("Bloch vector for |-⟩ is (-1, 0, 0)", () => {
    let state = StateVector.zero(1)
    state = applySingleQubitGate(state, GATE_MATRICES.X, 0)
    state = applySingleQubitGate(state, GATE_MATRICES.H, 0)
    const b = state.blochVector()!
    expect(near(b.x, -1)).toBe(true)
    expect(near(b.y, 0)).toBe(true)
    expect(near(b.z, 0)).toBe(true)
  })

  it("Bloch vector for |i⟩ = (|0⟩ + i|1⟩)/√2 is (0, 1, 0)", () => {
    const state = new StateVector([c(INV_SQRT2, 0), c(0, INV_SQRT2)])
    const b = state.blochVector()!
    expect(near(b.x, 0, 1e-8)).toBe(true)
    expect(near(b.y, 1, 1e-8)).toBe(true)
    expect(near(b.z, 0, 1e-8)).toBe(true)
  })

  it("Bloch vector for |-i⟩ = (|0⟩ - i|1⟩)/√2 is (0, -1, 0)", () => {
    const state = new StateVector([c(INV_SQRT2, 0), c(0, -INV_SQRT2)])
    const b = state.blochVector()!
    expect(near(b.x, 0, 1e-8)).toBe(true)
    expect(near(b.y, -1, 1e-8)).toBe(true)
    expect(near(b.z, 0, 1e-8)).toBe(true)
  })

  it("applySingleQubitGate: H|0⟩⊗|0⟩ = (|0⟩+|1⟩)/√2 ⊗ |0⟩ for 2-qubit system", () => {
    let state = StateVector.zero(2)
    state = applySingleQubitGate(state, GATE_MATRICES.H, 0)
    // Result should be (|00⟩ + |10⟩)/√2
    expect(near(state.amplitudes[0].re, INV_SQRT2)).toBe(true)  // |00⟩
    expect(near(state.amplitudes[2].re, INV_SQRT2)).toBe(true)  // |10⟩
    expect(near(state.amplitudes[1].re, 0)).toBe(true)           // |01⟩
    expect(near(state.amplitudes[3].re, 0)).toBe(true)           // |11⟩
  })

  it("applyTwoQubitGate: H|00⟩ then CNOT creates Bell state |Φ+⟩", () => {
    let state = StateVector.zero(2)
    state = applySingleQubitGate(state, GATE_MATRICES.H, 0)
    state = applyTwoQubitGate(state, CNOT, 0, 1)
    // Result should be (|00⟩ + |11⟩)/√2
    expect(near(state.amplitudes[0].re, INV_SQRT2)).toBe(true)
    expect(near(state.amplitudes[3].re, INV_SQRT2)).toBe(true)
    expect(near(state.amplitudes[1].re, 0)).toBe(true)
    expect(near(state.amplitudes[2].re, 0)).toBe(true)
  })

  it("applyTwoQubitGate: CZ flips phase of |11⟩", () => {
    const state = new StateVector([c(0), c(0), c(0), c(1)])  // |11⟩
    const result = applyTwoQubitGate(state, CZ, 0, 1)
    expect(near(result.amplitudes[3].re, -1)).toBe(true)
    expect(near(result.amplitudes[3].im, 0)).toBe(true)
  })

  it("applyTwoQubitGate: CZ leaves |00⟩, |01⟩, |10⟩ unchanged", () => {
    for (const idx of [0, 1, 2]) {
      const state = new StateVector(Array.from({length: 4}, (_, i) => i === idx ? c(1) : c(0)))
      const result = applyTwoQubitGate(state, CZ, 0, 1)
      expect(near(result.amplitudes[idx].re, 1)).toBe(true)
    }
  })

  it("Probability normalization: probabilities sum to 1", () => {
    let state = StateVector.zero(3)
    state = applySingleQubitGate(state, GATE_MATRICES.H, 0)
    state = applySingleQubitGate(state, GATE_MATRICES.H, 1)
    state = applySingleQubitGate(state, GATE_MATRICES.H, 2)
    const sum = state.probabilities().reduce((a, b) => a + b, 0)
    expect(near(sum, 1)).toBe(true)
  })

  it("Fidelity: |⟨ψ|φ⟩|² of identical states is 1", () => {
    const state = new StateVector([c(INV_SQRT2), c(INV_SQRT2)])
    const fidelity = state.fidelity(state)
    expect(near(fidelity, 1)).toBe(true)
  })

  it("Fidelity: orthogonal states have fidelity 0", () => {
    const plus = new StateVector([c(INV_SQRT2), c(INV_SQRT2)])
    const minus = new StateVector([c(INV_SQRT2), c(-INV_SQRT2)])
    const fidelity = plus.fidelity(minus)
    expect(near(fidelity, 0)).toBe(true)
  })

  it("Fidelity of |0⟩ with |+⟩ is 0.5", () => {
    const zero = StateVector.zero(1)
    const plus = new StateVector([c(INV_SQRT2), c(INV_SQRT2)])
    const fidelity = zero.fidelity(plus)
    expect(near(fidelity, 0.5)).toBe(true)
  })
})
