"use client"

import { useState, useCallback, useRef } from "react"
import { DndContext, DragOverlay, useDraggable, useDroppable, type DragEndEvent, type DragStartEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import { Trash2, RotateCcw, Zap, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { BlochSphere } from "./bloch-sphere"
import { ProbabilityDisplay } from "./probability-display"
import { simulateCircuit, getProbabilities, getBlochVector, GATE_INFO, PRESETS, type GateName, type CircuitGate } from "@/lib/quantum"

const NUM_QUBITS = 2
const NUM_COLS = 8
let gateIdCounter = 0
const genId = () => `gate-${++gateIdCounter}`

// ── Gate chip (palette + overlay) ──────────────────────────────────────────
function GateChip({ name, dragging = false }: { name: GateName; dragging?: boolean }) {
  const info = GATE_INFO[name]
  return (
    <div
      className="flex items-center justify-center w-10 h-10 rounded-lg font-mono font-bold text-sm select-none transition-transform"
      style={{
        background: info.bg,
        border: `1.5px solid ${info.color}55`,
        color: info.color,
        boxShadow: dragging ? `0 0 16px ${info.color}55` : `0 0 0 transparent`,
        transform: dragging ? "scale(1.1)" : "scale(1)",
        cursor: dragging ? "grabbing" : "grab",
      }}
    >
      {info.label}
    </div>
  )
}

// ── Draggable palette gate ─────────────────────────────────────────────────
function PaletteGate({ name, selected, onSelect }: { name: GateName; selected: boolean; onSelect: () => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${name}`,
    data: { source: "palette", gate: name },
  })
  const info = GATE_INFO[name]
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            ref={setNodeRef}
            {...attributes}
            {...listeners}
            onClick={onSelect}
            className="relative cursor-pointer"
            style={{ opacity: isDragging ? 0.4 : 1 }}
          >
            <div
              className="flex items-center justify-center w-10 h-10 rounded-lg font-mono font-bold text-sm select-none transition-all duration-150"
              style={{
                background: selected ? info.color + "33" : info.bg,
                border: selected ? `2px solid ${info.color}` : `1.5px solid ${info.color}44`,
                color: info.color,
                boxShadow: selected ? `0 0 12px ${info.color}44` : "none",
              }}
            >
              {info.label}
            </div>
            {selected && (
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-white" />
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-[180px]">
          <p className="font-semibold text-xs">{info.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// ── Circuit cell (droppable slot) ──────────────────────────────────────────
function CircuitCell({
  qubit, col, gate, isCnotControl, isCnotTarget, selectedGate,
  onDrop, onRemove,
}: {
  qubit: number; col: number; gate: CircuitGate | null
  isCnotControl: boolean; isCnotTarget: boolean
  selectedGate: GateName | null
  onDrop: (gate: GateName, qubit: number, col: number) => void
  onRemove: (id: string) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `slot-${qubit}-${col}`, data: { qubit, col } })

  const handleClick = () => {
    if (gate) { onRemove(gate.id); return }
    if (isCnotControl || isCnotTarget) return
    if (selectedGate) onDrop(selectedGate, qubit, col)
  }

  const hasSomething = gate || isCnotControl || isCnotTarget
  const info = gate ? GATE_INFO[gate.gate] : null

  return (
    <div
      ref={setNodeRef}
      onClick={handleClick}
      className="relative flex items-center justify-center w-10 h-10 rounded-md transition-all duration-150"
      style={{
        background: isOver && !hasSomething ? "rgba(167,139,250,0.12)" : "transparent",
        border: isOver && !hasSomething ? "1.5px dashed rgba(167,139,250,0.5)" : "1.5px solid transparent",
        cursor: hasSomething ? (gate ? "pointer" : "default") : selectedGate ? "cell" : "default",
      }}
    >
      {/* Wire line through cell */}
      <div className="absolute inset-y-0 left-0 right-0 flex items-center pointer-events-none">
        <div className="w-full h-px bg-current opacity-20" />
      </div>

      {/* Gate render */}
      {gate && gate.gate !== "CNOT" && (
        <div
          className="relative z-10 flex items-center justify-center w-9 h-9 rounded-lg font-mono font-bold text-sm group transition-all hover:scale-110"
          style={{
            background: info!.bg,
            border: `1.5px solid ${info!.color}77`,
            color: info!.color,
            boxShadow: `0 0 8px ${info!.color}33`,
          }}
        >
          {info!.label}
          <button
            className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-destructive flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20"
            onClick={(e) => { e.stopPropagation(); onRemove(gate.id) }}
          >
            <Trash2 className="w-2.5 h-2.5 text-white" />
          </button>
        </div>
      )}

      {/* CNOT control dot */}
      {isCnotControl && (
        <div className="relative z-10 w-4 h-4 rounded-full bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.6)]" />
      )}

      {/* CNOT target ⊕ */}
      {isCnotTarget && (
        <div className="relative z-10 flex items-center justify-center w-8 h-8 rounded-full font-mono font-bold text-violet-400"
          style={{ border: "2px solid rgba(167,139,250,0.7)", boxShadow: "0 0 8px rgba(167,139,250,0.4)" }}>
          ⊕
        </div>
      )}

      {/* Hover hint */}
      {!hasSomething && selectedGate && !isOver && (
        <div className="absolute inset-0 rounded-md opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center"
          style={{ background: "rgba(167,139,250,0.06)", border: "1.5px dashed rgba(167,139,250,0.3)" }}>
          <span className="font-mono text-xs text-violet-400 opacity-60">{GATE_INFO[selectedGate].label}</span>
        </div>
      )}
    </div>
  )
}

// ── CNOT vertical connector ────────────────────────────────────────────────
function CnotConnector({ col, controlQubit, cellH = 56 }: { col: number; controlQubit: number; cellH: number }) {
  const top = controlQubit === 0 ? cellH / 2 : -(cellH / 2)
  const height = cellH
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: col * (40 + 8) + 20 - 1,
        top: controlQubit === 0 ? cellH / 2 : -cellH / 2,
        width: 2,
        height,
        background: "rgba(167,139,250,0.5)",
        boxShadow: "0 0 4px rgba(167,139,250,0.3)",
      }}
    />
  )
}

// ── Main component ─────────────────────────────────────────────────────────
export function QuantumCircuitBuilder() {
  const [gates, setGates] = useState<CircuitGate[]>([])
  const [selectedGate, setSelectedGate] = useState<GateName | null>(null)
  const [dragGate, setDragGate] = useState<GateName | null>(null)
  const [measured, setMeasured] = useState<number | null>(null)
  const [measuring, setMeasuring] = useState(false)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  const state = simulateCircuit(gates, NUM_QUBITS)
  const probabilities = getProbabilities(state)
  const bloch = getBlochVector(state)

  const gateAt = useCallback((qubit: number, col: number) =>
    gates.find(g => g.qubit === qubit && g.col === col) ?? null,
    [gates])

  const cnotAt = useCallback((col: number) =>
    gates.find(g => g.gate === "CNOT" && g.col === col) ?? null,
    [gates])

  const placeGate = useCallback((gateName: GateName, qubit: number, col: number) => {
    // Block if slot occupied or CNOT already in this col
    if (gateAt(qubit, col)) return
    if (gateName === "CNOT") {
      if (cnotAt(col)) return
      // Place CNOT as control on this qubit (target auto = other qubit)
      setGates(prev => [...prev, { id: genId(), gate: "CNOT", qubit, col }])
    } else {
      // Block placing on a CNOT-occupied cell
      const cnot = cnotAt(col)
      if (cnot) {
        const targetQubit = cnot.qubit === 0 ? 1 : 0
        if (qubit === cnot.qubit || qubit === targetQubit) return
      }
      setGates(prev => [...prev, { id: genId(), gate: gateName, qubit, col }])
    }
    setMeasured(null)
    fetch("/api/engagement", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "gate_placed", payload: { gate: gateName } }) }).catch(() => {})
  }, [gateAt, cnotAt])

  const removeGate = useCallback((id: string) => {
    setGates(prev => prev.filter(g => g.id !== id))
    setMeasured(null)
  }, [])

  const handleDragStart = (e: DragStartEvent) => {
    const g = e.active.data.current?.gate as GateName
    setDragGate(g)
  }

  const handleDragEnd = (e: DragEndEvent) => {
    setDragGate(null)
    const { active, over } = e
    if (!over) return
    const gate = active.data.current?.gate as GateName
    const { qubit, col } = over.data.current as { qubit: number; col: number }
    placeGate(gate, qubit, col)
  }

  const handleMeasure = () => {
    setMeasuring(true)
    setTimeout(() => {
      const r = Math.random()
      let cumul = 0
      for (let i = 0; i < probabilities.length; i++) {
        cumul += probabilities[i]
        if (r <= cumul) { setMeasured(i); break }
      }
      setMeasuring(false)
      fetch("/api/engagement", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "measurement" }) }).catch(() => {})
    }, 600)
  }

  const loadPreset = (key: string) => {
    const preset = PRESETS[key]
    if (!preset) return
    setGates(preset.gates.map(g => ({ ...g, id: genId() })))
    setMeasured(null)
    setSelectedGate(null)
    fetch("/api/engagement", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "preset_loaded", payload: { preset: key } }) }).catch(() => {})
  }

  const GATE_NAMES: GateName[] = ["H", "X", "Y", "Z", "S", "T", "CNOT"]
  const CELL_GAP = 8
  const CELL_W = 40

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="w-full rounded-2xl overflow-hidden"
        style={{ background: "rgba(15,15,30,0.8)", border: "1px solid rgba(167,139,250,0.15)" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
            <span className="text-sm font-semibold text-white/80 font-mono tracking-wide">QUANTUM CIRCUIT BUILDER</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{gates.length} gate{gates.length !== 1 ? "s" : ""}</span>
            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-muted-foreground hover:text-white"
              onClick={() => { setGates([]); setMeasured(null); setSelectedGate(null) }}>
              <RotateCcw className="w-3 h-3 mr-1" />Reset
            </Button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-0 divide-y lg:divide-y-0 lg:divide-x divide-white/5">

          {/* Left: Gate palette + presets */}
          <div className="flex flex-col gap-5 p-5 lg:w-52 shrink-0">
            <div>
              <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-3">Gates</p>
              <div className="flex flex-row lg:flex-col flex-wrap gap-2">
                {GATE_NAMES.map(name => (
                  <PaletteGate
                    key={name}
                    name={name}
                    selected={selectedGate === name}
                    onSelect={() => setSelectedGate(prev => prev === name ? null : name)}
                  />
                ))}
              </div>
              {selectedGate && (
                <div className="mt-3 p-2 rounded-lg text-[10px] text-muted-foreground leading-relaxed"
                  style={{ background: "rgba(167,139,250,0.06)", border: "1px solid rgba(167,139,250,0.1)" }}>
                  <Info className="inline w-3 h-3 mr-1 text-violet-400" />
                  {GATE_INFO[selectedGate].description}
                </div>
              )}
            </div>

            <div>
              <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-3">Presets</p>
              <div className="flex flex-col gap-1.5">
                {Object.entries(PRESETS).map(([key, preset]) => (
                  <button
                    key={key}
                    onClick={() => loadPreset(key)}
                    className="text-left px-3 py-2 rounded-lg text-xs font-mono text-white/70 hover:text-white transition-all hover:bg-violet-500/10 border border-transparent hover:border-violet-500/20"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Center: Circuit board */}
          <div className="flex-1 p-5 overflow-x-auto">
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-4">
              {selectedGate ? `Click a slot to place ${GATE_INFO[selectedGate].label}` : "Select a gate or drag it onto the circuit"}
            </p>

            <div className="relative inline-flex flex-col gap-4" style={{ minWidth: NUM_COLS * (CELL_W + CELL_GAP) }}>
              {Array.from({ length: NUM_QUBITS }, (_, qubit) => {
                return (
                  <div key={qubit} className="flex items-center gap-0">
                    {/* Qubit label */}
                    <div className="w-12 shrink-0 flex items-center gap-1.5 pr-2">
                      <span className="text-xs font-mono text-violet-300">q<sub>{qubit}</sub></span>
                      <div className="flex-1 h-px bg-violet-400/20" />
                    </div>

                    {/* Cells */}
                    <div className="flex items-center" style={{ gap: CELL_GAP }}>
                      {Array.from({ length: NUM_COLS }, (_, col) => {
                        const cnot = cnotAt(col)
                        const cnotControlQ = cnot?.qubit ?? -1
                        const cnotTargetQ = cnotControlQ === 0 ? 1 : 0

                        return (
                          <CircuitCell
                            key={col}
                            qubit={qubit}
                            col={col}
                            gate={gateAt(qubit, col)}
                            isCnotControl={cnot !== null && qubit === cnotControlQ}
                            isCnotTarget={cnot !== null && qubit === cnotTargetQ}
                            selectedGate={selectedGate}
                            onDrop={placeGate}
                            onRemove={removeGate}
                          />
                        )
                      })}
                    </div>

                    {/* Trailing wire */}
                    <div className="flex-1 h-px bg-violet-400/20 ml-1" style={{ minWidth: 16 }} />
                  </div>
                )
              })}

              {/* CNOT vertical connectors */}
              {gates.filter(g => g.gate === "CNOT").map(g => (
                <CnotConnector key={g.id} col={g.col} controlQubit={g.qubit} cellH={56 + 16} />
              ))}
            </div>

            {/* Column indices */}
            <div className="flex mt-1 ml-12" style={{ gap: CELL_GAP }}>
              {Array.from({ length: NUM_COLS }, (_, col) => (
                <div key={col} className="flex items-center justify-center font-mono text-[9px] text-white/20" style={{ width: CELL_W }}>
                  t{col}
                </div>
              ))}
            </div>

            {/* Measure button */}
            <div className="mt-6 flex items-center gap-3">
              <Button
                onClick={handleMeasure}
                disabled={gates.length === 0 || measuring}
                className="relative overflow-hidden font-mono text-sm"
                style={{ background: "rgba(167,139,250,0.2)", border: "1px solid rgba(167,139,250,0.4)", color: "#c4b5fd" }}
              >
                {measuring ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full border-2 border-violet-400 border-t-transparent animate-spin" />
                    Measuring…
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    Measure
                  </span>
                )}
              </Button>
              {measured !== null && (
                <div className="text-sm font-mono animate-in fade-in" style={{ color: "#a78bfa" }}>
                  Collapsed → {`|${measured.toString(2).padStart(NUM_QUBITS, "0")}⟩`}
                </div>
              )}
            </div>

            {/* Active preset description */}
            {gates.length > 0 && (
              <div className="mt-4 text-xs text-muted-foreground/70 italic">
                {Object.values(PRESETS).find(p =>
                  p.gates.length === gates.length &&
                  p.gates.every(pg => gates.some(g => g.gate === pg.gate && g.qubit === pg.qubit && g.col === pg.col))
                )?.description ?? null}
              </div>
            )}
          </div>

          {/* Right: State visualization */}
          <div className="flex flex-col gap-6 p-5 lg:w-56 shrink-0">
            <div>
              <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-3">Probabilities</p>
              <ProbabilityDisplay
                probabilities={probabilities}
                numQubits={NUM_QUBITS}
                measured={measured}
              />
            </div>

            <div>
              <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-2">Bloch Sphere (q₀)</p>
              <div className="flex justify-center">
                <BlochSphere x={bloch.x} y={bloch.y} z={bloch.z} size={140} />
              </div>
            </div>

            {/* Entanglement indicator */}
            <div>
              <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-2">Entanglement</p>
              {(() => {
                const maxProb = Math.max(...probabilities)
                const isEntangled = maxProb < 0.99 && probabilities.filter(p => p > 0.05).length > 1
                const entropy = -probabilities.reduce((s, p) => p > 0.001 ? s + p * Math.log2(p) : s, 0)
                return (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground font-mono">von Neumann S</span>
                      <span className="font-mono" style={{ color: entropy > 0.5 ? "#f472b6" : "#60a5fa" }}>
                        {entropy.toFixed(3)}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden bg-white/5">
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, (entropy / Math.log2(1 << NUM_QUBITS)) * 100)}%`,
                          background: entropy > 0.5 ? "linear-gradient(90deg,#a78bfa,#f472b6)" : "#60a5fa",
                        }} />
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      {isEntangled ? "⚡ Entangled state detected" : entropy < 0.01 ? "Pure basis state" : "Superposition"}
                    </p>
                  </div>
                )
              })()}
            </div>
          </div>
        </div>
      </div>

      <DragOverlay>
        {dragGate && <GateChip name={dragGate} dragging />}
      </DragOverlay>
    </DndContext>
  )
}
