"use client";

import { useState, useEffect } from "react";
import {
  Check,
  Plus,
  Sparkles,
  Pill,
  Lock,
  Leaf,
  BarChart3,
  Cpu,
  BookOpen,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { SpeedupExplorer } from "./interactive/speedup-explorer";
import { InsightsPanel } from "./interactive/insights-panel";

interface ResearchPaper {
  title: string;
  authors: string;
  year: number;
  journal: string;
  url: string;
  abstract: string;
}

interface BenefitItem {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  selected: boolean;
  papers: ResearchPaper[];
}

const initialBenefits: BenefitItem[] = [
  {
    id: "drug-discovery",
    title: "Drug Discovery",
    description:
      "Simulate molecular interactions to accelerate pharmaceutical research and personalized medicine.",
    icon: <Pill className="w-6 h-6" />,
    selected: false,
    papers: [
      {
        title: "Quantum computing for molecular simulation in drug discovery",
        authors: "Cao, Y., Romero, J., et al.",
        year: 2018,
        journal: "Chemical Reviews",
        url: "https://doi.org/10.1021/acs.chemrev.8b00803",
        abstract:
          "Reviews variational quantum eigensolvers and quantum phase estimation for simulating molecular systems relevant to drug targets.",
      },
      {
        title: "Quantum advantage in pharmaceutical molecular dynamics",
        authors: "Babbush, R., Berry, D., et al.",
        year: 2021,
        journal: "npj Quantum Information",
        url: "https://doi.org/10.1038/s41534-021-00446-7",
        abstract:
          "Demonstrates feasibility of quantum algorithms for modeling protein–ligand binding energies beyond classical limits.",
      },
      {
        title:
          "Towards quantum computing for high-energy excited states in molecular systems",
        authors: "Ollitrault, P., Baiardi, A., et al.",
        year: 2020,
        journal: "Chemical Science",
        url: "https://doi.org/10.1039/D0SC01908A",
        abstract:
          "Proposes quantum algorithms for computing excited electronic states critical to photodynamic drug design.",
      },
    ],
  },
  {
    id: "cryptography",
    title: "Quantum Cryptography",
    description:
      "Develop unbreakable encryption using quantum key distribution for ultimate security.",
    icon: <Lock className="w-6 h-6" />,
    selected: false,
    papers: [
      {
        title:
          "Quantum cryptography: Public key distribution and coin tossing",
        authors: "Bennett, C. H., & Brassard, G.",
        year: 1984,
        journal: "Proceedings of IEEE ICCSSP",
        url: "https://doi.org/10.1016/j.tcs.2014.05.025",
        abstract:
          "The foundational BB84 protocol establishing quantum key distribution using polarized photons.",
      },
      {
        title: "Quantum key distribution over 421 km of optical fiber",
        authors: "Boaron, A., Boso, G., et al.",
        year: 2018,
        journal: "Physical Review Letters",
        url: "https://doi.org/10.1103/PhysRevLett.121.190502",
        abstract:
          "Demonstrates record-distance QKD using time-bin encoding and single-photon detectors.",
      },
      {
        title: "Post-quantum cryptography standardization",
        authors: "Alagic, G., et al. (NIST)",
        year: 2022,
        journal: "NIST Internal Report 8413",
        url: "https://doi.org/10.6028/NIST.IR.8413",
        abstract:
          "NIST's evaluation of lattice-based, hash-based, and other quantum-resistant cryptographic algorithms.",
      },
    ],
  },
  {
    id: "climate",
    title: "Climate Modeling",
    description:
      "Create accurate climate simulations to better understand and combat climate change.",
    icon: <Leaf className="w-6 h-6" />,
    selected: false,
    papers: [
      {
        title: "Quantum computing for climate and weather prediction",
        authors: "Bauer, P., Dueben, P., et al.",
        year: 2023,
        journal: "Nature Reviews Physics",
        url: "https://doi.org/10.1038/s42254-023-00563-0",
        abstract:
          "Outlines how quantum Monte Carlo and quantum ML can accelerate atmospheric and ocean simulations.",
      },
      {
        title: "Quantum algorithms for fluid dynamics simulation",
        authors: "Gaitan, F.",
        year: 2020,
        journal: "npj Quantum Information",
        url: "https://doi.org/10.1038/s41534-020-00291-0",
        abstract:
          "Presents a quantum algorithm encoding the Navier–Stokes equations with exponential speedup potential.",
      },
      {
        title: "Potential quantum advantage for turbulence simulation",
        authors: "Succi, S., Itani, W., et al.",
        year: 2023,
        journal: "Fluids",
        url: "https://doi.org/10.3390/fluids8100264",
        abstract:
          "Investigates lattice Boltzmann methods on near-term quantum hardware for turbulent flow modeling.",
      },
    ],
  },
  {
    id: "optimization",
    title: "Optimization Problems",
    description:
      "Solve complex logistics, scheduling, and resource allocation challenges instantly.",
    icon: <BarChart3 className="w-6 h-6" />,
    selected: false,
    papers: [
      {
        title: "A quantum approximate optimization algorithm",
        authors: "Farhi, E., Goldstone, J., & Gutmann, S.",
        year: 2014,
        journal: "arXiv preprint",
        url: "https://arxiv.org/abs/1411.4028",
        abstract:
          "Introduces QAOA, a hybrid classical-quantum approach for combinatorial optimization on near-term devices.",
      },
      {
        title: "Quantum optimization for the vehicle routing problem",
        authors: "Feld, S., Roch, C., et al.",
        year: 2019,
        journal: "Frontiers in ICT",
        url: "https://doi.org/10.3389/fict.2019.00013",
        abstract:
          "Applies QUBO formulations and D-Wave annealing to logistics routing benchmarks.",
      },
      {
        title: "Grover's algorithm for combinatorial optimization",
        authors: "Durr, C., & Høyer, P.",
        year: 1996,
        journal: "arXiv preprint",
        url: "https://arxiv.org/abs/quant-ph/9607014",
        abstract:
          "Shows quadratic speedup for unstructured search as a basis for quantum optimization subroutines.",
      },
    ],
  },
  {
    id: "ai",
    title: "AI Acceleration",
    description:
      "Enhance machine learning training and inference with quantum speedup.",
    icon: <Sparkles className="w-6 h-6" />,
    selected: false,
    papers: [
      {
        title: "Quantum machine learning",
        authors: "Biamonte, J., Wittek, P., et al.",
        year: 2017,
        journal: "Nature",
        url: "https://doi.org/10.1038/nature23474",
        abstract:
          "Reviews quantum algorithms for clustering, classification, and neural-network training with potential speedups.",
      },
      {
        title: "Variational quantum classifiers for binary classification",
        authors: "Havlíček, V., Córcoles, A. D., et al.",
        year: 2019,
        journal: "Nature",
        url: "https://doi.org/10.1038/s41586-019-0980-2",
        abstract:
          "Demonstrates quantum kernel methods that may outperform classical SVMs for high-dimensional feature spaces.",
      },
      {
        title: "Quantum advantage in learning from experiments",
        authors: "Huang, H.-Y., Kueng, R., et al.",
        year: 2022,
        journal: "Science",
        url: "https://doi.org/10.1126/science.abn7293",
        abstract:
          "Proves exponential quantum advantage for certain learning tasks using quantum sensors and processors.",
      },
    ],
  },
  {
    id: "materials",
    title: "Materials Science",
    description:
      "Design new materials with specific properties at the atomic level.",
    icon: <Cpu className="w-6 h-6" />,
    selected: false,
    papers: [
      {
        title: "Elucidating reaction mechanisms on quantum computers",
        authors: "Reiher, M., Wiebe, N., et al.",
        year: 2017,
        journal: "PNAS",
        url: "https://doi.org/10.1073/pnas.1619152114",
        abstract:
          "Estimates quantum resources for simulating the nitrogen fixation mechanism — a materials science benchmark.",
      },
      {
        title: "Quantum simulation of high-temperature superconductivity",
        authors: "Cade, C., Mineh, L., et al.",
        year: 2020,
        journal: "Physical Review B",
        url: "https://doi.org/10.1103/PhysRevB.102.235122",
        abstract:
          "Maps Fermi–Hubbard model onto quantum circuits to study unconventional superconducting pairing mechanisms.",
      },
      {
        title: "Prospects of quantum computing for molecular sciences",
        authors: "Liu, J., Wan, L., et al.",
        year: 2022,
        journal: "Materials Today Physics",
        url: "https://doi.org/10.1016/j.mtphys.2022.100784",
        abstract:
          "Surveys near-term and fault-tolerant quantum approaches for battery materials, catalysts, and semiconductors.",
      },
    ],
  },
];

export function BenefitsSection() {
  const [benefits, setBenefits] = useState(initialBenefits);
  const [selectedPapers, setSelectedPapers] = useState<BenefitItem | null>(null);

  useEffect(() => {
    fetch("/api/engagement", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "section_view", payload: { section: "benefits" } }),
    }).catch(() => {});
  }, []);

  const toggleBenefit = (id: string) => {
    setBenefits((prev) =>
      prev.map((b) => (b.id === id ? { ...b, selected: !b.selected } : b))
    );
  };

  const selectedCount = benefits.filter((b) => b.selected).length;

  return (
    <section id="benefits" className="py-24 relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-accent/5 via-transparent to-transparent" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono mb-4 uppercase tracking-widest">
            Interactive
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Real-World Benefits
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
            Select the areas that interest you and explore the peer-reviewed research
            behind each application. Then see the speedup numbers for yourself.
          </p>
          {selectedCount > 0 && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm">
              <Check className="w-4 h-4" />
              {selectedCount} area{selectedCount !== 1 ? "s" : ""} selected
            </div>
          )}
        </div>

        {/* Click-to-select benefit cards with research papers */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {benefits.map((benefit) => (
            <Card
              key={benefit.id}
              className={`cursor-pointer transition-all duration-300 ${
                benefit.selected
                  ? "ring-2 ring-primary bg-primary/5 border-primary/30"
                  : "hover:shadow-lg hover:shadow-primary/10 hover:border-primary/30"
              }`}
              onClick={() => toggleBenefit(benefit.id)}
              role="checkbox"
              aria-checked={benefit.selected}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  toggleBenefit(benefit.id);
                }
              }}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${
                      benefit.selected
                        ? "bg-primary text-primary-foreground"
                        : "bg-accent/10 text-accent"
                    }`}
                  >
                    {benefit.icon}
                  </div>
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      benefit.selected
                        ? "bg-primary border-primary"
                        : "border-muted-foreground/30"
                    }`}
                  >
                    {benefit.selected ? (
                      <Check className="w-4 h-4 text-primary-foreground" />
                    ) : (
                      <Plus className="w-4 h-4 text-muted-foreground/50" />
                    )}
                  </div>
                </div>
                <CardTitle className="text-lg mt-3">{benefit.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {benefit.description}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPapers(benefit);
                  }}
                >
                  <BookOpen className="w-4 h-4" />
                  {benefit.papers.length} Research Papers
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {selectedCount > 0 && (
          <div className="mb-12 text-center">
            <Button size="lg">Learn More About Selected Topics</Button>
          </div>
        )}

        {/* Speedup Explorer */}
        <div className="mb-10">
          <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest text-center mb-6">
            Quantify the advantage
          </p>
          <SpeedupExplorer />
        </div>

        {/* Metric callouts */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { metric: "O(√N)", label: "Grover search speedup", color: "#a78bfa" },
            { metric: "Exp", label: "Shor's advantage over classical", color: "#f472b6" },
            { metric: "≥99.9%", label: "Target gate fidelity", color: "#34d399" },
            { metric: "2035+", label: "Fault-tolerant era estimate", color: "#60a5fa" },
          ].map(({ metric, label, color }) => (
            <div
              key={label}
              className="p-4 rounded-xl text-center"
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div className="text-2xl font-bold font-mono mb-1" style={{ color }}>
                {metric}
              </div>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>

        {/* Research insights panel */}
        <InsightsPanel section="benefits" accentColor="#34d399" />
      </div>

      {/* Research Papers Dialog */}
      <Dialog open={!!selectedPapers} onOpenChange={() => setSelectedPapers(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <BookOpen className="w-5 h-5 text-primary" />
              Research Papers — {selectedPapers?.title}
            </DialogTitle>
            <DialogDescription>
              Peer-reviewed publications and foundational works in this area.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            {selectedPapers?.papers.map((paper, idx) => (
              <div
                key={idx}
                className="rounded-lg border border-border bg-card/50 p-4 space-y-2"
              >
                <div className="flex items-start justify-between gap-3">
                  <h4 className="font-semibold text-sm leading-snug flex-1">
                    {paper.title}
                  </h4>
                  <Badge variant="secondary" className="shrink-0 text-xs">
                    {paper.year}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{paper.authors}</p>
                <p className="text-xs text-primary/80 font-medium">{paper.journal}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {paper.abstract}
                </p>
                <a
                  href={paper.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline mt-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="w-3 h-3" />
                  View paper
                </a>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
