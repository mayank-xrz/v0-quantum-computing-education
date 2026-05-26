"use client";

import { useState } from "react";
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
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ChallengeItem {
  id: string;
  title: string;
  description: string;
  severity: "critical" | "high" | "medium";
  icon: React.ReactNode;
}

const initialChallenges: ChallengeItem[] = [
  {
    id: "decoherence",
    title: "Quantum Decoherence",
    description:
      "Qubits lose their quantum properties when interacting with the environment, limiting computation time.",
    severity: "critical",
    icon: <Clock className="w-5 h-5" />,
  },
  {
    id: "error-correction",
    title: "Error Correction",
    description:
      "Quantum operations are inherently noisy, requiring complex error correction codes.",
    severity: "critical",
    icon: <Bug className="w-5 h-5" />,
  },
  {
    id: "cooling",
    title: "Extreme Cooling",
    description:
      "Most quantum computers require temperatures near absolute zero (-273°C) to operate.",
    severity: "high",
    icon: <Thermometer className="w-5 h-5" />,
  },
  {
    id: "scalability",
    title: "Scalability",
    description:
      "Increasing qubit count while maintaining coherence remains a significant engineering challenge.",
    severity: "high",
    icon: <AlertTriangle className="w-5 h-5" />,
  },
  {
    id: "security",
    title: "Cryptographic Threats",
    description:
      "Quantum computers could break current encryption, requiring new quantum-safe algorithms.",
    severity: "medium",
    icon: <Shield className="w-5 h-5" />,
  },
];

const severityColors = {
  critical: "bg-destructive/10 text-destructive border-destructive/20",
  high: "bg-chart-5/10 text-chart-5 border-chart-5/20",
  medium: "bg-chart-4/10 text-chart-4 border-chart-4/20",
};

function SortableChallengeCard({ challenge }: { challenge: ChallengeItem }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: challenge.id });

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
              <p className="text-sm text-muted-foreground">
                {challenge.description}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function ChallengesSection() {
  const [challenges, setChallenges] = useState(initialChallenges);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
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
    <section id="challenges" className="py-24 bg-card/50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Current Challenges
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
            Understanding the obstacles researchers face helps appreciate the
            complexity of quantum computing. Prioritize challenges by dragging
            them.
          </p>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={challenges}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-4">
              {challenges.map((challenge) => (
                <SortableChallengeCard
                  key={challenge.id}
                  challenge={challenge}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </section>
  );
}
