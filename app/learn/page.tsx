import Link from "next/link"
import { BookOpen, Clock, ChevronRight } from "lucide-react"
import { TOPICS, DIFFICULTY_COLOR } from "@/lib/learn/topics"
import { cn } from "@/lib/utils"

export const metadata = {
  title: "Learn Quantum Computing — QuantumLearn",
  description: "Structured lessons on superposition, entanglement, quantum gates, and algorithms.",
}

export default function LearnIndexPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-10">
        <div className="flex items-center gap-2 text-primary mb-3">
          <BookOpen className="w-5 h-5" />
          <span className="text-sm font-semibold uppercase tracking-wider">Learn</span>
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-3">Quantum Computing Lessons</h1>
        <p className="text-muted-foreground text-base max-w-2xl">
          From first principles to algorithms. Each lesson links directly to the Playground so you can experiment with every concept as you read.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {TOPICS.map((topic) => (
          <Link
            key={topic.slug}
            href={`/learn/${topic.slug}`}
            className="group flex flex-col gap-3 p-5 rounded-xl border border-border bg-card hover:border-primary/40 hover:bg-card/80 transition-all"
          >
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors">
                {topic.title}
              </h2>
              <ChevronRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-primary transition-colors shrink-0 mt-0.5" />
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed">{topic.tagline}</p>

            <div className="flex items-center gap-2 mt-auto pt-1">
              <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded border", DIFFICULTY_COLOR[topic.difficulty])}>
                {topic.difficulty}
              </span>
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground/60">
                <Clock className="w-3 h-3" />
                {topic.readingMinutes} min
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
