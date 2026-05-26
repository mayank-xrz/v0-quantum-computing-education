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
import {
  GripVertical,
  BookOpen,
  Video,
  Code,
  FileText,
  Beaker,
  Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ResourceBlock {
  id: string;
  title: string;
  type: string;
  description: string;
  icon: React.ReactNode;
  badge?: string;
}

const initialResources: ResourceBlock[] = [
  {
    id: "fundamentals",
    title: "Quantum Fundamentals",
    type: "Course",
    description: "Start your journey with the basics of quantum mechanics and computing.",
    icon: <BookOpen className="w-5 h-5" />,
    badge: "Beginner",
  },
  {
    id: "videos",
    title: "Video Library",
    type: "Videos",
    description: "Watch visual explanations of complex quantum concepts.",
    icon: <Video className="w-5 h-5" />,
  },
  {
    id: "playground",
    title: "Quantum Playground",
    type: "Interactive",
    description: "Experiment with quantum circuits in our online simulator.",
    icon: <Beaker className="w-5 h-5" />,
    badge: "Popular",
  },
  {
    id: "code",
    title: "Code Examples",
    type: "Code",
    description: "Real quantum algorithms with step-by-step explanations.",
    icon: <Code className="w-5 h-5" />,
  },
  {
    id: "papers",
    title: "Research Papers",
    type: "Research",
    description: "Access curated academic papers for deeper understanding.",
    icon: <FileText className="w-5 h-5" />,
    badge: "Advanced",
  },
  {
    id: "community",
    title: "Community Forum",
    type: "Community",
    description: "Connect with fellow learners and quantum computing experts.",
    icon: <Users className="w-5 h-5" />,
  },
];

function SortableResourceCard({ resource }: { resource: ResourceBlock }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: resource.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 0,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card
        className={`group h-full transition-all duration-300 ${
          isDragging
            ? "scale-105 shadow-xl shadow-primary/20 ring-2 ring-primary"
            : "hover:shadow-lg hover:shadow-primary/10 hover:border-primary/30"
        }`}
      >
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-foreground">
              {resource.icon}
            </div>
            <div className="flex items-center gap-2">
              {resource.badge && (
                <Badge variant="secondary" className="text-xs">
                  {resource.badge}
                </Badge>
              )}
              <div
                {...attributes}
                {...listeners}
                className="p-1 rounded opacity-50 hover:opacity-100 cursor-grab active:cursor-grabbing"
                aria-label="Drag handle"
              >
                <GripVertical className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">
              {resource.type}
            </span>
            <CardTitle className="text-base mt-1">{resource.title}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{resource.description}</p>
        </CardContent>
      </Card>
    </div>
  );
}

export function ResourcesSection() {
  const [resources, setResources] = useState(initialResources);

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
      setResources((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }

  return (
    <section id="resources" className="py-24 bg-card/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Learning Resources
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
            Customize your learning path by arranging resources in your
            preferred order. Drag to prioritize what matters most to you.
          </p>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={resources} strategy={rectSortingStrategy}>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {resources.map((resource) => (
                <SortableResourceCard key={resource.id} resource={resource} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </section>
  );
}
