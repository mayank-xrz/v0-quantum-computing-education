"use client"

import { useState, useEffect, useRef } from "react"
import { X, Copy, Check, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"
import { toQiskit, highlightPython } from "@/lib/quantum/qiskit-export"
import type { CircuitState } from "@/lib/quantum/circuit"

interface Props {
  circuit: CircuitState
  onClose: () => void
}

export function QiskitExportModal({ circuit, onClose }: Props) {
  const [copied, setCopied] = useState(false)
  const code = toQiskit(circuit)
  const highlighted = highlightPython(code)
  const overlayRef = useRef<HTMLDivElement>(null)

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [onClose])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    /* backdrop */
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === overlayRef.current) onClose() }}
    >
      <div className="w-full max-w-2xl bg-slate-950 border border-slate-700 rounded-2xl shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-800 shrink-0">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/70" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
            <div className="w-3 h-3 rounded-full bg-green-500/70" />
          </div>
          <span className="flex-1 text-xs font-mono text-slate-400 text-center">
            circuit.py — Qiskit 1.x
          </span>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-500 hover:text-slate-200 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Code block */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <pre
            className="p-5 text-xs leading-relaxed font-mono text-slate-300 overflow-x-auto"
            aria-label="Generated Qiskit Python code"
            dangerouslySetInnerHTML={{ __html: highlighted }}
          />
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 px-5 py-3 border-t border-slate-800 shrink-0 flex-wrap">
          <a
            href="https://docs.quantum.ibm.com/api/qiskit"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-cyan-400 transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            Qiskit docs
          </a>
          <a
            href="https://quantum.ibm.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-cyan-400 transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            Run on IBM Quantum
          </a>
          <div className="flex-1" />
          <button
            onClick={handleCopy}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all",
              copied
                ? "bg-emerald-600 text-white"
                : "bg-cyan-600 hover:bg-cyan-500 text-white",
            )}
          >
            {copied ? (
              <><Check className="w-4 h-4" /> Copied!</>
            ) : (
              <><Copy className="w-4 h-4" /> Copy code</>
            )}
          </button>
        </div>
      </div>

      {/* Syntax highlight CSS */}
      <style>{`
        .hl-kw      { color: #c084fc; font-weight: 600; }
        .hl-str     { color: #86efac; }
        .hl-comment { color: #64748b; font-style: italic; }
        .hl-num     { color: #fbbf24; }
        .hl-builtin { color: #38bdf8; }
      `}</style>
    </div>
  )
}
