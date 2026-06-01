"use client"

import { useState } from "react"
import {
  Award, Cpu, Target, Atom, AlertTriangle, Shield,
  RefreshCw, FlaskConical, TrendingUp, Sparkles,
  ArrowRight, X, ChevronRight,
} from "lucide-react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import type { Insight } from "@/hooks/use-insights"

// ── Icon map ──────────────────────────────────────────────────────────────
const ICON_MAP: Record<string, React.ElementType> = {
  "award": Award,
  "cpu": Cpu,
  "target": Target,
  "atom": Atom,
  "alert-triangle": AlertTriangle,
  "shield": Shield,
  "refresh-cw": RefreshCw,
  "flask-conical": FlaskConical,
  "trending-up": TrendingUp,
  "sparkles": Sparkles,
}

// ── Expanded Modal ────────────────────────────────────────────────────────
function InsightModal({ insight, open, onClose }: { insight: Insight; open: boolean; onClose: () => void }) {
  const IconComp = ICON_MAP[insight.icon] ?? Sparkles
  const { expanded } = insight

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent
        className="max-w-2xl w-full p-0 overflow-hidden border-0 shadow-2xl"
        style={{ background: "rgba(12,12,24,0.98)", border: `1px solid ${insight.categoryColor}30` }}
      >
        {/* Header bar */}
        <div className="flex items-start justify-between p-6 pb-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: insight.categoryColor + "18", border: `1px solid ${insight.categoryColor}30` }}
            >
              <IconComp className="w-5 h-5" style={{ color: insight.categoryColor }} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase tracking-wider"
                  style={{ background: insight.categoryColor + "18", color: insight.categoryColor, border: `1px solid ${insight.categoryColor}30` }}
                >
                  {insight.category}
                </span>
                <span className="text-[11px] text-muted-foreground font-mono">{insight.sourceOrg}</span>
                <span className="text-[11px] text-muted-foreground font-mono">{insight.year}</span>
              </div>
              <h2 className="text-lg font-bold mt-1.5 leading-snug text-white">{insight.title}</h2>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Context */}
          <p className="text-sm text-muted-foreground leading-relaxed">{expanded.context}</p>

          {/* Key Figures */}
          <div>
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-3">Key Figures</p>
            <div className="grid grid-cols-3 gap-3">
              {expanded.figures.map((fig, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl text-center"
                  style={{ background: fig.color + "0e", border: `1px solid ${fig.color}25` }}
                >
                  <div className="text-xl font-bold font-mono" style={{ color: fig.color }}>{fig.value}</div>
                  <div className="text-[10px] font-mono mt-0.5" style={{ color: fig.color + "99" }}>{fig.unit}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5 leading-snug">{fig.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Implication */}
          <div
            className="p-4 rounded-xl"
            style={{ background: insight.categoryColor + "0a", border: `1px solid ${insight.categoryColor}20` }}
          >
            <p className="text-[10px] font-mono uppercase tracking-widest mb-2" style={{ color: insight.categoryColor + "99" }}>
              What This Means
            </p>
            <p className="text-sm text-white/80 leading-relaxed">{expanded.implication}</p>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {expanded.tags.map(tag => (
              <span
                key={tag}
                className="px-2.5 py-1 rounded-full text-[10px] font-mono"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "rgba(255,255,255,0.45)",
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Card skeleton ─────────────────────────────────────────────────────────
export function InsightCardSkeleton() {
  return (
    <div
      className="rounded-2xl p-5 space-y-3 animate-pulse"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div className="flex items-center justify-between">
        <div className="h-5 w-20 rounded-full bg-white/5" />
        <div className="h-4 w-16 rounded bg-white/5" />
      </div>
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-white/5 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/4 rounded bg-white/7" />
          <div className="h-3 w-full rounded bg-white/5" />
        </div>
      </div>
      <div className="space-y-2 pt-1">
        <div className="flex items-start gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-white/10 mt-1.5 shrink-0" />
          <div className="h-3 w-full rounded bg-white/5" />
        </div>
        <div className="flex items-start gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-white/10 mt-1.5 shrink-0" />
          <div className="h-3 w-5/6 rounded bg-white/5" />
        </div>
      </div>
      <div className="pt-2 border-t border-white/5">
        <div className="h-7 w-28 rounded-lg bg-white/5" />
      </div>
    </div>
  )
}

// ── Insight card ──────────────────────────────────────────────────────────
export function InsightCard({ insight, index }: { insight: Insight; index: number }) {
  const [open, setOpen] = useState(false)
  const [hovered, setHovered] = useState(false)
  const IconComp = ICON_MAP[insight.icon] ?? Sparkles
  const color = insight.categoryColor

  return (
    <>
      <div
        className="rounded-2xl p-5 flex flex-col gap-4 cursor-pointer animate-in fade-in slide-in-from-bottom-3"
        style={{
          background: hovered ? `rgba(255,255,255,0.035)` : "rgba(255,255,255,0.02)",
          border: `1px solid ${hovered ? color + "40" : color + "18"}`,
          boxShadow: hovered ? `0 0 28px ${color}12` : "none",
          transform: hovered ? "translateY(-1px)" : "translateY(0px)",
          transition: "all 0.2s ease",
          animationDelay: `${index * 90}ms`,
          animationFillMode: "both",
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => setOpen(true)}
        role="button"
        tabIndex={0}
        onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpen(true) } }}
        aria-label={`Read more about ${insight.title}`}
      >
        {/* Top row: category + source */}
        <div className="flex items-center justify-between gap-2">
          <span
            className="px-2 py-0.5 rounded-full text-[9px] font-mono font-semibold uppercase tracking-wider"
            style={{ background: color + "15", color, border: `1px solid ${color}25` }}
          >
            {insight.category}
          </span>
          <span className="text-[10px] font-mono text-muted-foreground shrink-0">
            {insight.sourceOrg.split("/")[0].trim()} · {insight.year}
          </span>
        </div>

        {/* Icon + title */}
        <div className="flex items-start gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
            style={{ background: color + "15", border: `1px solid ${color}25` }}
          >
            <IconComp className="w-4 h-4" style={{ color }} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white leading-snug">{insight.title}</h3>
            <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{insight.summary}</p>
          </div>
        </div>

        {/* Bullets */}
        <ul className="space-y-1.5">
          {insight.bullets.map((b, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color + "80" }} />
              <span className="text-[11px] text-muted-foreground leading-relaxed">{b}</span>
            </li>
          ))}
        </ul>

        {/* Learn More */}
        <div className="pt-1 border-t border-white/5 mt-auto">
          <div
            className="group inline-flex items-center gap-1.5 text-xs font-semibold transition-all duration-150"
            style={{ color: hovered ? color : color + "99" }}
          >
            Learn More
            <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </div>
        </div>
      </div>

      <InsightModal insight={insight} open={open} onClose={() => setOpen(false)} />
    </>
  )
}
