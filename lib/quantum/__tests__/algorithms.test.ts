import { describe, it, expect } from "vitest"
import { ALGORITHMS, buildSnapshots } from "../algorithms"
import { encodeCircuit, decodeCircuit } from "../share"

const near = (a: number, b: number) => Math.abs(a - b) < 1e-6

// ── Grover's Search ────────────────────────────────────────────────────────

describe("Grover's algorithm (2-qubit, target |11⟩)", () => {
  const algo = ALGORITHMS.find((a) => a.id === "grovers")!
  const snaps = buildSnapshots(algo)

  it("initial state is |00⟩", () => {
    expect(near(snaps[0].probabilities[0], 1)).toBe(true)
  })

  it("after H⊗H: equal superposition", () => {
    const probs = snaps[1].probabilities
    probs.forEach((p) => expect(near(p, 0.25)).toBe(true))
  })

  it("after oracle: |11⟩ has phase -1/2, others +1/2", () => {
    // Probabilities are still equal (oracle only flips phase, not amplitude magnitude)
    const probs = snaps[2].probabilities
    probs.forEach((p) => expect(near(p, 0.25)).toBe(true))
    // But |11⟩ amplitude should be negative
    const amp11 = snaps[2].stateVector.amplitudes[3]
    expect(amp11.re).toBeLessThan(0)
  })

  it("after diffusion: |11⟩ probability ≈ 1", () => {
    const finalProbs = snaps[snaps.length - 1].probabilities
    expect(near(finalProbs[3], 1)).toBe(true)
    expect(near(finalProbs[0], 0)).toBe(true)
    expect(near(finalProbs[1], 0)).toBe(true)
    expect(near(finalProbs[2], 0)).toBe(true)
  })
})

// ── Deutsch-Jozsa ──────────────────────────────────────────────────────────

describe("Deutsch-Jozsa (balanced oracle f(x)=x)", () => {
  const algo = ALGORITHMS.find((a) => a.id === "deutsch-jozsa")!
  const snaps = buildSnapshots(algo)

  it("initial state is |00⟩", () => {
    expect(near(snaps[0].probabilities[0], 1)).toBe(true)
  })

  it("after X on q1: state is |01⟩", () => {
    // |01⟩ is index 1 in big-endian (q0=0, q1=1)
    expect(near(snaps[1].probabilities[1], 1)).toBe(true)
  })

  it("final state: q0 = |1⟩ (balanced confirmed)", () => {
    // After final H on q0, q0 should be in |1⟩, so prob of |10⟩ or |11⟩ = 1
    const finalProbs = snaps[snaps.length - 1].probabilities
    const probQ0is1 = finalProbs[2] + finalProbs[3] // |10⟩ + |11⟩
    expect(near(probQ0is1, 1)).toBe(true)
  })

  it("probabilities always sum to 1 at every step", () => {
    for (const snap of snaps) {
      const sum = snap.probabilities.reduce((a, b) => a + b, 0)
      expect(near(sum, 1)).toBe(true)
    }
  })
})

// ── URL share encoding ─────────────────────────────────────────────────────

describe("Circuit URL encoding", () => {
  it("round-trips a simple circuit", () => {
    const circuit = {
      numQubits: 2,
      gates: [
        { id: "g1", gateId: "H" as const, qubit: 0, column: 0 },
        { id: "g2", gateId: "CNOT" as const, qubit: 0, targetQubit: 1, column: 1 },
      ],
    }
    const encoded = encodeCircuit(circuit)
    const decoded = decodeCircuit(encoded)
    expect(decoded?.numQubits).toBe(2)
    expect(decoded?.gates).toHaveLength(2)
    expect(decoded?.gates[0].gateId).toBe("H")
    expect(decoded?.gates[1].gateId).toBe("CNOT")
    expect(decoded?.gates[1].targetQubit).toBe(1)
  })

  it("returns null for invalid input", () => {
    expect(decodeCircuit("not-base64!!")).toBeNull()
    expect(decodeCircuit("e30=")).toBeNull() // {}
  })
})
