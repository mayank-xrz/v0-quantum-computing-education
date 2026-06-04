import { describe, it, expect } from "vitest"
import { toOpenQASM, fromOpenQASM } from "../openqasm"
import type { CircuitState } from "../circuit"

// ── Helpers ──────────────────────────────────────────────────────────────────

function parseOk(input: string) {
  const r = fromOpenQASM(input)
  if (!r.ok) throw new Error(`Expected parse success, got: ${r.message}`)
  return r
}

function parseErr(input: string): string {
  const r = fromOpenQASM(input)
  if (r.ok) throw new Error("Expected parse error, but got success")
  return r.message
}

// ── Export tests ─────────────────────────────────────────────────────────────

describe("toOpenQASM", () => {
  it("emits correct header", () => {
    const c: CircuitState = { numQubits: 1, gates: [] }
    const out = toOpenQASM(c)
    expect(out).toContain("OPENQASM 2.0;")
    expect(out).toContain('include "qelib1.inc";')
    expect(out).toContain("qreg q[1];")
    expect(out).toContain("creg c[1];")
  })

  it("exports Bell state circuit correctly", () => {
    const circuit: CircuitState = {
      numQubits: 2,
      gates: [
        { id: "a", gateId: "H",    qubit: 0, column: 0 },
        { id: "b", gateId: "CNOT", qubit: 0, targetQubit: 1, column: 1 },
      ],
    }
    const out = toOpenQASM(circuit)
    expect(out).toContain("qreg q[2];")
    expect(out).toContain("h q[0];")
    expect(out).toContain("cx q[0], q[1];")
    expect(out).toContain("measure q[0] -> c[0];")
    expect(out).toContain("measure q[1] -> c[1];")
  })

  it("exports parameterised gates with radian angles", () => {
    const circuit: CircuitState = {
      numQubits: 1,
      gates: [{ id: "a", gateId: "Rx", qubit: 0, column: 0, param: Math.PI / 2 }],
    }
    const out = toOpenQASM(circuit)
    expect(out).toMatch(/rx\([\d.]+\) q\[0\];/)
  })

  it("omits identity gate (no-op)", () => {
    const circuit: CircuitState = {
      numQubits: 1,
      gates: [{ id: "a", gateId: "I", qubit: 0, column: 0 }],
    }
    const out = toOpenQASM(circuit)
    expect(out).not.toContain("id")
    expect(out).not.toContain(" i ")
  })

  it("exports CZ and SWAP gates", () => {
    const circuit: CircuitState = {
      numQubits: 2,
      gates: [
        { id: "a", gateId: "CZ",   qubit: 0, targetQubit: 1, column: 0 },
        { id: "b", gateId: "SWAP", qubit: 0, targetQubit: 1, column: 1 },
      ],
    }
    const out = toOpenQASM(circuit)
    expect(out).toContain("cz q[0], q[1];")
    expect(out).toContain("swap q[0], q[1];")
  })
})

// ── Import tests ─────────────────────────────────────────────────────────────

describe("fromOpenQASM", () => {
  it("parses minimal valid QASM 2.0", () => {
    const src = `OPENQASM 2.0;
include "qelib1.inc";
qreg q[1];
creg c[1];
h q[0];
measure q[0] -> c[0];`
    const r = parseOk(src)
    expect(r.version).toBe("2.0")
    expect(r.circuit.numQubits).toBe(1)
    expect(r.circuit.gates).toHaveLength(1)
    expect(r.circuit.gates[0].gateId).toBe("H")
    expect(r.circuit.gates[0].qubit).toBe(0)
  })

  it("parses Bell state QASM and produces correct gates", () => {
    const src = `OPENQASM 2.0;
include "qelib1.inc";
qreg q[2];
creg c[2];
h q[0];
cx q[0], q[1];
measure q -> c;`
    const r = parseOk(src)
    expect(r.circuit.numQubits).toBe(2)
    expect(r.circuit.gates).toHaveLength(2)
    expect(r.circuit.gates[0].gateId).toBe("H")
    expect(r.circuit.gates[1].gateId).toBe("CNOT")
    expect(r.circuit.gates[1].qubit).toBe(0)
    expect(r.circuit.gates[1].targetQubit).toBe(1)
  })

  it("parses rx/ry/rz with angle expressions", () => {
    const src = `OPENQASM 2.0;
qreg q[1];
rx(pi/2) q[0];
ry(3.14159) q[0];
rz(0.5) q[0];`
    const r = parseOk(src)
    expect(r.circuit.gates).toHaveLength(3)
    expect(r.circuit.gates[0].gateId).toBe("Rx")
    expect(r.circuit.gates[0].param).toBeCloseTo(Math.PI / 2, 5)
    expect(r.circuit.gates[1].param).toBeCloseTo(Math.PI, 4)
    expect(r.circuit.gates[2].param).toBeCloseTo(0.5, 5)
  })

  it("accepts QASM 3.0 qubit declarations", () => {
    const src = `OPENQASM 3.0;
qubit[2] q;
bit[2] c;
h q[0];
cx q[0], q[1];`
    const r = parseOk(src)
    expect(r.version).toBe("3.0")
    expect(r.circuit.numQubits).toBe(2)
    expect(r.circuit.gates).toHaveLength(2)
  })

  it("accepts QASM 3.0 measure assignment syntax", () => {
    const src = `OPENQASM 3.0;
qubit[1] q;
bit[1] c;
h q[0];
c = measure q;`
    const r = parseOk(src)
    expect(r.circuit.gates).toHaveLength(1)
  })

  it("skips unsupported gates with a warning (sdg)", () => {
    const src = `OPENQASM 2.0;
qreg q[1];
h q[0];
sdg q[0];`
    const r = parseOk(src)
    expect(r.circuit.gates).toHaveLength(1)  // sdg was skipped
    expect(r.warnings.some((w) => w.includes("sdg"))).toBe(true)
  })

  it("skips barrier with warning", () => {
    const src = `OPENQASM 2.0;
qreg q[2];
h q[0];
barrier q;
cx q[0], q[1];`
    const r = parseOk(src)
    expect(r.circuit.gates).toHaveLength(2)
    expect(r.warnings.some((w) => w.includes("barrier"))).toBe(true)
  })

  it("errors on missing header", () => {
    const msg = parseErr("qreg q[1];\nh q[0];")
    expect(msg).toContain("OPENQASM header")
  })

  it("errors on out-of-bounds qubit index", () => {
    const src = `OPENQASM 2.0;\nqreg q[2];\nh q[5];`
    const msg = parseErr(src)
    expect(msg).toContain("Qubit index 5")
  })

  it("errors on custom gate definition", () => {
    const src = `OPENQASM 2.0;\nqreg q[1];\ngate mygate q { h q; }`
    const msg = parseErr(src)
    expect(msg).toContain("Custom gate definitions")
  })

  it("errors on classical if", () => {
    const src = `OPENQASM 2.0;\nqreg q[1];\ncreg c[1];\nif(c==1) x q[0];`
    const msg = parseErr(src)
    expect(msg).toContain("if")
  })

  it("errors on input exceeding size limit", () => {
    const huge = `OPENQASM 2.0;\n` + "h q[0];\n".repeat(10000)
    const msg = parseErr(huge)
    expect(msg).toContain("too large")
  })
})

// ── Round-trip tests ──────────────────────────────────────────────────────────

describe("round-trip: export → import → compare", () => {
  function roundTrip(circuit: CircuitState) {
    const qasm = toOpenQASM(circuit)
    const result = fromOpenQASM(qasm)
    if (!result.ok) throw new Error(`Round-trip parse failed: ${result.message}`)
    return result.circuit
  }

  it("Bell state round-trips exactly", () => {
    const original: CircuitState = {
      numQubits: 2,
      gates: [
        { id: "a", gateId: "H",    qubit: 0, column: 0 },
        { id: "b", gateId: "CNOT", qubit: 0, targetQubit: 1, column: 1 },
      ],
    }
    const restored = roundTrip(original)
    expect(restored.numQubits).toBe(2)
    expect(restored.gates).toHaveLength(2)
    expect(restored.gates[0].gateId).toBe("H")
    expect(restored.gates[0].qubit).toBe(0)
    expect(restored.gates[1].gateId).toBe("CNOT")
    expect(restored.gates[1].qubit).toBe(0)
    expect(restored.gates[1].targetQubit).toBe(1)
  })

  it("GHZ 3-qubit circuit round-trips", () => {
    const original: CircuitState = {
      numQubits: 3,
      gates: [
        { id: "a", gateId: "H",    qubit: 0, column: 0 },
        { id: "b", gateId: "CNOT", qubit: 0, targetQubit: 1, column: 1 },
        { id: "c", gateId: "CNOT", qubit: 0, targetQubit: 2, column: 2 },
      ],
    }
    const restored = roundTrip(original)
    expect(restored.numQubits).toBe(3)
    expect(restored.gates).toHaveLength(3)
    expect(restored.gates[2].targetQubit).toBe(2)
  })

  it("parameterised Rx preserves angle to 5 decimal places", () => {
    const theta = Math.PI / 3
    const original: CircuitState = {
      numQubits: 1,
      gates: [{ id: "a", gateId: "Rx", qubit: 0, column: 0, param: theta }],
    }
    const restored = roundTrip(original)
    expect(restored.gates[0].param).toBeCloseTo(theta, 5)
  })

  it("full gate set single-qubit round-trip", () => {
    const gateIds = ["H", "X", "Y", "Z", "S", "T"] as const
    for (const gateId of gateIds) {
      const original: CircuitState = {
        numQubits: 1,
        gates: [{ id: "x", gateId, qubit: 0, column: 0 }],
      }
      const restored = roundTrip(original)
      expect(restored.gates[0].gateId).toBe(gateId)
    }
  })
})
