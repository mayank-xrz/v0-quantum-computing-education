# QuantumLearn

An interactive quantum computing education platform — physically correct circuit simulator, AI-powered tutor, step-by-step algorithm visualizer, and structured learning tracks.

Live: **[quantum-study.vercel.app](https://v0-quantum-computing-education-84le.vercel.app/)**

---

## Standout features

| Feature | What it does |
|---|---|
| **Quantum simulation** | Zero-dependency TypeScript engine: complex amplitudes, Born-rule probabilities, unitary matrices for all gates |
| **Bloch sphere** | Mathematically correct — driven by the live state vector, all 6 poles verified by tests |
| **AI Quantum Tutor** | Circuit-aware: every answer is grounded in your actual gates, state vector, and probabilities |
| **Algorithm visualizer** | Grover's search and Deutsch-Jozsa with animated, scrubable timelines |
| **Teleportation visualizer** | 5-step protocol with entanglement correlation heatmaps |
| **Daily puzzle** | Fidelity-based verification, streak tracker (localStorage), shareable results |
| **Qiskit export** | One click to generate valid Qiskit 1.x Python for any circuit |
| **Share links** | Circuit encodes losslessly to URL hash — paste the link to share |
| **Learn section** | 7 structured topic pages (Beginner → Advanced), statically prerendered |
| **99 automated tests** | Every gate matrix, Bell state, Grover's convergence, Deutsch-Jozsa, teleportation, fidelity |

---

## Pages

| Route | Description |
|---|---|
| `/` | Landing page with live animated Bloch sphere |
| `/playground` | Circuit builder + Bloch sphere + state display |
| `/playground/tutor` | AI Quantum Tutor (circuit-aware, streaming, quiz mode) |
| `/playground/algorithms` | Grover's, Deutsch-Jozsa, and quantum teleportation visualizers |
| `/playground/puzzle` | Daily puzzle with fidelity meter and streak tracking |
| `/learn` | Topic index (7 lessons) |
| `/learn/[topic]` | Individual lesson pages with math blocks and prev/next navigation |

---

## Setup

```bash
git clone https://github.com/mayank-xrz/v0-quantum-computing-education
cd v0-quantum-computing-education
pnpm install
cp .env.example .env.local   # or create .env.local manually
```

Add your Anthropic API key to `.env.local`:

```
ANTHROPIC_API_KEY=sk-ant-...
```

```bash
pnpm dev        # http://localhost:3000
pnpm build      # production build
pnpm test       # 99 automated tests
```

> **Without `ANTHROPIC_API_KEY`** — all features except the AI Tutor work fully (the tutor returns a clear error message instead of a blank screen).

---

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | For AI Tutor | **Server-side only** — never exposed to the browser. Get one at [console.anthropic.com](https://console.anthropic.com). |

---

## Quantum correctness

All gate unitaries, state-vector evolution, and measurement probabilities are verified by 99 automated tests.

```bash
pnpm test
```

Key verified results:

- H|0⟩ = (|0⟩+|1⟩)/√2 ✓
- H² = I (Hadamard is its own inverse) ✓
- Bell state (H⊗CNOT)|00⟩ = (|00⟩+|11⟩)/√2 ✓
- Bloch sphere: all 6 poles (±X, ±Y, ±Z), unit-length invariant ✓
- Y gate: Y|0⟩ = i|1⟩, Bloch vector at south pole (global phase invariant) ✓
- Grover's: P(|11⟩) = 1 after one iteration on 2-qubit target ✓
- Deutsch-Jozsa: q0 = |1⟩ for balanced oracle ✓
- Teleportation: probabilities sum to 1 at every step ✓
- Fidelity: |⟨ψ|ψ⟩|² = 1, orthogonal states = 0 ✓

References:
- Nielsen & Chuang, *Quantum Computation and Quantum Information*
- IBM Qiskit Textbook — [learning.quantum.ibm.com](https://learning.quantum.ibm.com)

---

## Demo circuits

Open the playground and click **Demo** to load:

| Circuit | What it demonstrates |
|---|---|
| Bell State |Φ+⟩ | Maximal entanglement between 2 qubits |
| Equal Superposition |+⟩ | H gate, 50/50 measurement probability |
| GHZ State (3-qubit) | Multi-qubit entanglement |
| Phase Kickback | H + T + H phase interference |

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript 5.7 |
| Quantum engine | Custom — `lib/quantum/` (zero dependencies, pure TS) |
| UI | Tailwind CSS 4, shadcn/ui (new-york), Lucide icons |
| AI | `@anthropic-ai/sdk`, streaming via `ReadableStream` (server-side) |
| Tests | Vitest 4 |
| Deployment | Netlify (`@netlify/plugin-nextjs`) |

---

## Architecture

```
lib/quantum/
  complex.ts          — Immutable complex number arithmetic
  state-vector.ts     — 2ⁿ state, Born rule, Bloch vector (all 6 poles verified)
  gates.ts            — All gate matrices + single/two-qubit application
  circuit.ts          — Circuit model + simulation engine
  algorithms.ts       — Grover's, Deutsch-Jozsa, preset circuits
  teleportation.ts    — 5-step teleportation with joint marginals
  qiskit-export.ts    — Qiskit 1.x Python code generation
  puzzle.ts           — Daily puzzle pool, fidelity check, streak storage
  share.ts            — URL hash encoding + PNG export
  __tests__/          — 99 tests covering all of the above

lib/learn/
  topics.ts           — 7 structured topic definitions

app/
  page.tsx            — Landing page with live Bloch sphere
  playground/         — Multi-page playground (layout + 4 sub-routes)
  learn/              — Static topic index + 7 SSG topic pages
  api/tutor/          — Streaming AI tutor (server-only, key never in browser)
  not-found.tsx       — Custom 404 page

components/
  circuit/            — CircuitBuilder, GatePalette, StateDisplay, QiskitExportModal
  bloch/              — Real Bloch sphere (SVG, state-vector driven)
  tutor/              — QuantumTutor (streaming, quiz mode, 45s timeout, retry)
  algorithm/          — AlgorithmVisualizer, TeleportVisualizer
  puzzle/             — DailyPuzzle (fidelity meter, streak, share)
  onboarding/         — First-run spotlight tour
  ErrorBoundary.tsx   — Class-based boundary wrapping each major panel
```
