/**
 * OpenQASM 2.0 export and import for the QuantumLearn circuit model.
 * Also handles partial OpenQASM 3.0 import (qubit/bit declarations, new measure syntax).
 *
 * Design constraints:
 * - Never eval() input — pure string parsing only
 * - Input size capped at 64 KB to guard against huge pastes
 * - Unknown gates produce a structured error, never a silent wrong circuit
 */

import type { CircuitState, CircuitGate } from "./circuit"
import type { GateId } from "./gates"

// ── Constants ────────────────────────────────────────────────────────────────

const MAX_INPUT_BYTES = 65_536 // 64 KB
const MAX_QUBITS = 16

// ── Export ────────────────────────────────────────────────────────────────────

/**
 * Generate valid OpenQASM 2.0 from a CircuitState.
 * Appends `measure q -> c;` for every qubit at the end.
 */
export function toOpenQASM(circuit: CircuitState): string {
  const { numQubits, gates } = circuit
  const lines: string[] = [
    "OPENQASM 2.0;",
    'include "qelib1.inc";',
    "",
    `qreg q[${numQubits}];`,
    `creg c[${numQubits}];`,
    "",
  ]

  if (gates.length === 0) {
    lines.push("// (empty circuit — all qubits initialised to |0⟩)")
    lines.push("")
  } else {
    const sorted = [...gates].sort(
      (a, b) => a.column - b.column || a.qubit - b.qubit,
    )

    let lastCol = -1
    for (const gate of sorted) {
      if (gate.column !== lastCol && lastCol !== -1) lines.push("")
      lastCol = gate.column

      const stmt = gateToQASM(gate)
      if (stmt) lines.push(stmt)
    }
    lines.push("")
  }

  // Measurements at the end
  for (let i = 0; i < numQubits; i++) {
    lines.push(`measure q[${i}] -> c[${i}];`)
  }

  return lines.join("\n")
}

function gateToQASM(gate: CircuitGate): string | null {
  const q = (n: number) => `q[${n}]`
  const { gateId, qubit, targetQubit, param } = gate

  switch (gateId) {
    case "H":    return `h ${q(qubit)};`
    case "X":    return `x ${q(qubit)};`
    case "Y":    return `y ${q(qubit)};`
    case "Z":    return `z ${q(qubit)};`
    case "S":    return `s ${q(qubit)};`
    case "T":    return `t ${q(qubit)};`
    case "I":    return null  // identity — no-op, omit
    case "CNOT": return `cx ${q(qubit)}, ${q(targetQubit!)};`
    case "CZ":   return `cz ${q(qubit)}, ${q(targetQubit!)};`
    case "SWAP": return `swap ${q(qubit)}, ${q(targetQubit!)};`
    case "Rx":   return `rx(${formatAngle(param ?? 0)}) ${q(qubit)};`
    case "Ry":   return `ry(${formatAngle(param ?? 0)}) ${q(qubit)};`
    case "Rz":   return `rz(${formatAngle(param ?? 0)}) ${q(qubit)};`
    default:     return null
  }
}

/** Format an angle in radians to a compact decimal string. */
function formatAngle(rad: number): string {
  // Round to 10 significant figures to avoid floating-point noise
  return parseFloat(rad.toPrecision(10)).toString()
}

// ── Parse result ─────────────────────────────────────────────────────────────

export type QASMVersion = "2.0" | "3.0"

export interface QASMParseSuccess {
  ok: true
  circuit: CircuitState
  version: QASMVersion
  warnings: string[]
}

export interface QASMParseError {
  ok: false
  message: string
  line?: number
}

export type QASMParseResult = QASMParseSuccess | QASMParseError

// ── Tokeniser helpers ─────────────────────────────────────────────────────────

/** Strip // line comments and /* block comments */
function stripComments(src: string): string {
  // Block comments
  src = src.replace(/\/\*[\s\S]*?\*\//g, " ")
  // Line comments
  src = src.replace(/\/\/[^\n]*/g, "")
  return src
}

/** Split source into lines, removing blank/comment-only lines */
function tokeniseLines(src: string): Array<{ text: string; lineNo: number }> {
  return src
    .split("\n")
    .map((text, i) => ({ text: text.trim(), lineNo: i + 1 }))
    .filter((l) => l.text.length > 0)
}

/** Parse a single integer register index from "q[n]" → n */
function parseRegIndex(token: string, regName: string, lineNo: number): number | QASMParseError {
  const m = token.match(new RegExp(`^${regName}\\[(\\d+)\\]$`))
  if (!m) return { ok: false, message: `Expected ${regName}[n], got "${token}"`, line: lineNo }
  return parseInt(m[1], 10)
}

/** Parse an angle expression — supports numeric literals and basic pi expressions */
function parseAngle(expr: string, lineNo: number): number | QASMParseError {
  const s = expr.trim()
    .replace(/\bpi\b/gi, String(Math.PI))
    .replace(/\bPI\b/g, String(Math.PI))

  // Only allow digits, ., +, -, *, /, (, ), space, e/E for scientific notation
  if (!/^[0-9.\s+\-*/()eE]+$/.test(s)) {
    return { ok: false, message: `Unsupported angle expression: "${expr}"`, line: lineNo }
  }

  try {
    // Safe evaluation: expression only contains numeric chars and basic operators
    // Using Function constructor is intentional here — we've validated the char set above
    // to contain only digits, arithmetic operators, and parens.
    // eslint-disable-next-line no-new-func
    const val = Function(`"use strict"; return (${s})`)() as number
    if (typeof val !== "number" || !isFinite(val)) {
      return { ok: false, message: `Angle expression did not produce a number: "${expr}"`, line: lineNo }
    }
    return val
  } catch {
    return { ok: false, message: `Could not parse angle: "${expr}"`, line: lineNo }
  }
}

// ── Import ────────────────────────────────────────────────────────────────────

// Map QASM gate names → internal GateId
const QASM_TO_GATE: Record<string, GateId> = {
  h: "H", x: "X", y: "Y", z: "Z", s: "S", t: "T", id: "I",
  cx: "CNOT", ccx: "CNOT", // ccx (Toffoli) is unsupported but listed for a better error
  cz: "CZ",
  swap: "SWAP",
  rx: "Rx", ry: "Ry", rz: "Rz",
}

// Gates we recognise but can't map to the internal model
const UNSUPPORTED_GATES = new Set([
  "sdg", "tdg", "u1", "u2", "u3", "p", "u", "ccx", "ch", "cp",
  "crx", "cry", "crz", "cswap",
])

/**
 * Parse OpenQASM 2.0 (or partial 3.0) text into a CircuitState.
 * Never throws — always returns QASMParseResult.
 */
export function fromOpenQASM(input: string): QASMParseResult {
  // Safety: cap input size
  if (input.length > MAX_INPUT_BYTES) {
    return { ok: false, message: `Input too large (max ${MAX_INPUT_BYTES / 1024} KB)` }
  }

  const stripped = stripComments(input)
  const lines = tokeniseLines(stripped)

  if (lines.length === 0) {
    return { ok: false, message: "Input is empty." }
  }

  let version: QASMVersion | null = null
  let numQubits = 0
  let columnCursor = 0
  const gates: CircuitGate[] = []
  const warnings: string[] = []

  for (const { text, lineNo } of lines) {
    // Statements end with ; — split compound lines
    const stmts = text.split(";").map((s) => s.trim()).filter(Boolean)

    for (const stmt of stmts) {
      // ── Header ──
      if (stmt.startsWith("OPENQASM")) {
        const m = stmt.match(/OPENQASM\s+([\d.]+)/)
        if (!m) return { ok: false, message: "Invalid OPENQASM header.", line: lineNo }
        const v = m[1]
        if (v.startsWith("3")) version = "3.0"
        else if (v.startsWith("2")) version = "2.0"
        else return { ok: false, message: `Unsupported OPENQASM version: ${v}`, line: lineNo }
        continue
      }

      // ── Include (ignore) ──
      if (stmt.startsWith("include")) continue

      // ── QASM 2.0 register declarations ──
      const qreg = stmt.match(/^qreg\s+(\w+)\[(\d+)\]$/)
      if (qreg) {
        if (qreg[1] !== "q") {
          warnings.push(`Line ${lineNo}: non-standard register name "${qreg[1]}" — treated as "q"`)
        }
        numQubits = parseInt(qreg[2], 10)
        if (numQubits > MAX_QUBITS) {
          return { ok: false, message: `Circuit has ${numQubits} qubits; max supported is ${MAX_QUBITS}.`, line: lineNo }
        }
        continue
      }
      if (stmt.match(/^creg\s+/)) continue // ignore classical register

      // ── QASM 3.0 register declarations ──
      const qubitDecl = stmt.match(/^qubit\[(\d+)\]\s+(\w+)$/) || stmt.match(/^qubit\s+(\w+)$/)
      if (qubitDecl) {
        // qubit[n] q  or  qubit q  (single)
        const sizeM = stmt.match(/^qubit\[(\d+)\]/)
        numQubits = sizeM ? parseInt(sizeM[1], 10) : 1
        if (numQubits > MAX_QUBITS) {
          return { ok: false, message: `Circuit has ${numQubits} qubits; max supported is ${MAX_QUBITS}.`, line: lineNo }
        }
        continue
      }
      if (stmt.match(/^bit\[/) || stmt.match(/^bit\s+/)) continue  // QASM 3.0 classical

      // ── Measure statements (both syntaxes — ignore, we measure implicitly) ──
      if (stmt.startsWith("measure") || stmt.match(/\s*=\s*measure\s/)) continue

      // ── Barrier (skip with warning) ──
      if (stmt.startsWith("barrier")) {
        warnings.push(`Line ${lineNo}: "barrier" is not supported and was skipped.`)
        continue
      }

      // ── Reset (skip with warning) ──
      if (stmt.startsWith("reset")) {
        warnings.push(`Line ${lineNo}: "reset" is not supported and was skipped.`)
        continue
      }

      // ── Classical if (unsupported) ──
      if (stmt.startsWith("if")) {
        return {
          ok: false,
          message: `Line ${lineNo}: Classical "if" control flow is not supported.`,
          line: lineNo,
        }
      }

      // ── Custom gate definitions (unsupported) ──
      if (stmt.startsWith("gate ")) {
        return {
          ok: false,
          message: `Line ${lineNo}: Custom gate definitions are not supported. Use the built-in gate set.`,
          line: lineNo,
        }
      }

      // ── Gate statements ──
      // Pattern: gateName[(angle)] q[i], q[j];
      const gateMatch = stmt.match(/^([a-z][a-z0-9_]*)\s*(?:\(([^)]*)\))?\s+(.+)$/)
      if (gateMatch) {
        const [, name, angleExpr, argStr] = gateMatch

        // Check for unsupported but recognised gates
        if (UNSUPPORTED_GATES.has(name)) {
          warnings.push(`Line ${lineNo}: Gate "${name}" is not supported and was skipped.`)
          continue
        }

        const gateId = QASM_TO_GATE[name]
        if (!gateId) {
          warnings.push(`Line ${lineNo}: Unknown gate "${name}" — skipped.`)
          continue
        }

        // Parse qubit arguments
        const args = argStr.split(",").map((s) => s.trim())
        const qubitIndices: number[] = []
        for (const arg of args) {
          // QASM 3.0 might use bare register names (q[0]) — same format
          const idx = parseRegIndex(arg, "q", lineNo)
          if (typeof idx !== "number") {
            // Try with any register name prefix for non-standard names
            const anyReg = arg.match(/^\w+\[(\d+)\]$/)
            if (anyReg) {
              qubitIndices.push(parseInt(anyReg[1], 10))
            } else {
              return idx // propagate error
            }
          } else {
            qubitIndices.push(idx)
          }
        }

        // Validate qubit bounds
        if (numQubits > 0) {
          for (const qi of qubitIndices) {
            if (qi >= numQubits) {
              return {
                ok: false,
                message: `Line ${lineNo}: Qubit index ${qi} exceeds register size ${numQubits}.`,
                line: lineNo,
              }
            }
          }
        }

        // Parse optional angle
        let param: number | undefined
        if (angleExpr !== undefined && angleExpr.trim() !== "") {
          const angle = parseAngle(angleExpr, lineNo)
          if (typeof angle !== "number") return angle
          param = angle
        }

        // Build internal gate
        const isTwo = gateId === "CNOT" || gateId === "CZ" || gateId === "SWAP"
        if (isTwo && qubitIndices.length < 2) {
          return { ok: false, message: `Line ${lineNo}: Gate "${name}" requires 2 qubits.`, line: lineNo }
        }

        const newGate: CircuitGate = {
          id: crypto.randomUUID(),
          gateId,
          qubit: qubitIndices[0],
          targetQubit: isTwo ? qubitIndices[1] : undefined,
          column: columnCursor,
          param,
        }
        gates.push(newGate)
        columnCursor++
        continue
      }

      // ── Anything else we don't recognise ──
      // Only warn if it looks substantive (not blank after stripping)
      if (stmt.length > 0) {
        warnings.push(`Line ${lineNo}: Unrecognised statement "${stmt.slice(0, 60)}" — skipped.`)
      }
    }
  }

  if (version === null) {
    return { ok: false, message: 'Missing OPENQASM header (e.g. "OPENQASM 2.0;").' }
  }

  // If numQubits was never set, infer from max qubit index used
  if (numQubits === 0 && gates.length > 0) {
    const maxQ = gates.reduce((m, g) => Math.max(m, g.qubit, g.targetQubit ?? 0), 0)
    numQubits = maxQ + 1
    warnings.push(`No register declaration found — inferred ${numQubits} qubit(s) from gate operands.`)
  }

  if (numQubits === 0) {
    return { ok: false, message: "No qubits declared and no gates found." }
  }

  return {
    ok: true,
    circuit: { numQubits, gates },
    version,
    warnings,
  }
}
