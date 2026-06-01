"use client"

import { useState, useEffect, useCallback } from "react"

export type InsightSection = "how-it-works" | "challenges" | "benefits"

export interface InsightFigure {
  label: string
  value: string
  unit: string
  color: string
}

export interface Insight {
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

interface UseInsightsResult {
  insights: Insight[]
  loading: boolean
  error: string | null
  refetch: () => void
  fetchedAt: string | null
}

export function useInsights(section: InsightSection): UseInsightsResult {
  const [insights, setInsights] = useState<Insight[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [fetchedAt, setFetchedAt] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    fetch(`/api/insights?section=${section}`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json() as Promise<{ insights: Insight[]; fetchedAt: string }>
      })
      .then(data => {
        if (cancelled) return
        setInsights(data.insights)
        setFetchedAt(data.fetchedAt)
        setLoading(false)
      })
      .catch(err => {
        if (cancelled) return
        setError(err.message ?? "Failed to load insights")
        setLoading(false)
      })

    return () => { cancelled = true }
  }, [section, tick])

  const refetch = useCallback(() => setTick(n => n + 1), [])

  return { insights, loading, error, refetch, fetchedAt }
}
