/**
 * Quantum teleportation walkthrough.
 *
 * Circuit uses 3 qubits (big-endian, left = highest index):
 *   q0 = Alice's message qubit (initialized to |+⟩ = H|0⟩)
 *   q1 = Alice's half of the shared Bell pair
 *   q2 = Bob's half of the shared Bell pair
 *
 * Protocol:
 *   Step 0 – All qubits |000⟩
 *   Step 1 – Prepare message: H on q0 → q0 in |+⟩
 *   Step 2 – Create Bell pair: H on q1, CNOT q1→q2
 *   Step 3 – Alice's encoding: CNOT q0→q1, then H on q0
 *   Step 4 – Alice measures (classically); Bob receives corrections
 *             (in circuit form: CNOT q1→q2, CZ q0→q2)
 *   Step 5 – Bob's qubit q2 now holds |+⟩ — teleportation complete
 *
 * The circuit corrections in step 4 implement the classical feedforward
 * deterministically for simulation purposes: CNOT on q2 conditioned on q1,
 * and Z on q2 conditioned on q0.  This is equivalent to applying the
 * corrections for every measurement branch simultaneously, which keeps the
 * full state vector tractable without simulating actual classical bits.
 */

import type { CircuitGate, CircuitState } from "./circuit"
import { simulateCircuit } from "./circuit"
import type { StateVector } from "./state-vector"

export interface TeleportStep {
  label: string
  subtitle: string
  explanation: string
  insight: string
  gates: CircuitGate[]
}

export const TELEPORT_STEPS: TeleportStep[] = [
  {
    label: "Initial state",
    subtitle: "|000⟩",
    explanation:
      "All three qubits start in |0⟩. " +
      "q0 is Alice's message qubit, q1 and q2 are the shared entangled pair.",
    insight:
      "Teleportation requires a pre-shared entangled pair (Bell state) between " +
      "Alice (q1) and Bob (q2). This pair is the 'quantum channel'.",
    gates: [],
  },
  {
    label: "Prepare message qubit",
    subtitle: "H on q0 → |+⟩",
    explanation:
      "Alice wants to teleport the state |+⟩ = (|0⟩+|1⟩)/√2. " +
      "She applies H to her message qubit q0.",
    insight:
      "Any single-qubit state α|0⟩+β|1⟩ can be teleported. We use |+⟩ because " +
      "it's a rich superposition — easy to verify and visually striking.",
    gates: [
      { id: "t-h0", gateId: "H", qubit: 0, column: 0 },
    ],
  },
  {
    label: "Create Bell pair",
    subtitle: "H+CNOT on q1,q2",
    explanation:
      "Alice applies H to q1, then CNOT with q1 as control and q2 as target. " +
      "This entangles q1 and q2 into the Bell state |Φ+⟩ = (|00⟩+|11⟩)/√2.",
    insight:
      "The Bell pair is the 'quantum telephone wire'. Once created, measuring q1 " +
      "instantly determines the state of q2 — even at any distance. " +
      "Alice keeps q1, Bob takes q2.",
    gates: [
      { id: "t-h0",  gateId: "H",    qubit: 0,                column: 0 },
      { id: "t-h1",  gateId: "H",    qubit: 1,                column: 1 },
      { id: "t-c12", gateId: "CNOT", qubit: 1, targetQubit: 2, column: 2 },
    ],
  },
  {
    label: "Alice's encoding",
    subtitle: "CNOT q0→q1, then H on q0",
    explanation:
      "Alice applies CNOT with her message qubit (q0) controlling q1, " +
      "then Hadamard on q0. This entangles the message qubit with the Bell pair.",
    insight:
      "After this step the full 3-qubit state is:\n" +
      "½(|00⟩|+⟩ + |01⟩X|+⟩ + |10⟩Z|+⟩ + |11⟩XZ|+⟩)\n" +
      "— Bob's qubit q2 already 'contains' the message, waiting for classical bits to unlock it.",
    gates: [
      { id: "t-h0",   gateId: "H",    qubit: 0,                column: 0 },
      { id: "t-h1",   gateId: "H",    qubit: 1,                column: 1 },
      { id: "t-c12",  gateId: "CNOT", qubit: 1, targetQubit: 2, column: 2 },
      { id: "t-c01",  gateId: "CNOT", qubit: 0, targetQubit: 1, column: 3 },
      { id: "t-h0b",  gateId: "H",    qubit: 0,                column: 4 },
    ],
  },
  {
    label: "Bob's corrections",
    subtitle: "CNOT q1→q2, CZ q0→q2",
    explanation:
      "Bob applies CNOT conditioned on q1, then CZ conditioned on q0. " +
      "These implement the classical feedforward corrections for all measurement branches simultaneously.",
    insight:
      "No information travels faster than light: the corrections require 2 classical bits " +
      "(Alice's measurement results) sent over a normal channel. " +
      "Without them Bob has a random-looking mixed state — the quantum channel alone reveals nothing.",
    gates: [
      { id: "t-h0",   gateId: "H",    qubit: 0,                column: 0 },
      { id: "t-h1",   gateId: "H",    qubit: 1,                column: 1 },
      { id: "t-c12",  gateId: "CNOT", qubit: 1, targetQubit: 2, column: 2 },
      { id: "t-c01",  gateId: "CNOT", qubit: 0, targetQubit: 1, column: 3 },
      { id: "t-h0b",  gateId: "H",    qubit: 0,                column: 4 },
      { id: "t-cx12", gateId: "CNOT", qubit: 1, targetQubit: 2, column: 5 },
      { id: "t-cz02", gateId: "CZ",   qubit: 0, targetQubit: 2, column: 6 },
    ],
  },
]

export interface TeleportSnapshot {
  step: TeleportStep
  stateVector: StateVector
  probabilities: number[]
  /** 4-element joint probs for (q0,q1): P(00), P(01), P(10), P(11) */
  q0q1Joint: number[]
  /** 4-element joint probs for (q1,q2): P(00), P(01), P(10), P(11) */
  q1q2Joint: number[]
}

export function buildTeleportSnapshots(): TeleportSnapshot[] {
  return TELEPORT_STEPS.map((step) => {
    const circuit: CircuitState = { numQubits: 3, gates: step.gates }
    const result = simulateCircuit(circuit)
    const probs = result.probabilities  // 8-element P(q0q1q2)

    // Marginalise to get 2-qubit joint distributions
    // In our big-endian encoding: index = q0*4 + q1*2 + q2
    const q0q1Joint = [0, 0, 0, 0]  // [P(00), P(01), P(10), P(11)]
    const q1q2Joint = [0, 0, 0, 0]

    for (let i = 0; i < 8; i++) {
      const q0 = (i >> 2) & 1
      const q1 = (i >> 1) & 1
      const q2 = i & 1
      q0q1Joint[q0 * 2 + q1] += probs[i]
      q1q2Joint[q1 * 2 + q2] += probs[i]
    }

    return {
      step,
      stateVector: result.stateVector,
      probabilities: probs,
      q0q1Joint,
      q1q2Joint,
    }
  })
}
