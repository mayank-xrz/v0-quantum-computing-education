import { Complex, c } from "./complex"

/**
 * State vector for n qubits: a 2^n-dimensional complex vector.
 * Amplitude[i] is the coefficient of |i⟩ in the computational basis.
 */
export class StateVector {
  readonly amplitudes: Complex[]
  readonly numQubits: number

  constructor(amplitudes: Complex[]) {
    const n = amplitudes.length
    if (n === 0 || (n & (n - 1)) !== 0) {
      throw new Error(`State vector length must be a power of 2, got ${n}`)
    }
    this.amplitudes = amplitudes
    this.numQubits = Math.log2(n)
  }

  get dim(): number {
    return this.amplitudes.length
  }

  /** |0⟩^⊗n — all qubits in ground state */
  static zero(numQubits: number): StateVector {
    const dim = 1 << numQubits
    const amps = Array.from({ length: dim }, (_, i) =>
      i === 0 ? c(1) : c(0),
    )
    return new StateVector(amps)
  }

  /** Probability of measuring basis state |i⟩ via Born rule */
  probability(i: number): number {
    return this.amplitudes[i].absSquared()
  }

  /** All measurement probabilities, summing to 1 */
  probabilities(): number[] {
    return this.amplitudes.map((a) => a.absSquared())
  }

  /** Bloch sphere coords for a single-qubit state (undefined if >1 qubit) */
  blochVector(): { x: number; y: number; z: number } | null {
    if (this.numQubits !== 1) return null
    const [a, b] = this.amplitudes
    // θ/2 encodes z = cos θ, x = sin θ cos φ, y = sin θ sin φ
    const z = a.absSquared() - b.absSquared()
    const offDiag = a.conj().mul(b)
    const x = 2 * offDiag.re
    const y = -2 * offDiag.im
    return { x, y, z }
  }

  /** Human-readable ket notation, e.g. "0.71|0⟩ + 0.71|1⟩" */
  toKetString(precision = 2): string {
    return this.amplitudes
      .map((amp, i) => {
        if (amp.absSquared() < 1e-10) return null
        const ket = `|${i.toString(2).padStart(this.numQubits, "0")}⟩`
        const coeff = amp.toString(precision)
        return `${coeff}${ket}`
      })
      .filter(Boolean)
      .join(" + ")
  }

  /** Serialise to plain object for API transport */
  toJSON(): { re: number; im: number }[] {
    return this.amplitudes.map((a) => ({ re: a.re, im: a.im }))
  }

  static fromJSON(data: { re: number; im: number }[]): StateVector {
    return new StateVector(data.map((d) => c(d.re, d.im)))
  }
}
