"use client"

import { GATE_DEFS, type GateDef } from "@/lib/quantum/gates"
import { cn } from "@/lib/utils"

interface Props {
  onDragStart: (gateId: GateDef) => void
  selectedGate: string | null
  onSelectGate: (gateId: string) => void
}

export function GatePalette({ onDragStart, selectedGate, onSelectGate }: Props) {
  const singleQubit = GATE_DEFS.filter((g) => g.qubits === 1)
  const twoQubit = GATE_DEFS.filter((g) => g.qubits === 2)

  return (
    <div className="flex flex-col gap-3 p-3 bg-slate-900/60 rounded-xl border border-slate-700/50 min-w-[140px]">
      <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold px-1">Gates</p>

      <GateGroup label="1-Qubit" gates={singleQubit} selectedGate={selectedGate} onDragStart={onDragStart} onSelectGate={onSelectGate} />
      <GateGroup label="2-Qubit" gates={twoQubit} selectedGate={selectedGate} onDragStart={onDragStart} onSelectGate={onSelectGate} />
    </div>
  )
}

function GateGroup({ label, gates, selectedGate, onDragStart, onSelectGate }: {
  label: string
  gates: GateDef[]
  selectedGate: string | null
  onDragStart: (g: GateDef) => void
  onSelectGate: (id: string) => void
}) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-[9px] uppercase tracking-wider text-slate-600 px-1">{label}</p>
      {gates.map((gate) => (
        <GateChip
          key={gate.id}
          gate={gate}
          isSelected={selectedGate === gate.id}
          onDragStart={() => onDragStart(gate)}
          onClick={() => onSelectGate(gate.id === selectedGate ? "" : gate.id)}
        />
      ))}
    </div>
  )
}

function GateChip({ gate, isSelected, onDragStart, onClick }: {
  gate: GateDef
  isSelected: boolean
  onDragStart: () => void
  onClick: () => void
}) {
  return (
    <button
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      title={gate.description}
      aria-label={`${gate.label} gate — ${gate.description}${isSelected ? " (selected)" : ""}`}
      aria-pressed={isSelected}
      className={cn(
        "flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm font-mono font-semibold",
        "border transition-all cursor-grab active:cursor-grabbing select-none",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500",
        isSelected
          ? "border-cyan-500 bg-cyan-500/20 text-cyan-300 shadow-[0_0_12px_rgba(56,189,248,0.4)]"
          : "border-slate-700 bg-slate-800/50 text-slate-300 hover:border-slate-500 hover:bg-slate-800",
      )}
    >
      <span className={cn("w-5 h-5 rounded flex items-center justify-center text-[10px] text-white shrink-0", gate.color)}>
        {gate.label.length <= 2 ? gate.label : gate.label.slice(0, 2)}
      </span>
      <span className="text-xs truncate">{gate.label}</span>
    </button>
  )
}
