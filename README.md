# QuantumLearn

An interactive quantum computing education platform built with Next.js 15, React 19, and TypeScript. Features a physically correct quantum circuit simulator, AI-powered tutor, and step-by-step algorithm visualizer.

> **Placed 5th of 130 projects.** Now rebuilt as a real product.

---

## What makes this different

| Feature | Generic tutorials | QuantumLearn |
|---|---|---|
| Quantum simulation | Screenshots / descriptions | Live state vector, Born-rule probabilities, unitary matrices |
| AI assistance | Generic chatbot | Circuit-aware tutor that reads your live gates & state |
| Algorithm demos | Static diagrams | Animated step-by-step with scrubable timeline |
| Bloch sphere | Decorative animation | Mathematically correct: driven by actual state vector |
| Correctness | Unverified | 26 tests verify H\|0⟩, Bell state, Grover's, Deutsch-Jozsa |
| Sharing | None | Lossless URL hash — share any circuit with a link |

---

## Features

### Quantum Playground (`/playground`)

- **Drag-and-drop circuit builder** — 12 gates: H, X, Y, Z, S, T, I, CNOT, CZ, SWAP, Rx, Ry, Rz (up to 4 qubits, 10 columns)
- **Live state vector** — updates after every gate, shown in Dirac notation
- **Measurement probabilities** — bar chart with exact percentages
- **Gate unitary matrices** — click any gate to see its matrix
- **Bloch sphere** — real SVG sphere driven by the state vector (single-qubit mode), with θ, φ, z readout
- **Save & share** — circuit encodes to URL hash; paste the link to share an exact circuit
- **Export** — download Bloch sphere as PNG

### AI Quantum Tutor

- **Circuit-aware** — every question is answered in the context of your actual gates, state vector, and probabilities
- **Quick actions** — "Explain my last move", "What should I try next?", "Show me the math"
- **Quiz mode** — the tutor generates a question about your circuit and grades your answer
- **Streaming** — responses stream token-by-token; retry on error

### Algorithm Visualizer

- **Grover's Search (2-qubit)** — step-by-step: initialise → superposition → oracle → diffusion. Shows how P(\|11⟩) goes from 0.25 to 1.0
- **Deutsch-Jozsa** — balanced oracle demo with phase kickback explanation
- **Animated timeline** — play/pause/scrub through steps; amplitude bars animate between states
- **Load into builder** — any algorithm step loads into the circuit builder for tinkering
- **Sourced references** — links to Qiskit textbook and Nielsen & Chuang for each key step

### Demo Circuits (Surprise me)

- Bell State |Φ+⟩
- Equal Superposition |+⟩
- GHZ State (3-qubit)
- Phase Kickback (H + T + H)

### Interactive Tour

First-time visitors get a 4-step spotlight tour: circuit builder → Bloch sphere → state panel → AI tutor.

---

## Quantum correctness

All gate unitaries, state-vector evolution, and measurement probabilities are verified by automated tests:

```bash
pnpm test
```

Key verified results:
- H|0⟩ = (|0⟩+|1⟩)/√2 ✓
- H is its own inverse (H² = I) ✓
- Bell state via H⊗CNOT = (|00⟩+|11⟩)/√2 ✓
- Grover's: P(|11⟩) = 1 after one iteration ✓
- Deutsch-Jozsa: q0 = |1⟩ for balanced oracle ✓
- Probability normalization for all circuits ✓

References:
- Nielsen & Chuang, *Quantum Computation and Quantum Information* (Cambridge University Press)
- IBM Qiskit Textbook — [learning.quantum.ibm.com](https://learning.quantum.ibm.com)

---

## Setup

```bash
git clone https://github.com/mayank-xrz/v0-quantum-computing-education
cd v0-quantum-computing-education
pnpm install
cp .env.example .env.local
# Edit .env.local and add your Anthropic API key
pnpm dev
```

Open [http://localhost:3000/playground](http://localhost:3000/playground).

### Environment variables

| Variable | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | Yes (for AI Tutor) | Server-side only. Get at [console.anthropic.com](https://console.anthropic.com). Never exposed to the browser. |

Without `ANTHROPIC_API_KEY`, all features except the AI Tutor work fully.

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router), React 19, TypeScript 5.7 |
| Quantum engine | Custom — `lib/quantum/` (zero dependencies) |
| UI | Tailwind CSS 4, shadcn/ui, Lucide icons |
| AI | Anthropic API (`@anthropic-ai/sdk`), streaming via `ReadableStream` |
| Tests | Vitest |
| Deployment | Vercel |

---

## Architecture

```
lib/quantum/
  complex.ts        — Complex number arithmetic
  state-vector.ts   — 2ⁿ-dimensional state, Born rule, Bloch vector
  gates.ts          — Unitary matrices + single/two-qubit application
  circuit.ts        — Circuit model + simulation engine
  algorithms.ts     — Grover's, Deutsch-Jozsa step definitions + presets
  share.ts          — URL hash encoding/decoding, PNG export

app/
  page.tsx          — Landing page
  playground/       — Main interactive playground
  api/tutor/        — Streaming AI tutor (server-side, key never in browser)

components/
  circuit/          — CircuitBuilder, GatePalette, StateDisplay
  bloch/            — Real Bloch sphere (SVG, state-vector driven)
  tutor/            — QuantumTutor chat (streaming, quiz mode, retry)
  algorithm/        — AlgorithmVisualizer with timeline
  onboarding/       — First-run spotlight tour
```
