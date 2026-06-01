"use client";

import { useState, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  AlertTriangle,
  Thermometer,
  Clock,
  Shield,
  Bug,
  BookOpen,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { DecoherenceLab } from "./interactive/decoherence-lab";
import { InsightsPanel } from "./interactive/insights-panel";

interface ResearchPaper {
  title: string;
  authors: string;
  year: number;
  journal: string;
  url: string;
  abstract: string;
}

interface ChallengeItem {
  id: string;
  title: string;
  description: string;
  severity: "critical" | "high" | "medium";
  icon: React.ReactNode;
  papers: ResearchPaper[];
}

const initialChallenges: ChallengeItem[] = [
  {
    id: "decoherence",
    title: "Quantum Decoherence",
    description:
      "Qubits lose their quantum properties when interacting with the environment, limiting computation time.",
    severity: "critical",
    icon: <Clock className="w-5 h-5" />,
    papers: [
      {
        title: "Decoherence, einselection, and the quantum origins of the classical",
        authors: "Zurek, W. H.",
        year: 2003,
        journal: "Reviews of Modern Physics",
        url: "https://doi.org/10.1103/RevModPhys.75.715",
        abstract:
          "Foundational treatment of how entanglement with the environment causes quantum superpositions to collapse into classical mixtures.",
      },
      {
        title: "Dynamical decoupling of open quantum systems",
        authors: "Viola, L., Knill, E., & Lloyd, S.",
        year: 1999,
        journal: "Physical Review Letters",
        url: "https://doi.org/10.1103/PhysRevLett.82.2417",
        abstract:
          "Introduces pulse sequences that average out environmental noise, extending coherence times for qubits.",
      },
      {
        title: "Coherence times in superconducting qubits exceeding 0.2 milliseconds",
        authors: "Somoroff, A., Ficheux, Q., et al.",
        year: 2023,
        journal: "Physical Review Letters",
        url: "https://doi.org/10.1103/PhysRevLett.130.267001",
        abstract:
          "Reports state-of-the-art T₁ coherence times in fluxonium qubits, setting a benchmark for decoherence suppression.",
      },
    ],
  },
  {
    id: "error-correction",
    title: "Error Correction",
    description:
      "Quantum operations are inherently noisy, requiring complex error correction codes.",
    severity: "critical",
    icon: <Bug className="w-5 h-5" />,
    papers: [
      {
        title: "Scheme for reducing decoherence in quantum computer memory",
        authors: "Shor, P. W.",
        year: 1995,
        journal: "Physical Review A",
        url: "https://doi.org/10.1103/PhysRevA.52.R2493",
        abstract:
          "Introduces the first quantum error-correcting code, protecting a logical qubit against arbitrary single-qubit errors.",
      },
      {
        title: "Surface codes: Towards practical large-scale quantum computation",
        authors: "Fowler, A. G., Martinis, J. M., et al.",
        year: 2012,
        journal: "Physical Review A",
        url: "https://doi.org/10.1103/PhysRevA.86.032324",
        abstract:
          "Comprehensive analysis of the surface code architecture with high error threshold (~1%) suitable for near-term hardware.",
      },
      {
        title: "Suppressing quantum errors by scaling a surface code logical qubit",
        authors: "Google Quantum AI",
        year: 2023,
        journal: "Nature",
        url: "https://doi.org/10.1038/s41586-022-05434-1",
        abstract:
          "Demonstrates that increasing surface code distance reduces logical error rates, validating the path to fault tolerance.",
      },
    ],
  },
  {
    id: "cooling",
    title: "Extreme Cooling",
    description:
      "Most quantum computers require temperatures near absolute zero (-273°C) to operate.",
    severity: "high",
    icon: <Thermometer className="w-5 h-5" />,
    papers: [
      {
        title: "Dilution refrigeration below 10 mK for quantum computing",
        authors: "Uhlig, K.",
        year: 2008,
        journal: "Cryogenics",
        url: "https://doi.org/10.1016/j.cryogenics.2008.07.009",
        abstract:
          "Reviews the dilution refrigerator technology required to cool superconducting qubit systems to millikelvin temperatures.",
      },
      {
        title: "Laser cooling of a nanomechanical oscillator to the quantum ground state",
        authors: "Chan, J., Alegre, T. P. M., et al.",
        year: 2011,
        journal: "Nature",
        url: "https://doi.org/10.1038/nature10461",
        abstract:
          "Demonstrates sideband laser cooling of a mechanical resonator to near-zero phonon occupancy — alternative to dilution fridges.",
      },
      {
        title: "Room-temperature quantum computing with nitrogen-vacancy centers",
        authors: "Childress, L., & Hanson, R.",
        year: 2013,
        journal: "MRS Bulletin",
        url: "https://doi.org/10.1557/mrs.2013.20",
        abstract:
          "Reviews NV-center qubits in diamond that retain coherence at room temperature, avoiding cryogenic requirements.",
      },
    ],
  },
  {
    id: "scalability",
    title: "Scalability",
    description:
      "Increasing qubit count while maintaining coherence remains a significant engineering challenge.",
    severity: "high",
    icon: <AlertTriangle className="w-5 h-5" />,
    papers: [
      {
        title: "A blueprint for demonstrating quantum supremacy with superconducting qubits",
        authors: "Boixo, S., Smelyanskiy, V., et al.",
        year: 2018,
        journal: "Nature Physics",
        url: "https://doi.org/10.1038/s41567-018-0124-x",
        abstract:
          "Outlines the engineering and architectural requirements for scaling superconducting processors beyond 50 qubits.",
      },
      {
        title: "Quantum computing with trapped ions: From the laboratory to industry",
        authors: "Bruzewicz, C. D., Chiaverini, J., et al.",
        year: 2019,
        journal: "Applied Physics Reviews",
        url: "https://doi.org/10.1063/1.5088164",
        abstract:
          "Reviews scalability strategies for ion-trap processors including photonic interconnects and modular architectures.",
      },
      {
        title: "Scalable photonic quantum computing through cavity-assisted interactions",
        authors: "Lund, A. P., Laing, A., et al.",
        year: 2014,
        journal: "Physical Review Letters",
        url: "https://doi.org/10.1103/PhysRevLett.113.100502",
        abstract:
          "Proposes photonic schemes that reduce overhead for fault-tolerant, large-scale quantum computation.",
      },
    ],
  },
  {
    id: "security",
    title: "Cryptographic Threats",
    description:
      "Quantum computers could break current encryption, requiring new quantum-safe algorithms.",
    severity: "medium",
    icon: <Shield className="w-5 h-5" />,
    papers: [
      {
        title:
          "Polynomial-time algorithms for prime factorization and discrete logarithms on a quantum computer",
        authors: "Shor, P. W.",
        year: 1997,
        journal: "SIAM Journal on Computing",
        url: "https://doi.org/10.1137/S0097539795293172",
        abstract:
          "The landmark paper showing quantum computers can break RSA and elliptic-curve cryptography in polynomial time.",
      },
      {
        title: "CRYSTALS-Kyber: A CCA-secure module-lattice-based KEM",
        authors: "Avanzi, R., Bos, J., et al.",
        year: 2021,
        journal: "IEEE Transactions on Information Theory",
        url: "https://doi.org/10.1109/TIT.2021.3114325",
        abstract:
          "Describes CRYSTALS-Kyber, a leading post-quantum key encapsulation mechanism selected by NIST for standardization.",
      },
      {
        title: "Quantum threat timeline report 2023",
        authors: "Mosca, M., & Piani, M.",
        year: 2023,
        journal: "Global Risk Institute",
        url: "https://globalriskinstitute.org/publication/2023-quantum-threat-timeline-report/",
        abstract:
          "Expert survey estimating the probability and timeline for quantum computers capable of breaking current encryption standards.",
      },
    ],
  },
];

const severityColors = {
  critical: "bg-destructive/10 text-destructive border-destructive/20",
  high: "bg-chart-5/10 text-chart-5 border-chart-5/20",
  medium: "bg-chart-4/10 text-chart-4 border-chart-4/20",
};

function SortableChallengeCard({
  challenge,
  onViewPapers,
}: {
  challenge: ChallengeItem;
  onViewPapers: (c: ChallengeItem) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: challenge.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 0,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card
        className={`transition-all duration-300 ${
          isDragging
            ? "scale-[1.02] shadow-xl shadow-primary/20 ring-2 ring-primary"
            : "hover:shadow-lg hover:shadow-primary/10 hover:border-primary/30"
        }`}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <div
              {...attributes}
              {...listeners}
              className="mt-1 p-1 rounded opacity-50 hover:opacity-100 cursor-grab active:cursor-grabbing"
              aria-label="Drag handle"
            >
              <GripVertical className="w-4 h-4 text-muted-foreground" />
            </div>

            <div
              className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${severityColors[challenge.severity]}`}
            >
              {challenge.icon}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold truncate">{challenge.title}</h3>
                <Badge
                  variant="outline"
                  className={`shrink-0 text-xs capitalize ${severityColors[challenge.severity]}`}
                >
                  {challenge.severity}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                {challenge.description}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={() => onViewPapers(challenge)}
              >
                <BookOpen className="w-3.5 h-3.5" />
                {challenge.papers.length} Research Papers
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function ChallengesSection() {
  const [challenges, setChallenges] = useState(initialChallenges);
  const [selectedPapers, setSelectedPapers] = useState<ChallengeItem | null>(null);

  useEffect(() => {
    fetch("/api/engagement", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "section_view", payload: { section: "challenges" } }),
    }).catch(() => {});
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setChallenges((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }

  return (
    <section
      id="challenges"
      className="py-24 relative"
      style={{ background: "rgba(10,10,20,0.5)" }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-destructive/5 via-transparent to-transparent" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono mb-4 uppercase tracking-widest">
            Interactive
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Quantum Challenges
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
            Prioritize the obstacles by dragging them, explore the research behind each,
            then simulate decoherence live in the lab below.
          </p>
        </div>

        {/* Drag-and-drop challenge cards with paper citations */}
        <div className="max-w-4xl mx-auto mb-16">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={challenges} strategy={verticalListSortingStrategy}>
              <div className="space-y-4">
                {challenges.map((challenge) => (
                  <SortableChallengeCard
                    key={challenge.id}
                    challenge={challenge}
                    onViewPapers={setSelectedPapers}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>

        {/* Decoherence Lab */}
        <div className="mb-10">
          <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest text-center mb-6">
            Simulate it live
          </p>
          <DecoherenceLab />
        </div>

        {/* Teaching callouts */}
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            {
              title: "Decoherence",
              body: "Qubits interact with their environment and lose quantum properties — typically in microseconds.",
              color: "#f87171",
            },
            {
              title: "1% Threshold",
              body: "Surface codes can correct errors only if the physical gate error rate stays below ~1%. Pushing lower is the key engineering challenge.",
              color: "#fbbf24",
            },
            {
              title: "1000:1 Overhead",
              body: "Today, thousands of noisy physical qubits are needed to encode one fault-tolerant logical qubit.",
              color: "#60a5fa",
            },
          ].map(({ title, body, color }) => (
            <div
              key={title}
              className="p-4 rounded-xl text-left"
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <h3 className="font-semibold text-sm mb-1.5" style={{ color }}>
                {title}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{body}</p>
            </div>
          ))}
        </div>

        {/* Research insights panel */}
        <InsightsPanel section="challenges" accentColor="#f87171" />
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
              Peer-reviewed publications and foundational works on this challenge.
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
