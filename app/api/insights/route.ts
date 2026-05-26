import { NextRequest, NextResponse } from "next/server"

interface InsightFigure {
  label: string
  value: string
  unit: string
  color: string
}

interface Insight {
  id: string
  section: string
  category: string
  categoryColor: string
  icon: string
  title: string
  summary: string
  bullets: string[]
  sourceOrg: string
  year: number
  expanded: {
    context: string
    figures: InsightFigure[]
    implication: string
    tags: string[]
  }
}

const INSIGHTS: Insight[] = [
  // ── HOW IT WORKS ──────────────────────────────────────────────────────────
  {
    id: "hw-supremacy",
    section: "how-it-works",
    category: "Milestone",
    categoryColor: "#a78bfa",
    icon: "award",
    title: "Quantum Computational Advantage",
    summary:
      "Google's Sycamore completed a task in 200 seconds estimated at 10,000 years classically.",
    bullets: [
      "53 superconducting qubits, 86 two-qubit gates, published Nature Oct 2019",
      "IBM disputed with 2.5-day classical estimate — still a dramatic quantum speedup",
    ],
    sourceOrg: "Google AI / Nature",
    year: 2019,
    expanded: {
      context:
        "In October 2019, Google published a landmark Nature paper showing their Sycamore processor performed random circuit sampling in 200 seconds. Their classical estimate using Summit — then the world's fastest supercomputer — placed the same computation at ~10,000 years. IBM countered with a 2.5-day estimate using optimized storage techniques, but even that gap represents a decisive quantum advantage for this specific task.",
      figures: [
        { label: "Qubits", value: "53", unit: "superconducting", color: "#a78bfa" },
        { label: "Quantum time", value: "200", unit: "seconds", color: "#60a5fa" },
        { label: "Classical est.", value: "10K", unit: "years", color: "#f472b6" },
      ],
      implication:
        "This experiment opened the 'quantum advantage' era — proof that specialized quantum hardware can outperform classical machines on at least one task. The race is now to find useful, not contrived, problems where this holds.",
      tags: ["Sycamore", "Random Circuit Sampling", "Nature 2019", "Quantum Advantage"],
    },
  },
  {
    id: "hw-volume",
    section: "how-it-works",
    category: "Hardware",
    categoryColor: "#60a5fa",
    icon: "cpu",
    title: "Quantum Volume: A Holistic Metric",
    summary:
      "IBM's Quantum Volume benchmark measures gate fidelity, coherence, and connectivity together. Eagle hit QV 512 in 2022.",
    bullets: [
      "127-qubit Eagle — first processor to break the 100-qubit barrier",
      "Heavy-hex connectivity reduces cross-qubit crosstalk noise",
    ],
    sourceOrg: "IBM Quantum",
    year: 2022,
    expanded: {
      context:
        "Qubit count alone is misleading. IBM introduced Quantum Volume (QV) in 2019 to holistically capture fidelity, qubit connectivity, and coherence together. QV 512 — achieved on the 127-qubit Eagle in 2022 — requires every circuit of width and depth 9 to succeed with >2/3 probability, demanding all physical properties improve simultaneously. Eagle's heavy-hex layout limits each qubit to at most 3 neighbors, dramatically reducing unwanted ZZ coupling.",
      figures: [
        { label: "Qubits", value: "127", unit: "Eagle processor", color: "#60a5fa" },
        { label: "Quantum Volume", value: "512", unit: "QV score", color: "#a78bfa" },
        { label: "2-qubit fidelity", value: "99.5%", unit: "best gates", color: "#34d399" },
      ],
      implication:
        "QV shifted the industry from chasing qubit counts to chasing system quality. A QV-512 machine can execute meaningfully deeper circuits than a 1000-qubit machine with poor fidelity — critical for real algorithm performance.",
      tags: ["IBM Eagle", "Quantum Volume", "Heavy-Hex", "Benchmarking"],
    },
  },
  {
    id: "hw-fidelity",
    section: "how-it-works",
    category: "Fidelity Record",
    categoryColor: "#f472b6",
    icon: "target",
    title: "99.9% Two-Qubit Gate Fidelity",
    summary:
      "Quantinuum's H2 trapped-ion processor achieved 99.9% two-qubit fidelity — the threshold needed for practical error correction.",
    bullets: [
      "32 fully-connected ytterbium-171 ion qubits with all-to-all connectivity",
      "Fidelity sufficient to run Shor's algorithm on non-trivial input sizes",
    ],
    sourceOrg: "Quantinuum",
    year: 2023,
    expanded: {
      context:
        "In 2023, Quantinuum demonstrated two-qubit gate fidelity exceeding 99.9% on their H2 system — critical because surface code error correction only suppresses logical errors when physical error rates are below ~1%. Trapped ions achieve this through precise laser pulses on individual ytterbium ions held in electromagnetic traps. All-to-all connectivity eliminates the need for expensive SWAP gates required on nearest-neighbor superconducting chips.",
      figures: [
        { label: "Gate fidelity", value: "99.9%", unit: "two-qubit", color: "#f472b6" },
        { label: "Qubits (all-to-all)", value: "32", unit: "H2 processor", color: "#a78bfa" },
        { label: "Circuit depth", value: "~1000", unit: "gates achievable", color: "#60a5fa" },
      ],
      implication:
        "At 99.9% fidelity, fault-tolerant logical qubits become viable without astronomical overhead. This threshold makes Quantinuum systems capable of running fault-tolerant demonstrations and circuits deep enough for meaningful algorithmic experiments.",
      tags: ["Trapped Ions", "H2 Processor", "Gate Fidelity", "Quantinuum 2023"],
    },
  },
  {
    id: "hw-coherence",
    section: "how-it-works",
    category: "Physics",
    categoryColor: "#34d399",
    icon: "atom",
    title: "500× Coherence Time Improvement",
    summary:
      "Superconducting T₂ coherence times grew from ~1μs (2010) to 500+μs (2023) — a 500-fold gain driven by materials science.",
    bullets: [
      "Fluxonium qubits demonstrated T₂ > 1ms in research settings",
      "Better Josephson junction fabrication and substrate preparation key drivers",
    ],
    sourceOrg: "Physical Review Applied / Various",
    year: 2023,
    expanded: {
      context:
        "Coherence time — how long a qubit maintains its quantum state — directly determines circuit depth. In 2010, superconducting qubits had T₂ times of ~1 microsecond. By 2023, leading labs demonstrated T₂ > 500 microseconds in transmon qubits, and over 1 millisecond in fluxonium designs. The gains came from cleaner Josephson junction interfaces, sapphire/silicon substrates with lower two-level-system noise, and improved electromagnetic shielding.",
      figures: [
        { label: "T₂ circa 2010", value: "~1", unit: "microsecond", color: "#6b7280" },
        { label: "T₂ circa 2023", value: "500+", unit: "microseconds", color: "#34d399" },
        { label: "Total improvement", value: "500×", unit: "over 13 years", color: "#a78bfa" },
      ],
      implication:
        "With 500μs coherence and ~50ns gate times, today's best qubits can execute ~10,000 sequential gates before decoherence — enough for meaningful NISQ algorithms and early error-corrected demonstrations.",
      tags: ["Coherence Time", "Fluxonium", "Transmon", "Materials Science"],
    },
  },

  // ── CHALLENGES ────────────────────────────────────────────────────────────
  {
    id: "ch-threshold",
    section: "challenges",
    category: "Error Rates",
    categoryColor: "#f87171",
    icon: "alert-triangle",
    title: "Crossing the Error Correction Threshold",
    summary:
      "Google's 2023 Nature paper demonstrated the first clear experimental proof that surface code error rates decrease exponentially as qubit distance scales up.",
    bullets: [
      "Distance-5 surface code: logical error rate 100× better than best physical qubit",
      "Requires ~1,000 physical qubits per logical qubit at useful code distances",
    ],
    sourceOrg: "Nature / Google",
    year: 2023,
    expanded: {
      context:
        "The threshold theorem predicted for decades that if physical error rates stay below ~1%, adding more qubits in a surface code exponentially suppresses logical errors. In 2023, Google experimentally confirmed this: scaling from distance-3 to distance-5 to distance-7 surface codes, each step halved the logical error rate. Their distance-5 code achieved a logical error rate 100× below that of individual physical qubits — the first clear demonstration the theory holds in practice.",
      figures: [
        { label: "Surface code threshold", value: "~1%", unit: "physical error rate", color: "#fbbf24" },
        { label: "Best physical 2-qubit err", value: "0.15%", unit: "(below threshold)", color: "#34d399" },
        { label: "Physical per logical", value: "~1K", unit: "qubits at dist. 25", color: "#f87171" },
      ],
      implication:
        "This was the first concrete proof that fault-tolerant quantum computing is physically achievable, not just theoretically sound. The challenge now is reducing the 1,000:1 overhead with better codes (Floquet, LDPC) and lower physical error rates.",
      tags: ["Surface Code", "Threshold Theorem", "Google 2023", "Fault Tolerance"],
    },
  },
  {
    id: "ch-cryo",
    section: "challenges",
    category: "Infrastructure",
    categoryColor: "#60a5fa",
    icon: "cpu",
    title: "Operating 180× Colder Than Deep Space",
    summary:
      "Superconducting quantum processors run at 15 millikelvin — colder than the cosmic microwave background — creating massive infrastructure and scalability barriers.",
    bullets: [
      "Dilution refrigerators cost $500K–$2M and take 2–3 weeks to reach base temperature",
      "Entire computing racks must fit inside a fridge roughly the size of a car",
    ],
    sourceOrg: "Various Hardware Vendors",
    year: 2024,
    expanded: {
      context:
        "Superconducting qubits exploit the zero-resistance state of aluminum and niobium, which only exists below ~100 mK. To ensure thermal noise doesn't disrupt qubit states, systems are cooled to 15 millikelvin — well below the 2.7 K cosmic microwave background. Dilution refrigerators accomplish this via helium-3/helium-4 mixing cycles, but each unit is large, expensive, and slow to cool. Every control wire entering the fridge introduces heat, limiting how many qubits can be connected to room-temperature electronics.",
      figures: [
        { label: "Operating temp", value: "15", unit: "millikelvin", color: "#60a5fa" },
        { label: "CMB temperature", value: "2,700", unit: "millikelvin (contrast)", color: "#a78bfa" },
        { label: "Fridge cost", value: "$1M+", unit: "per system", color: "#f87171" },
      ],
      implication:
        "Cryogenic requirements fundamentally limit miniaturization and deployment. Scaling to millions of qubits will require cryo-CMOS control chips inside the fridge, revolutionary thermal management, or a shift to room-temperature qubit platforms like trapped ions or neutral atoms.",
      tags: ["Dilution Refrigerator", "Superconducting", "15mK", "Scalability"],
    },
  },
  {
    id: "ch-harvest",
    section: "challenges",
    category: "Security Threat",
    categoryColor: "#fbbf24",
    icon: "shield",
    title: "Harvest Now, Decrypt Later",
    summary:
      "Nation-state actors are already collecting today's encrypted internet traffic, planning to decrypt it once fault-tolerant quantum computers exist. NIST finalized post-quantum standards in 2024.",
    bullets: [
      "RSA-2048 and ECC are fully vulnerable to Shor's algorithm at scale",
      "NIST standardized ML-KEM (Kyber) and ML-DSA (Dilithium) as quantum-safe replacements",
    ],
    sourceOrg: "NIST / NSA",
    year: 2024,
    expanded: {
      context:
        "The 'harvest now, decrypt later' threat is active: intelligence agencies and nation-states are storing intercepted encrypted communications today, waiting for a cryptographically-relevant quantum computer to retroactively break them. In response, NIST ran an 8-year post-quantum cryptography competition, finalizing four standards in 2024: ML-KEM (CRYSTALS-Kyber) for key encapsulation, and ML-DSA (CRYSTALS-Dilithium), FALCON, and SPHINCS+ for digital signatures. The NSA instructed US agencies to begin migration immediately.",
      figures: [
        { label: "Qubits to break RSA-2048", value: "20M+", unit: "physical qubits", color: "#f87171" },
        { label: "NIST PQC finalized", value: "2024", unit: "ML-KEM + ML-DSA", color: "#fbbf24" },
        { label: "US gov migration", value: "2035", unit: "deadline (agencies)", color: "#60a5fa" },
      ],
      implication:
        "Organizations with long-lived sensitive data — healthcare records, government documents, financial contracts — must start post-quantum migration now. ML-KEM adds only ~1–5% performance overhead over elliptic curve, making immediate adoption practical.",
      tags: ["Post-Quantum Crypto", "ML-KEM", "NIST PQC", "Shor's Algorithm"],
    },
  },
  {
    id: "ch-magic",
    section: "challenges",
    category: "Error Correction",
    categoryColor: "#c084fc",
    icon: "refresh-cw",
    title: "The Magic State Distillation Tax",
    summary:
      "Fault-tolerant quantum computation requires 'magic states' for T gates. Distilling these consumes 90%+ of physical qubits — inflating hardware requirements to 20M+ qubits for RSA factoring.",
    bullets: [
      "T gate factories dominate resource estimates for all practical quantum algorithms",
      "Magic state distillation is the single largest unsolved engineering bottleneck",
    ],
    sourceOrg: "Physical Review Letters / Various",
    year: 2023,
    expanded: {
      context:
        "Clifford gates (H, CNOT, S) can be applied fault-tolerantly with modest overhead. But the T gate — essential for universal computation — cannot be directly transversal in surface codes. Instead, you must first prepare 'magic states' (|T⟩ = T|+⟩) via noisy injection, then distill them to high fidelity through iterative error-correcting circuits. Studies consistently find that >90% of all physical qubits in a fault-tolerant computer are dedicated to this distillation factory, not to the actual computation.",
      figures: [
        { label: "Qubits for Shor (RSA-2048)", value: "20M", unit: "physical qubits est.", color: "#c084fc" },
        { label: "Magic factory share", value: "~90%", unit: "of total qubits", color: "#f87171" },
        { label: "Best chip today", value: "~1K", unit: "qubits (2024)", color: "#60a5fa" },
      ],
      implication:
        "Magic state distillation is why large-scale quantum advantage is still years away. Research into alternative fault-tolerant codes — hypergraph product codes, Floquet codes, and Majorana-based topological approaches — aims to reduce this overhead dramatically.",
      tags: ["Magic State", "T Gate", "Fault Tolerance", "Resource Estimation"],
    },
  },

  // ── BENEFITS ──────────────────────────────────────────────────────────────
  {
    id: "bn-chemistry",
    section: "benefits",
    category: "Drug Discovery",
    categoryColor: "#34d399",
    icon: "flask-conical",
    title: "Quantum Chemistry: Simulating Molecules",
    summary:
      "VQE has demonstrated ground-state energy calculations for 12-qubit molecules. Classical simulation of 50+ electron systems is provably intractable.",
    bullets: [
      "Roche, Merck, and Pfizer have active quantum-chemistry partnerships",
      "Lithium hydride and beryllium hydride demonstrated on real quantum hardware",
    ],
    sourceOrg: "Nature Chemistry / IBM",
    year: 2023,
    expanded: {
      context:
        "Feynman's original vision was simulating quantum systems with quantum computers. VQE — a hybrid quantum-classical algorithm — has demonstrated accurate ground-state energy calculations for small molecules (H₂, LiH, BeH₂) on 6–12 qubit systems. For 50+ electron molecules — the scale needed for novel drug targets — classical supercomputers would require memory exceeding the number of atoms in the observable universe. Major pharmaceutical companies now have partnerships with IBM, Google, and quantum startups to explore this frontier.",
      figures: [
        { label: "Classical intractability", value: "50+", unit: "electron systems", color: "#34d399" },
        { label: "Active pharma partnerships", value: "20+", unit: "companies", color: "#60a5fa" },
        { label: "VQE accuracy (small mol.)", value: "±1%", unit: "chemical accuracy", color: "#fbbf24" },
      ],
      implication:
        "When quantum computers reach ~100 logical qubits with high gate fidelity, they could simulate molecular systems no classical computer can — potentially compressing drug discovery timelines from 15 years to under 5, and discovering room-temperature superconductors and better battery materials.",
      tags: ["VQE", "Drug Discovery", "Molecular Simulation", "Quantum Chemistry"],
    },
  },
  {
    id: "bn-finance",
    section: "benefits",
    category: "Optimization",
    categoryColor: "#22d3ee",
    icon: "trending-up",
    title: "Quantum Monte Carlo in Finance",
    summary:
      "JP Morgan demonstrated quantum amplitude estimation can deliver a quadratic speedup for Monte Carlo option pricing. Goldman Sachs runs live quantum risk experiments.",
    bullets: [
      "Quadratic speedup over classical Monte Carlo for derivative pricing (QAE)",
      "Goldman Sachs and Barclays actively testing quantum portfolio optimization",
    ],
    sourceOrg: "JP Morgan / Goldman Sachs",
    year: 2023,
    expanded: {
      context:
        "Finance involves massive Monte Carlo simulations run millions of times daily to price derivatives, assess risk, and optimize portfolios. JP Morgan's research team demonstrated that Quantum Amplitude Estimation (QAE) achieves a provable quadratic speedup over classical Monte Carlo — reducing sample complexity from O(ε⁻²) to O(ε⁻¹). Goldman Sachs has run live experiments on IBM Quantum systems for risk analysis. QAOA has been demonstrated on 40+ qubit systems for portfolio optimization, with promising early results.",
      figures: [
        { label: "Monte Carlo speedup", value: "√N", unit: "via QAE (quadratic)", color: "#22d3ee" },
        { label: "Industry QC investment", value: "$1B+", unit: "financial sector", color: "#fbbf24" },
        { label: "QAOA qubits tested", value: "40+", unit: "optimization", color: "#a78bfa" },
      ],
      implication:
        "A quadratic speedup in Monte Carlo simulation could unlock real-time complex derivatives pricing, transforming global risk management. Even a 10× speedup on hard optimization problems would give early adopters a structural edge in portfolio construction.",
      tags: ["QAOA", "Monte Carlo", "Quantum Finance", "QAE"],
    },
  },
  {
    id: "bn-pqc",
    section: "benefits",
    category: "Cryptography",
    categoryColor: "#fbbf24",
    icon: "shield",
    title: "Post-Quantum TLS Already Deployed",
    summary:
      "NIST's 2024 PQC standards are live in production: Cloudflare and Chrome have enabled hybrid post-quantum TLS, protecting ~10% of global HTTPS traffic.",
    bullets: [
      "Chrome enabled X25519Kyber768 hybrid key exchange protecting billions of connections",
      "ML-KEM adds only 1–5% performance overhead vs elliptic curve schemes",
    ],
    sourceOrg: "NIST / Google / Cloudflare",
    year: 2024,
    expanded: {
      context:
        "Post-quantum cryptography is not a future concern — deployment is underway. Google Chrome enabled X25519Kyber768 hybrid key exchange in 2023, combining classical ECDH with ML-KEM for defense-in-depth. Cloudflare rolled out post-quantum TLS across its global network. NIST's finalized algorithms — ML-KEM (key encapsulation) and ML-DSA (signatures) — are based on the hardness of lattice problems believed resistant to both quantum and classical attacks, following an 8-year competition that reviewed 82 submissions.",
      figures: [
        { label: "HTTPS traffic protected", value: "~10%", unit: "post-quantum (Chrome)", color: "#fbbf24" },
        { label: "PQC submissions reviewed", value: "82", unit: "over 8 years", color: "#60a5fa" },
        { label: "Performance overhead", value: "1–5%", unit: "vs ECC", color: "#34d399" },
      ],
      implication:
        "Organizations handling sensitive long-lived data must begin migration now. The performance cost of ML-KEM is negligible — the risk cost of delay is not. Hybrid schemes (classical + post-quantum) allow safe transition without breaking compatibility.",
      tags: ["ML-KEM", "Post-Quantum TLS", "Cloudflare", "CRYSTALS-Kyber"],
    },
  },
  {
    id: "bn-ml",
    section: "benefits",
    category: "AI / ML",
    categoryColor: "#818cf8",
    icon: "sparkles",
    title: "Quantum Kernel Methods",
    summary:
      "IBM Research demonstrated quantum kernels provide provable exponential representational advantage over classical kernels on specific structured datasets.",
    bullets: [
      "Quantum SVMs demonstrated on datasets where classical kernel methods provably fail",
      "500+ quantum ML papers published on arXiv in 2023 alone",
    ],
    sourceOrg: "IBM Research / Nature",
    year: 2023,
    expanded: {
      context:
        "Quantum ML research has matured from hype into careful theoretical analysis. IBM Research demonstrated that quantum feature maps — circuits that embed classical data into exponentially large Hilbert spaces — can provide provable exponential separation from classical kernel methods on certain structured datasets. The key challenge is finding real-world data that naturally exhibits this structure. Nature published a landmark 2021 analysis mapping both the promise and the limitations: quantum kernels don't universally win, but for specific data distributions (cryptographic, quantum-generated, sparse high-dimensional), they offer genuine advantage.",
      figures: [
        { label: "Feature space", value: "2ⁿ", unit: "vs classical polynomial", color: "#818cf8" },
        { label: "Speedup on target data", value: "Exp", unit: "over classical SVM", color: "#a78bfa" },
        { label: "QML papers (2023)", value: "500+", unit: "arXiv publications", color: "#60a5fa" },
      ],
      implication:
        "Quantum ML is not universally faster — noise and data-loading costs often negate advantages. But for specific structured data and quantum-native tasks (simulating quantum systems, quantum chemistry ML), kernel methods offer genuine exponential advantage that grows with qubit count.",
      tags: ["Quantum Kernels", "QSVM", "Feature Maps", "Quantum ML"],
    },
  },
]

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const section = searchParams.get("section") as
    | "how-it-works"
    | "challenges"
    | "benefits"
    | null

  await new Promise((r) => setTimeout(r, 300))

  const insights = section
    ? INSIGHTS.filter((insight) => insight.section === section)
    : INSIGHTS

  return NextResponse.json({
    insights,
    fetchedAt: new Date().toISOString(),
  })
}
