/** Immutable complex number with real and imaginary parts. */
export class Complex {
  constructor(
    readonly re: number,
    readonly im: number = 0,
  ) {}

  static readonly ZERO = new Complex(0, 0)
  static readonly ONE = new Complex(1, 0)
  static readonly I = new Complex(0, 1)

  add(other: Complex): Complex {
    return new Complex(this.re + other.re, this.im + other.im)
  }

  sub(other: Complex): Complex {
    return new Complex(this.re - other.re, this.im - other.im)
  }

  mul(other: Complex): Complex {
    return new Complex(
      this.re * other.re - this.im * other.im,
      this.re * other.im + this.im * other.re,
    )
  }

  scale(s: number): Complex {
    return new Complex(this.re * s, this.im * s)
  }

  conj(): Complex {
    return new Complex(this.re, -this.im)
  }

  /** |z|² */
  absSquared(): number {
    return this.re * this.re + this.im * this.im
  }

  abs(): number {
    return Math.sqrt(this.absSquared())
  }

  /** Euler's formula: e^(iθ) */
  static polar(r: number, theta: number): Complex {
    return new Complex(r * Math.cos(theta), r * Math.sin(theta))
  }

  toString(precision = 3): string {
    const r = this.re.toFixed(precision)
    const i = Math.abs(this.im).toFixed(precision)
    if (Math.abs(this.im) < 1e-10) return r
    if (Math.abs(this.re) < 1e-10) return `${this.im < 0 ? "-" : ""}${i}i`
    return `${r}${this.im < 0 ? " - " : " + "}${i}i`
  }
}

export function c(re: number, im = 0): Complex {
  return new Complex(re, im)
}
