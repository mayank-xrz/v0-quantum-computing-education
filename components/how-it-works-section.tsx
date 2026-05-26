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
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Zap, Waves, GitBranch, Cpu } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ConceptBlock {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const initialConcepts: ConceptBlock[] = [
  {
    id: "superposition",
    title: "Superposition",
    description:
      "Qubits can exist in multiple states simultaneously, unlike classical bits that are either 0 or 1.",
    icon: <Waves className="w-6 h-6" />,
  },
  {
    id: "entanglement",
    title: "Entanglement",
    description:
      "Quantum particles become connected, sharing states instantaneously regardless of distance.",
    icon: <GitBranch className="w-6 h-6" />,
  },
  {
    id: "interference",
    title: "Interference",
    description:
      "Quantum states can amplify or cancel each other, enabling powerful computational patterns.",
    icon: <Zap className="w-6 h-6" />,
  },
  {
    id: "measurement",
    title: "Measurement",
    description:
      "Observing a qubit collapses its superposition into a definite classical state.",
    icon: <Cpu className="w-6 h-6" />,
  },
];

function SortableConceptCard({ concept }: { concept: ConceptBlock }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: concept.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 0,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card
        className={`group relative h-full transition-all duration-300 ${
          isDragging
            ? "scale-105 shadow-xl shadow-primary/20 ring-2 ring-primary"
            : "hover:shadow-lg hover:shadow-primary/10 hover:border-primary/30"
        }`}
      >
        <div
          {...attributes}
          {...listeners}
          className="absolute top-3 right-3 p-1 rounded opacity-50 hover:opacity-100 cursor-grab active:cursor-grabbing"
          aria-label="Drag handle"
        >
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </div>
        <CardHeader className="pb-2">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-3">
            {concept.icon}
          </div>
          <CardTitle className="text-lg">{concept.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{concept.description}</p>
        </CardContent>
      </Card>
    </div>
  );
}

export function HowItWorksSection() {
  const [concepts, setConcepts] = useState(initialConcepts);

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
      setConcepts((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }

  return (
    <section id="how-it-works" className="py-24 relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            How Quantum Computing Works
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
            Drag and rearrange the concepts below to explore the fundamental
            principles that make quantum computing revolutionary.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 text-sm text-muted-foreground">
            <GripVertical className="w-4 h-4" />
            <span>Drag cards to reorder</span>
          </div>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={concepts} strategy={rectSortingStrategy}>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {concepts.map((concept) => (
                <SortableConceptCard key={concept.id} concept={concept} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </section>
  );
}
