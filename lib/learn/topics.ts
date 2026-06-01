export interface TopicSection {
  heading: string
  body: string
  /** Optional inline math for display */
  math?: string
}

export interface Topic {
  slug: string
  title: string
  tagline: string
  difficulty: "Beginner" | "Intermediate" | "Advanced"
  readingMinutes: number
  /** Playground preset to open (matches PRESET_CIRCUITS id) */
  playgroundPreset?: string
  sections: TopicSection[]
}

export const TOPICS: Topic[] = [
  {
    slug: "superposition",
    title: "Superposition",
    tagline: "How a qubit can be 0 and 1 at the same time",
    difficulty: "Beginner",
    readingMinutes: 4,
    playgroundPreset: "superposition",
    sections: [
      {
        heading: "Classical bits vs qubits",
        body: "A classical bit is always either 0 or 1 — like a light switch. A qubit can exist in a superposition: a weighted combination of both states simultaneously. This isn't just uncertainty about which state it's in; the qubit genuinely occupies both states until measured.",
      },
      {
        heading: "The math",
        body: "A qubit state is written as |ψ⟩ = α|0⟩ + β|1⟩ where α and β are complex numbers called amplitudes. The probabilities of measuring 0 or 1 are |α|² and |β|² respectively, and they must sum to 1.",
        math: "|ψ⟩ = α|0⟩ + β|1⟩,  |α|² + |β|² = 1",
      },
      {
        heading: "The Hadamard gate",
        body: "The H gate is the primary tool for creating superposition. Applied to |0⟩, it produces the equal superposition |+⟩ = (|0⟩+|1⟩)/√2 — exactly 50% chance of each outcome. On the Bloch sphere, H rotates the north pole to the equator.",
        math: "H|0⟩ = (|0⟩+|1⟩)/√2 = |+⟩",
      },
      {
        heading: "Measurement collapses the state",
        body: "When you measure a qubit in superposition, it collapses to either |0⟩ or |1⟩ with probabilities |α|² and |β|². The superposition is destroyed — you can't directly observe the amplitudes, only sample from their squared magnitudes.",
      },
      {
        heading: "Why it matters",
        body: "Superposition lets a quantum computer explore many inputs simultaneously. A register of n qubits in superposition represents 2ⁿ values at once. This parallelism is harnessed by quantum algorithms like Grover's search and Shor's factoring.",
      },
    ],
  },
  {
    slug: "entanglement",
    title: "Entanglement",
    tagline: "Correlations that have no classical explanation",
    difficulty: "Beginner",
    readingMinutes: 5,
    playgroundPreset: "bell",
    sections: [
      {
        heading: "What entanglement is",
        body: "Two qubits are entangled when their joint state cannot be written as a product of individual states. Measuring one instantly determines the outcome of measuring the other — no matter how far apart they are.",
      },
      {
        heading: "The Bell state",
        body: "The simplest entangled state is the Bell state |Φ+⟩ = (|00⟩+|11⟩)/√2. This is created by applying H to q0, then CNOT with q0 as control and q1 as target. There is a 50% chance of measuring 00 and 50% chance of 11 — but never 01 or 10.",
        math: "|Φ+⟩ = (|00⟩+|11⟩)/√2",
      },
      {
        heading: "Why it's not just correlation",
        body: "Classical correlations can be explained by shared prior information (hidden variables). Bell's theorem proves entangled states violate Bell inequalities — correlations that no classical system can reproduce. Experiments (Aspect, 2022 Nobel Prize) have confirmed this conclusively.",
      },
      {
        heading: "No faster-than-light communication",
        body: "Entanglement cannot be used to send information faster than light. Measuring your qubit gives a random outcome; the other party's result is correlated but they can't tell without a classical channel. Only after comparing classical results do the correlations become visible.",
      },
      {
        heading: "Applications",
        body: "Entanglement is the resource behind quantum teleportation, superdense coding, quantum key distribution (QKD), and error correction. Without entanglement, quantum computers offer no advantage over classical ones on most tasks.",
      },
    ],
  },
  {
    slug: "quantum-gates",
    title: "Quantum Gates",
    tagline: "The universal building blocks of quantum circuits",
    difficulty: "Beginner",
    readingMinutes: 6,
    sections: [
      {
        heading: "Gates are unitary matrices",
        body: "A quantum gate is a reversible operation on one or more qubits. Mathematically it is a unitary matrix U (U†U = I). Unitarity ensures the total probability always sums to 1 and that every operation can be reversed.",
      },
      {
        heading: "Single-qubit gates",
        body: "The Pauli gates X (NOT/bit-flip), Y (bit+phase flip), Z (phase flip) rotate the Bloch sphere by π around their respective axes. H (Hadamard) rotates by π around the X+Z diagonal. S and T apply π/2 and π/4 phase rotations to |1⟩.",
        math: "X = [[0,1],[1,0]]   Z = [[1,0],[0,-1]]   H = (1/√2)[[1,1],[1,-1]]",
      },
      {
        heading: "Two-qubit gates",
        body: "CNOT (controlled-NOT) flips the target qubit only when the control qubit is |1⟩. CZ applies a phase of −1 to the |11⟩ component. SWAP exchanges two qubits. These gates can create entanglement — single-qubit gates alone cannot.",
      },
      {
        heading: "Universality",
        body: "Any unitary operation on n qubits can be decomposed into single-qubit gates plus CNOT. H+T+CNOT form a universal gate set for quantum computation, meaning they can approximate any quantum algorithm to arbitrary precision.",
      },
      {
        heading: "Parameterized gates",
        body: "Rx(θ), Ry(θ), Rz(θ) rotate by an arbitrary angle θ around each axis. These are essential for variational quantum algorithms (VQE, QAOA) where gate angles are optimized classically in a hybrid loop.",
        math: "Rx(θ) = [[cos(θ/2), -i·sin(θ/2)], [-i·sin(θ/2), cos(θ/2)]]",
      },
    ],
  },
  {
    slug: "measurement",
    title: "Measurement",
    tagline: "How quantum information becomes classical information",
    difficulty: "Beginner",
    readingMinutes: 4,
    sections: [
      {
        heading: "The Born rule",
        body: "Measuring a qubit in state α|0⟩+β|1⟩ yields 0 with probability |α|² and 1 with probability |β|². This is the Born rule — the fundamental link between quantum amplitudes and observable probabilities.",
        math: "P(0) = |α|²,  P(1) = |β|²",
      },
      {
        heading: "Wavefunction collapse",
        body: "After a measurement yielding outcome k, the qubit's state collapses to |k⟩. All other amplitude is destroyed. This is irreversible — the pre-measurement state cannot be recovered from the post-measurement state alone.",
      },
      {
        heading: "Measuring in different bases",
        body: "Measurements can be performed in any orthonormal basis, not just the computational (Z) basis. Measuring in the X basis is equivalent to applying H then measuring in Z. The choice of basis determines which complementary property you observe.",
      },
      {
        heading: "Partial measurement",
        body: "In a multi-qubit system, you can measure a subset of qubits. The remaining qubits collapse to a conditional state based on the outcome. This is how quantum teleportation and error correction work — measuring ancilla qubits extracts information about errors without destroying the data qubit.",
      },
    ],
  },
  {
    slug: "grovers-algorithm",
    title: "Grover's Algorithm",
    tagline: "Quadratic speedup for unstructured search",
    difficulty: "Intermediate",
    readingMinutes: 7,
    playgroundPreset: "grover",
    sections: [
      {
        heading: "The problem",
        body: "Given a list of N items with one marked item, find it. Classically you need O(N) queries on average. Grover's algorithm finds it in O(√N) queries — a quadratic speedup that is provably optimal for quantum search.",
      },
      {
        heading: "Amplitude amplification",
        body: "The algorithm works by preparing a uniform superposition over all N items, then iterating two operations: the oracle (phase-flips the target) and the diffusion operator (inversion about the mean). Each iteration amplifies the target amplitude while suppressing the rest.",
      },
      {
        heading: "The oracle",
        body: "The oracle Uf is a black-box unitary that maps |x⟩|y⟩ → |x⟩|y ⊕ f(x)⟩ where f(x)=1 only for the target. In phase kickback form, applying to the ancilla |−⟩ = (|0⟩−|1⟩)/√2 causes |x⟩ → −|x⟩ for the target and leaves others unchanged.",
      },
      {
        heading: "Number of iterations",
        body: "After ⌊π√N/4⌋ iterations the target amplitude is nearly 1. For N=4 (2 qubits), one iteration suffices. Over-rotating past this point decreases the probability — knowing when to stop is essential.",
        math: "iterations ≈ (π/4)√N",
      },
      {
        heading: "Practical significance",
        body: "Grover's speedup applies to any NP problem where solutions can be verified efficiently — unstructured database search, collision finding, and as a subroutine in larger algorithms. It demonstrates that quantum computers offer provable advantages even without exponential speedup.",
      },
    ],
  },
  {
    slug: "bloch-sphere",
    title: "The Bloch Sphere",
    tagline: "Visualizing a qubit's full state space",
    difficulty: "Intermediate",
    readingMinutes: 5,
    sections: [
      {
        heading: "A geometric picture of a qubit",
        body: "Every pure state of a single qubit corresponds to a point on the surface of the unit sphere, called the Bloch sphere. The north pole is |0⟩, the south pole is |1⟩, and the equator represents equal-weight superpositions with varying phase.",
      },
      {
        heading: "Coordinates",
        body: "Any qubit state can be written |ψ⟩ = cos(θ/2)|0⟩ + e^(iφ)sin(θ/2)|1⟩ where θ ∈ [0,π] is the polar angle and φ ∈ [0,2π) is the azimuthal angle. The Bloch vector is (sin θ cos φ, sin θ sin φ, cos θ).",
        math: "x = sin θ cos φ,  y = sin θ sin φ,  z = cos θ",
      },
      {
        heading: "Gates as rotations",
        body: "Every single-qubit gate is a rotation of the Bloch sphere. X rotates π around the X-axis (north to south). Z rotates π around Z-axis (|+⟩ to |−⟩). H rotates π around the X+Z diagonal. Rx(θ)/Ry(θ)/Rz(θ) rotate by θ around their axes.",
      },
      {
        heading: "Limitation: mixed states",
        body: "The Bloch sphere only represents pure states — states with complete quantum information. Mixed states (arising from noise or entanglement with an environment) live inside the sphere, with the completely mixed state at the center. Entangled qubits have no well-defined Bloch vector individually.",
      },
    ],
  },
  {
    slug: "quantum-teleportation",
    title: "Quantum Teleportation",
    tagline: "Transmitting a qubit state using entanglement + classical bits",
    difficulty: "Advanced",
    readingMinutes: 8,
    sections: [
      {
        heading: "What is teleported",
        body: "Quantum teleportation transmits the quantum state of a qubit from Alice to Bob using one pre-shared Bell pair and 2 classical bits. The qubit itself is not physically moved — the state is reconstructed at Bob's location. The original qubit is destroyed in the process (no-cloning theorem).",
      },
      {
        heading: "The protocol",
        body: "1) Share a Bell pair (one qubit each). 2) Alice applies CNOT then H to her message qubit and Bell qubit. 3) Alice measures both and sends 2 classical bits. 4) Bob applies X if bit 1 is 1, then Z if bit 0 is 1. Bob's qubit is now in Alice's original state.",
      },
      {
        heading: "Why 2 classical bits",
        body: "Alice's measurement has 4 equally likely outcomes (00, 01, 10, 11). Each tells Bob which Pauli correction to apply. Without those 2 classical bits, Bob's qubit is in the maximally mixed state — indistinguishable from noise. This is why teleportation can't exceed light speed.",
      },
      {
        heading: "The no-cloning theorem",
        body: "Quantum mechanics forbids copying an unknown quantum state. This is consistent with teleportation: Alice's qubit is measured (destroyed) and Bob's qubit is created. There is never a moment when two copies of the state coexist.",
      },
      {
        heading: "Applications",
        body: "Teleportation is a primitive for quantum networks, distributed quantum computation, and fault-tolerant architectures (gate teleportation). It has been demonstrated experimentally across optical fibers, free space, and between Earth and a satellite (Micius, 2017).",
      },
    ],
  },
]

export function getTopic(slug: string): Topic | undefined {
  return TOPICS.find((t) => t.slug === slug)
}

export const DIFFICULTY_COLOR = {
  Beginner:     "text-emerald-400 bg-emerald-950/50 border-emerald-800/50",
  Intermediate: "text-yellow-400 bg-yellow-950/50 border-yellow-800/50",
  Advanced:     "text-red-400 bg-red-950/50 border-red-800/50",
} as const
