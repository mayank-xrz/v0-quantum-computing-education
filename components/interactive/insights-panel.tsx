"use client"

import { RefreshCw, Wifi, AlertCircle } from "lucide-react"
import { useInsights, type InsightSection } from "@/hooks/use-insights"
import { InsightCard, InsightCardSkeleton } from "./insight-card"

interface InsightsPanelProps {
  section: InsightSection
  accentColor: string
}

function FetchedIndicator({ fetchedAt, accentColor }: { fetchedAt: string | null; accentColor: string }) {
  if (!fetchedAt) return null
  const d = new Date(fetchedAt)
  const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
  return (
    <div className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground">
      <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: accentColor }} />
      Fetched {time}
    </div>
  )
}

export function InsightsPanel({ section, accentColor }: InsightsPanelProps) {
  const { insights, loading, error, refetch, fetchedAt } = useInsights(section)

  return (
    <div className="mt-16">
      {/* Divider with label */}
      <div className="flex items-center gap-4 mb-8">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent" style={{ backgroundImage: `linear-gradient(to right, transparent, ${accentColor}30)` }} />
        <div className="flex items-center gap-3 shrink-0">
          <Wifi className="w-3.5 h-3.5" style={{ color: accentColor + "99" }} />
          <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
            Research Insights
          </span>
          <button
            onClick={refetch}
            disabled={loading}
            className="p-1 rounded transition-all hover:bg-white/5 disabled:opacity-40"
            title="Refresh insights"
          >
            <RefreshCw
              className="w-3 h-3 text-muted-foreground transition-transform"
              style={{ animation: loading ? "spin 0.8s linear infinite" : "none" }}
            />
          </button>
        </div>
        <div className="flex-1 h-px bg-gradient-to-l from-transparent" style={{ backgroundImage: `linear-gradient(to left, transparent, ${accentColor}30)` }} />
      </div>

      {/* Fetch status */}
      <div className="flex items-center justify-between mb-5">
        <p className="text-xs text-muted-foreground max-w-lg">
          Curated from peer-reviewed publications and verified industry milestones.
          Click any card to expand with key figures and full context.
        </p>
        <FetchedIndicator fetchedAt={fetchedAt} accentColor={accentColor} />
      </div>

      {/* Error state */}
      {error && !loading && (
        <div className="flex items-center justify-center gap-3 py-12 text-sm text-muted-foreground">
          <AlertCircle className="w-4 h-4 text-destructive" />
          <span>Could not load insights.</span>
          <button onClick={refetch} className="underline underline-offset-2 hover:text-white transition-colors">
            Retry
          </button>
        </div>
      )}

      {/* Loading skeletons */}
      {loading && (
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }, (_, i) => <InsightCardSkeleton key={i} />)}
        </div>
      )}

      {/* Insight cards */}
      {!loading && !error && insights.length > 0 && (
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {insights.map((insight, i) => (
            <InsightCard key={insight.id} insight={insight} index={i} />
          ))}
        </div>
      )}
    </div>
  )
}
