import { NextRequest, NextResponse } from "next/server"

interface EngagementEvent {
  type: string
  payload?: Record<string, unknown>
  ts: number
}

interface Stats {
  totalEvents: number
  gatePlacements: number
  measurements: number
  presetLoads: number
  sectionViews: Record<string, number>
  topGates: Record<string, number>
  sessionStart: number
}

// In-memory store (resets on cold start; replace with DB for persistence)
const events: EngagementEvent[] = []
const stats: Stats = {
  totalEvents: 0,
  gatePlacements: 0,
  measurements: 0,
  presetLoads: 0,
  sectionViews: {},
  topGates: {},
  sessionStart: Date.now(),
}

function updateStats(event: EngagementEvent) {
  stats.totalEvents++
  switch (event.type) {
    case "gate_placed":
      stats.gatePlacements++
      if (event.payload?.gate) {
        const g = event.payload.gate as string
        stats.topGates[g] = (stats.topGates[g] ?? 0) + 1
      }
      break
    case "measurement":
      stats.measurements++
      break
    case "preset_loaded":
      stats.presetLoads++
      break
    case "section_view":
      if (event.payload?.section) {
        const s = event.payload.section as string
        stats.sectionViews[s] = (stats.sectionViews[s] ?? 0) + 1
      }
      break
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { type: string; payload?: Record<string, unknown> }
    if (!body.type) {
      return NextResponse.json({ error: "Missing type" }, { status: 400 })
    }
    const event: EngagementEvent = { type: body.type, payload: body.payload, ts: Date.now() }
    events.push(event)
    if (events.length > 1000) events.splice(0, events.length - 1000)
    updateStats(event)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }
}

export async function GET() {
  return NextResponse.json({
    stats,
    recentEvents: events.slice(-20).reverse(),
  })
}
