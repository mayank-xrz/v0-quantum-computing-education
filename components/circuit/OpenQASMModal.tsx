"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { X, Copy, Check, Upload, AlertCircle, CheckCircle, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import { toOpenQASM, fromOpenQASM } from "@/lib/quantum/openqasm"
import type { CircuitState } from "@/lib/quantum/circuit"

interface Props {
  circuit: CircuitState
  onClose: () => void
  onImport: (circuit: CircuitState) => void
}

type Tab = "export" | "import"

// ── Syntax highlight for OpenQASM ─────────────────────────────────────────────

function highlightQASM(code: string): string {
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

  return code
    .split("\n")
    .map((line) => {
      // Comments
      if (line.trimStart().startsWith("//")) {
        return `<span class="ql-comment">${esc(line)}</span>`
      }
      let out = esc(line)
      // Keywords / directives
      out = out.replace(
        /\b(OPENQASM|include|qreg|creg|qubit|bit|gate|measure|barrier|reset|if)\b/g,
        '<span class="ql-kw">$1</span>',
      )
      // Gate names
      out = out.replace(
        /\b(h|x|y|z|s|t|cx|cz|swap|rx|ry|rz|id)\b(?=\s*[\[(])/g,
        '<span class="ql-gate">$1</span>',
      )
      // Strings (include paths)
      out = out.replace(/"([^"]*)"/g, '<span class="ql-str">"$1"</span>')
      // Numbers
      out = out.replace(/\b(\d+\.?\d*(?:[eE][+-]?\d+)?)\b/g, '<span class="ql-num">$1</span>')
      return out
    })
    .join("\n")
}

const QASM_HIGHLIGHT_CSS = `
  .ql-kw      { color: #c084fc; font-weight: 600; }
  .ql-gate    { color: #38bdf8; }
  .ql-str     { color: #86efac; }
  .ql-comment { color: #64748b; font-style: italic; }
  .ql-num     { color: #fbbf24; }
`

// ── Export tab ────────────────────────────────────────────────────────────────

function ExportTab({ circuit }: { circuit: CircuitState }) {
  const [copied, setCopied] = useState(false)
  const code = toOpenQASM(circuit)
  const highlighted = highlightQASM(code)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const blob = new Blob([code], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "circuit.qasm"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Version badge */}
      <div className="flex items-center gap-2 px-5 py-2 border-b border-slate-800 shrink-0">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-cyan-400 border border-cyan-900 bg-cyan-950/40 rounded px-1.5 py-0.5">
          OpenQASM 2.0
        </span>
        <span className="text-xs text-slate-500">Valid for Qiskit, IBM Quantum, and most simulators</span>
      </div>

      {/* Code block */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <pre
          className="p-5 text-xs leading-relaxed font-mono text-slate-300 overflow-x-auto"
          aria-label="Generated OpenQASM 2.0 code"
          dangerouslySetInnerHTML={{ __html: highlighted }}
        />
      </div>

      {/* Footer */}
      <div className="flex items-center gap-2 px-5 py-3 border-t border-slate-800 shrink-0 flex-wrap">
        <button
          onClick={handleDownload}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200 border border-slate-700 hover:border-slate-600 transition-all"
        >
          <Upload className="w-3.5 h-3.5 rotate-180" />
          Download .qasm
        </button>
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
            <><Copy className="w-4 h-4" /> Copy QASM</>
          )}
        </button>
      </div>
    </div>
  )
}

// ── Import tab ────────────────────────────────────────────────────────────────

interface ImportTabProps {
  onImport: (circuit: CircuitState) => void
  onClose: () => void
}

function ImportTab({ onImport, onClose }: ImportTabProps) {
  const [text, setText] = useState("")
  const [status, setStatus] = useState<
    | { kind: "idle" }
    | { kind: "error"; message: string; line?: number }
    | { kind: "warnings"; warnings: string[]; circuit: CircuitState; version: string }
    | { kind: "ready"; circuit: CircuitState; version: string }
  >({ kind: "idle" })
  const fileRef = useRef<HTMLInputElement>(null)

  // Live validation as user types (debounced)
  useEffect(() => {
    if (text.trim() === "") { setStatus({ kind: "idle" }); return }
    const t = setTimeout(() => {
      const result = fromOpenQASM(text)
      if (!result.ok) {
        setStatus({ kind: "error", message: result.message, line: result.line })
      } else if (result.warnings.length > 0) {
        setStatus({ kind: "warnings", warnings: result.warnings, circuit: result.circuit, version: result.version })
      } else {
        setStatus({ kind: "ready", circuit: result.circuit, version: result.version })
      }
    }, 300)
    return () => clearTimeout(t)
  }, [text])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setText(ev.target?.result as string ?? "")
    reader.readAsText(file)
    // Reset so same file can be re-uploaded
    e.target.value = ""
  }

  const handleImport = useCallback(() => {
    if (status.kind === "ready" || status.kind === "warnings") {
      onImport(status.circuit)
      onClose()
    }
  }, [status, onImport, onClose])

  const canImport = status.kind === "ready" || status.kind === "warnings"
  const circuitSummary = canImport
    ? `${status.circuit.numQubits} qubit${status.circuit.numQubits !== 1 ? "s" : ""}, ${status.circuit.gates.length} gate${status.circuit.gates.length !== 1 ? "s" : ""}`
    : null

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-3 p-4">
      {/* File upload row */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200 border border-slate-700 hover:border-slate-600 transition-all"
        >
          <Upload className="w-3.5 h-3.5" />
          Load .qasm file
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".qasm,.txt"
          className="hidden"
          onChange={handleFileChange}
          aria-label="Load QASM file"
        />
        <span className="text-xs text-slate-600">or paste below</span>
      </div>

      {/* Textarea */}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={`OPENQASM 2.0;\ninclude "qelib1.inc";\n\nqreg q[2];\ncreg c[2];\n\nh q[0];\ncx q[0], q[1];\nmeasure q -> c;`}
        className={cn(
          "flex-1 min-h-[220px] resize-none rounded-xl border bg-slate-900/80 p-3 text-xs font-mono text-slate-300 leading-relaxed",
          "focus:outline-none focus:ring-2 placeholder:text-slate-700",
          "transition-colors",
          status.kind === "error"
            ? "border-red-700 focus:ring-red-700"
            : status.kind === "ready"
              ? "border-emerald-700 focus:ring-emerald-700"
              : status.kind === "warnings"
                ? "border-yellow-700 focus:ring-yellow-700"
                : "border-slate-700 focus:ring-cyan-700",
        )}
        spellCheck={false}
        aria-label="OpenQASM input"
        aria-describedby="qasm-status"
      />

      {/* Status / feedback */}
      <div id="qasm-status" className="shrink-0" aria-live="polite">
        {status.kind === "error" && (
          <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-red-950/50 border border-red-800 text-xs text-red-300">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>
              {status.line ? <strong>Line {status.line}: </strong> : null}
              {status.message}
            </span>
          </div>
        )}

        {status.kind === "warnings" && (
          <div className="flex flex-col gap-1.5 px-3 py-2 rounded-lg bg-yellow-950/50 border border-yellow-800 text-xs text-yellow-300">
            <div className="flex items-center gap-1.5 font-semibold">
              <Info className="w-3.5 h-3.5 shrink-0" />
              Ready to import ({circuitSummary}) — with {status.warnings.length} notice{status.warnings.length !== 1 ? "s" : ""}:
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-yellow-400/80">
              {status.warnings.map((w, i) => <li key={i}>{w}</li>)}
            </ul>
          </div>
        )}

        {status.kind === "ready" && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-950/50 border border-emerald-800 text-xs text-emerald-300">
            <CheckCircle className="w-3.5 h-3.5 shrink-0" />
            <span>
              Valid OpenQASM {status.version} — {circuitSummary}
            </span>
          </div>
        )}
      </div>

      {/* Import button */}
      <div className="flex justify-end shrink-0">
        <button
          onClick={handleImport}
          disabled={!canImport}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all",
            canImport
              ? "bg-cyan-600 hover:bg-cyan-500 text-white"
              : "bg-slate-800 text-slate-600 cursor-not-allowed",
          )}
          aria-disabled={!canImport}
        >
          Import circuit
        </button>
      </div>
    </div>
  )
}

// ── Modal shell ───────────────────────────────────────────────────────────────

export function OpenQASMModal({ circuit, onClose, onImport }: Props) {
  const [tab, setTab] = useState<Tab>("export")
  const overlayRef = useRef<HTMLDivElement>(null)

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [onClose])

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === overlayRef.current) onClose() }}
      role="dialog"
      aria-modal="true"
      aria-label="OpenQASM import / export"
    >
      <div className="w-full max-w-2xl bg-slate-950 border border-slate-700 rounded-2xl shadow-2xl flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-800 shrink-0">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/70" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
            <div className="w-3 h-3 rounded-full bg-green-500/70" />
          </div>

          {/* Tabs */}
          <nav className="flex items-center gap-1 ml-2" aria-label="Modal tabs">
            {(["export", "import"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                aria-current={tab === t ? "page" : undefined}
                className={cn(
                  "px-3 py-1 rounded text-xs font-medium capitalize transition-colors",
                  tab === t
                    ? "bg-slate-700 text-slate-100"
                    : "text-slate-500 hover:text-slate-300",
                )}
              >
                {t}
              </button>
            ))}
          </nav>

          <span className="flex-1 text-xs font-mono text-slate-500 text-center">
            OpenQASM 2.0 / 3.0
          </span>

          <button
            onClick={onClose}
            className="p-1 rounded text-slate-500 hover:text-slate-200 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab content */}
        <div className="flex flex-col flex-1 min-h-0">
          {tab === "export"
            ? <ExportTab circuit={circuit} />
            : <ImportTab onImport={onImport} onClose={onClose} />
          }
        </div>
      </div>

      <style>{QASM_HIGHLIGHT_CSS}</style>
    </div>
  )
}
