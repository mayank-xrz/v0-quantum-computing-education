import { describe, it, expect } from "vitest"
import { PUZZLES, checkPuzzle, todaysPuzzle, buildShareText } from "../puzzle"
import type { CircuitState } from "../circuit"

// ── Puzzle pool completeness ───────────────────────────────────────────────

describe("Puzzle pool", () => {
  it("has at least 7 puzzles (one per day of the week)", () => {
    expect(PUZZLES.length).toBeGreaterThanOrEqual(7)
  })

  it("all puzzles have valid targetAmplitudes length (2^numQubits)", () => {
    for (const p of PUZZLES) {
      expect(p.targetAmplitudes.length).toBe(1 << p.numQubits)
    }
  })

  it("all puzzle target states have unit norm", () => {
    for (const p of PUZZLES) {
      const norm = p.targetAmplitudes.reduce(
        (s, a) => s + a.re * a.re + a.im * a.im,
        0,
      )
      expect(Math.abs(norm - 1)).toBeLessThan(1e-9)
    }
  })
})

// ── checkPuzzle — correct solution passes ─────────────────────────────────

describe("checkPuzzle — correct solutions", () => {
  it("H on q0 solves the superposition puzzle", () => {
    const puzzle = PUZZLES.find((p) => p.id === "superposition")!
    const circuit: CircuitState = {
      numQubits: 1,
      gates: [{ id: "g", gateId: "H", qubit: 0, column: 0 }],
    }
    const { passed, fidelity } = checkPuzzle(circuit, puzzle)
    expect(passed).toBe(true)
    expect(fidelity).toBeGreaterThan(0.999)
  })

  it("X on q0 solves the excited state puzzle", () => {
    const puzzle = PUZZLES.find((p) => p.id === "excited")!
    const circuit: CircuitState = {
      numQubits: 1,
      gates: [{ id: "g", gateId: "X", qubit: 0, column: 0 }],
    }
    const { passed } = checkPuzzle(circuit, puzzle)
    expect(passed).toBe(true)
  })

  it("X+H solves the |−⟩ puzzle", () => {
    const puzzle = PUZZLES.find((p) => p.id === "minus")!
    const circuit: CircuitState = {
      numQubits: 1,
      gates: [
        { id: "g1", gateId: "X", qubit: 0, column: 0 },
        { id: "g2", gateId: "H", qubit: 0, column: 1 },
      ],
    }
    const { passed } = checkPuzzle(circuit, puzzle)
    expect(passed).toBe(true)
  })

  it("H+S solves the |i⟩ phase puzzle", () => {
    const puzzle = PUZZLES.find((p) => p.id === "phase-i")!
    const circuit: CircuitState = {
      numQubits: 1,
      gates: [
        { id: "g1", gateId: "H", qubit: 0, column: 0 },
        { id: "g2", gateId: "S", qubit: 0, column: 1 },
      ],
    }
    const { passed, fidelity } = checkPuzzle(circuit, puzzle)
    expect(passed).toBe(true)
    expect(fidelity).toBeGreaterThan(0.999)
  })

  it("H+CNOT solves the Bell state puzzle", () => {
    const puzzle = PUZZLES.find((p) => p.id === "bell")!
    const circuit: CircuitState = {
      numQubits: 2,
      gates: [
        { id: "g1", gateId: "H",    qubit: 0,                column: 0 },
        { id: "g2", gateId: "CNOT", qubit: 0, targetQubit: 1, column: 1 },
      ],
    }
    const { passed } = checkPuzzle(circuit, puzzle)
    expect(passed).toBe(true)
  })

  it("H+T solves the T gate puzzle", () => {
    const puzzle = PUZZLES.find((p) => p.id === "t-gate")!
    const circuit: CircuitState = {
      numQubits: 1,
      gates: [
        { id: "g1", gateId: "H", qubit: 0, column: 0 },
        { id: "g2", gateId: "T", qubit: 0, column: 1 },
      ],
    }
    const { passed } = checkPuzzle(circuit, puzzle)
    expect(passed).toBe(true)
  })

  it("GHZ circuit solves the GHZ puzzle", () => {
    const puzzle = PUZZLES.find((p) => p.id === "ghz")!
    const circuit: CircuitState = {
      numQubits: 3,
      gates: [
        { id: "g1", gateId: "H",    qubit: 0,                column: 0 },
        { id: "g2", gateId: "CNOT", qubit: 0, targetQubit: 1, column: 1 },
        { id: "g3", gateId: "CNOT", qubit: 0, targetQubit: 2, column: 2 },
      ],
    }
    const { passed } = checkPuzzle(circuit, puzzle)
    expect(passed).toBe(true)
  })
})

// ── checkPuzzle — wrong solution fails ────────────────────────────────────

describe("checkPuzzle — wrong solutions rejected", () => {
  it("empty circuit does not solve the superposition puzzle", () => {
    const puzzle = PUZZLES.find((p) => p.id === "superposition")!
    const { passed, fidelity } = checkPuzzle({ numQubits: 1, gates: [] }, puzzle)
    expect(passed).toBe(false)
    // |0⟩ vs |+⟩: |⟨0|+⟩|² = 0.5 — not zero, but well below the 0.999 threshold
    expect(fidelity).toBeLessThan(0.999)
  })

  it("wrong qubit count returns false immediately", () => {
    const puzzle = PUZZLES.find((p) => p.id === "bell")!
    const { passed } = checkPuzzle({ numQubits: 1, gates: [] }, puzzle)
    expect(passed).toBe(false)
  })
})

// ── todaysPuzzle determinism ───────────────────────────────────────────────

describe("todaysPuzzle", () => {
  it("returns the same puzzle on the same day (deterministic)", () => {
    expect(todaysPuzzle().id).toBe(todaysPuzzle().id)
  })

  it("returns a puzzle from the pool", () => {
    const p = todaysPuzzle()
    expect(PUZZLES.map((x) => x.id)).toContain(p.id)
  })
})

// ── Share text ─────────────────────────────────────────────────────────────

describe("buildShareText", () => {
  it("contains the puzzle title and site URL", () => {
    const puzzle = PUZZLES[0]
    const text = buildShareText(puzzle, 1, 1.0)
    expect(text).toContain(puzzle.title)
    expect(text).toContain("netlify.app")
  })

  it("gives 3 stars for using half the gate budget or fewer", () => {
    const puzzle = PUZZLES.find((p) => p.id === "superposition")! // maxGates=2
    const text = buildShareText(puzzle, 1, 1.0)
    expect(text).toContain("⭐⭐⭐")
  })
})
