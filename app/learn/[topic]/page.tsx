import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Clock, FlaskConical } from "lucide-react"
import { TOPICS, getTopic, DIFFICULTY_COLOR } from "@/lib/learn/topics"
import { cn } from "@/lib/utils"
import type { Metadata } from "next"

interface Props {
  params: Promise<{ topic: string }>
}

export async function generateStaticParams() {
  return TOPICS.map((t) => ({ topic: t.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { topic: slug } = await params
  const topic = getTopic(slug)
  if (!topic) return {}
  return {
    title: `${topic.title} — QuantumLearn`,
    description: topic.tagline,
  }
}

export default async function TopicPage({ params }: Props) {
  const { topic: slug } = await params
  const topic = getTopic(slug)
  if (!topic) notFound()

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      {/* Back */}
      <Link
        href="/learn"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        All lessons
      </Link>

      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded border", DIFFICULTY_COLOR[topic.difficulty])}>
            {topic.difficulty}
          </span>
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground/60">
            <Clock className="w-3 h-3" />
            {topic.readingMinutes} min read
          </span>
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-3">{topic.title}</h1>
        <p className="text-lg text-muted-foreground">{topic.tagline}</p>
      </div>

      {/* Playground CTA */}
      {topic.playgroundPreset && (
        <div className="mb-10 p-4 rounded-xl border border-primary/20 bg-primary/5 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-foreground">Try it in the Playground</p>
            <p className="text-xs text-muted-foreground mt-0.5">Experiment with this concept live in the circuit builder.</p>
          </div>
          <Link
            href="/playground"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shrink-0"
          >
            <FlaskConical className="w-3.5 h-3.5" />
            Open Playground
          </Link>
        </div>
      )}

      {/* Sections */}
      <div className="flex flex-col gap-8">
        {topic.sections.map((section, i) => (
          <section key={i} className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold text-foreground border-l-2 border-primary pl-3">
              {section.heading}
            </h2>
            <p className="text-muted-foreground leading-relaxed">{section.body}</p>
            {section.math && (
              <div className="font-mono text-sm text-cyan-300 bg-slate-950/60 rounded-lg px-4 py-3 border border-slate-800">
                {section.math}
              </div>
            )}
          </section>
        ))}
      </div>

      {/* Next lesson navigation */}
      <NextLessonNav currentSlug={slug} />
    </div>
  )
}

function NextLessonNav({ currentSlug }: { currentSlug: string }) {
  const idx = TOPICS.findIndex((t) => t.slug === currentSlug)
  const prev = idx > 0 ? TOPICS[idx - 1] : null
  const next = idx < TOPICS.length - 1 ? TOPICS[idx + 1] : null

  if (!prev && !next) return null

  return (
    <div className="mt-16 pt-8 border-t border-border flex items-center justify-between gap-4">
      {prev ? (
        <Link
          href={`/learn/${prev.slug}`}
          className="flex flex-col gap-1 group"
        >
          <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">Previous</span>
          <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
            ← {prev.title}
          </span>
        </Link>
      ) : <div />}
      {next ? (
        <Link
          href={`/learn/${next.slug}`}
          className="flex flex-col gap-1 items-end group"
        >
          <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">Next</span>
          <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
            {next.title} →
          </span>
        </Link>
      ) : <div />}
    </div>
  )
}
