import { describe, it, expect } from "vitest"
import { toQiskit } from "../qiskit-export"
import type { CircuitState } from "../circuit"

// ── helpers ───────────────────────────────────────────────────────────────

const bell: CircuitState = {
  numQubits: 2,
  gates: [
    { id: "g1", gateId: "H",    qubit: 0,                column: 0 },
    { id: "g2", gateId: "CNOT", qubit: 0, targetQubit: 1, column: 1 },
  ],
}

const ghz: CircuitState = {
  numQubits: 3,
  gates: [
    { id: "g1", gateId: "H",    qubit: 0,                column: 0 },
    { id: "g2", gateId: "CNOT", qubit: 0, targetQubit: 1, column: 1 },
    { id: "g3", gateId: "CNOT", qubit: 0, targetQubit: 2, column: 2 },
  ],
}

const rotation: CircuitState = {
  numQubits: 1,
  gates: [
    { id: "g1", gateId: "Rx", qubit: 0, column: 0, param: Math.PI / 3 },
  ],
}

// ── Bell state ─────────────────────────────────────────────────────────────

describe("toQiskit — Bell state", () => {
  const code = toQiskit(bell)

  it("imports QuantumCircuit and AerSimulator", () => {
    expect(code).toContain("from qiskit import QuantumCircuit")
    expect(code).toContain("from qiskit_aer import AerSimulator")
  })

  it("creates a 2-qubit register", () => {
    expect(code).toContain("QuantumRegister(2")
    expect(code).toContain("ClassicalRegister(2")
  })

  it("emits H on qubit 0", () => {
    expect(code).toContain("qc.h(qr[0])")
  })

  it("emits CX (CNOT) with correct control and target", () => {
    expect(code).toContain("qc.cx(qr[0], qr[1])")
  })

  it("includes a measure call", () => {
    expect(code).toContain("qc.measure(qr, cr)")
  })

  it("includes simulation boilerplate", () => {
    expect(code).toContain("AerSimulator()")
    expect(code).toContain("get_counts()")
  })
})

// ── GHZ state ─────────────────────────────────────────────────────────────

describe("toQiskit — GHZ state (3 qubits)", () => {
  const code = toQiskit(ghz)

  it("creates a 3-qubit register", () => {
    expect(code).toContain("QuantumRegister(3")
  })

  it("emits two CNOT gates", () => {
    expect(code).toContain("qc.cx(qr[0], qr[1])")
    expect(code).toContain("qc.cx(qr[0], qr[2])")
  })
})

// ── Single-qubit gates ─────────────────────────────────────────────────────

describe("toQiskit — gate name mapping", () => {
  const check = (gateId: CircuitState["gates"][0]["gateId"], expected: string) => {
    const code = toQiskit({
      numQubits: 1,
      gates: [{ id: "g", gateId, qubit: 0, column: 0 }],
    })
    expect(code).toContain(expected)
  }

  it("X → qc.x",   () => check("X", "qc.x(qr[0])"))
  it("Y → qc.y",   () => check("Y", "qc.y(qr[0])"))
  it("Z → qc.z",   () => check("Z", "qc.z(qr[0])"))
  it("S → qc.s",   () => check("S", "qc.s(qr[0])"))
  it("T → qc.t",   () => check("T", "qc.t(qr[0])"))
  it("I → qc.id",  () => check("I", "qc.id(qr[0])"))
  it("CZ → qc.cz", () => {
    const code = toQiskit({
      numQubits: 2,
      gates: [{ id: "g", gateId: "CZ", qubit: 0, targetQubit: 1, column: 0 }],
    })
    expect(code).toContain("qc.cz(qr[0], qr[1])")
  })
  it("SWAP → qc.swap", () => {
    const code = toQiskit({
      numQubits: 2,
      gates: [{ id: "g", gateId: "SWAP", qubit: 0, targetQubit: 1, column: 0 }],
    })
    expect(code).toContain("qc.swap(qr[0], qr[1])")
  })
})

// ── Rotation gates ─────────────────────────────────────────────────────────

describe("toQiskit — rotation gates", () => {
  it("Rx emits correct angle", () => {
    const code = toQiskit(rotation)
    expect(code).toContain("qc.rx(1.047198")  // π/3 ≈ 1.047198
  })

  it("Ry emits correct method name", () => {
    const code = toQiskit({
      numQubits: 1,
      gates: [{ id: "g", gateId: "Ry", qubit: 0, column: 0, param: 1 }],
    })
    expect(code).toContain("qc.ry(1.000000, qr[0])")
  })
})

// ── Empty circuit ──────────────────────────────────────────────────────────

describe("toQiskit — empty circuit", () => {
  it("handles zero gates gracefully", () => {
    const code = toQiskit({ numQubits: 1, gates: [] })
    expect(code).toContain("empty circuit")
    expect(code).toContain("qc.measure")
  })
})
