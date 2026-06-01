"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Send, Bot, User, Loader2, Sparkles, Brain, RefreshCw, HelpCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import type { CircuitState } from "@/lib/quantum/circuit"

interface Message {
  role: "user" | "assistant"
  content: string
}

type TutorMode = "tutor" | "quiz"

const QUICK_ACTIONS = [
  { label: "Explain my last move", message: "Explain what the last gate I added does to the quantum state, and why." },
  { label: "What should I try next?", message: "Based on my current circuit, what gate or operation should I add next to make it more interesting or to learn something new?" },
  { label: "Show me the math", message: "Walk me through the exact state vector calculation for my circuit step by step, showing the matrix multiplication." },
  { label: "What's the Bloch sphere telling me?", message: "Explain what the current Bloch sphere position means physically for my qubit." },
]

const STARTER_QUESTIONS = [
  "What does this circuit do?",
  "Why does the probability change when I add H?",
  "How do I create entanglement?",
  "Explain superposition in this context",
]

interface Props {
  circuit: CircuitState
}

export function QuantumTutor({ circuit }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<TutorMode>("tutor")
  const [retryCount, setRetryCount] = useState(0)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const lastMessageRef = useRef<string>("")

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const send = useCallback(
    async (text: string, retrying = false) => {
      const trimmed = text.trim()
      if (!trimmed || isStreaming) return

      setError(null)
      setRetryCount(0)

      const userMsg: Message = { role: "user", content: trimmed }
      const history = retrying ? messages.slice(0, -1) : [...messages]
      const newMessages = [...history, userMsg]
      setMessages([...newMessages, { role: "assistant", content: "" }])
      if (!retrying) setInput("")
      lastMessageRef.current = trimmed

      setIsStreaming(true)
      abortRef.current = new AbortController()

      try {
        const res = await fetch("/api/tutor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: abortRef.current.signal,
          body: JSON.stringify({
            message: trimmed,
            circuit,
            history, // history does NOT include current user msg
            mode,
          }),
        })

        if (!res.ok) {
          const errBody = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
          throw new Error(errBody.error ?? `HTTP ${res.status}`)
        }

        const reader = res.body?.getReader()
        if (!reader) throw new Error("No response body")

        const decoder = new TextDecoder()
        let accumulated = ""

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          accumulated += decoder.decode(value, { stream: true })
          const snapshot = accumulated
          setMessages((prev) => {
            const updated = [...prev]
            updated[updated.length - 1] = { role: "assistant", content: snapshot }
            return updated
          })
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return
        const msg = err instanceof Error ? err.message : "Something went wrong"
        setError(msg)
        setMessages((prev) => prev.slice(0, -1)) // remove empty assistant msg
      } finally {
        setIsStreaming(false)
        abortRef.current = null
        inputRef.current?.focus()
      }
    },
    [messages, circuit, isStreaming, mode],
  )

  const handleRetry = () => {
    if (lastMessageRef.current) {
      setRetryCount((c) => c + 1)
      send(lastMessageRef.current, true)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      send(input)
    }
  }

  const startQuiz = () => {
    setMode("quiz")
    setMessages([])
    send("Start a quiz about my current circuit. Ask me one question to test my understanding of what this circuit does and why.", false)
  }

  const resetConversation = () => {
    abortRef.current?.abort()
    setMessages([])
    setError(null)
    setInput("")
    setIsStreaming(false)
    setMode("tutor")
  }

  const hasMessages = messages.length > 0

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-slate-700/50 shrink-0">
        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center">
          <Sparkles className="w-2.5 h-2.5 text-white" />
        </div>
        <span className="text-xs font-semibold text-slate-200">QuantumTutor</span>
        {mode === "quiz" && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-600/30 text-purple-300 border border-purple-500/30 font-semibold">
            QUIZ
          </span>
        )}
        <div className="flex-1" />
        {hasMessages && (
          <button
            onClick={resetConversation}
            className="p-1 rounded text-slate-500 hover:text-slate-300 transition-colors"
            title="New conversation"
            aria-label="Reset conversation"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        )}
        <button
          onClick={startQuiz}
          disabled={isStreaming}
          title="Quiz me on my circuit"
          className={cn(
            "p-1 rounded transition-colors",
            mode === "quiz"
              ? "text-purple-400"
              : "text-slate-500 hover:text-purple-400",
          )}
          aria-label="Start quiz mode"
        >
          <Brain className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Quick actions (shown when no messages) */}
      {!hasMessages && (
        <div className="px-3 py-2 border-b border-slate-800/50 shrink-0">
          <p className="text-[10px] text-slate-600 uppercase tracking-wider mb-1.5">Quick actions</p>
          <div className="flex flex-col gap-1">
            {QUICK_ACTIONS.map((a) => (
              <button
                key={a.label}
                onClick={() => send(a.message)}
                className="text-left text-[11px] px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-900/40 text-slate-400 hover:text-cyan-300 hover:border-cyan-900/60 hover:bg-cyan-950/20 transition-all"
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-3 min-h-0">
        {!hasMessages && (
          <div className="flex flex-col gap-2 mt-2">
            <p className="text-[10px] text-slate-600 uppercase tracking-wider">Or ask anything</p>
            {STARTER_QUESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => send(q)}
                className="text-left text-[11px] px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-900/30 text-slate-500 hover:text-slate-300 hover:border-slate-700 transition-all"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {messages.map((msg, i) => (
          <MessageBubble
            key={i}
            message={msg}
            isStreaming={i === messages.length - 1 && isStreaming}
          />
        ))}

        {error && (
          <div className="flex flex-col gap-2 text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
            <span>{error}</span>
            {retryCount < 3 && (
              <button
                onClick={handleRetry}
                className="flex items-center gap-1.5 text-red-300 hover:text-red-200 transition-colors"
              >
                <RefreshCw className="w-3 h-3" /> Retry
              </button>
            )}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-3 py-2.5 border-t border-slate-700/50 shrink-0">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isStreaming}
            placeholder={
              mode === "quiz"
                ? "Type your answer… (Enter to submit)"
                : "Ask about your circuit… (Enter to send)"
            }
            rows={2}
            className={cn(
              "flex-1 resize-none text-xs rounded-xl px-3 py-2",
              "bg-slate-800/60 border",
              "text-slate-200 placeholder:text-slate-600",
              "focus:outline-none focus:ring-2 transition-colors",
              mode === "quiz"
                ? "border-purple-700/50 focus:ring-purple-500/40 focus:border-purple-600/50"
                : "border-slate-700/50 focus:ring-cyan-500/40 focus:border-cyan-600/50",
              "disabled:opacity-50",
            )}
          />
          <button
            onClick={() => send(input)}
            disabled={isStreaming || !input.trim()}
            className={cn(
              "p-2.5 rounded-xl transition-all text-white",
              "disabled:opacity-40 disabled:cursor-not-allowed",
              "focus-visible:outline-none focus-visible:ring-2",
              mode === "quiz"
                ? "bg-purple-600 hover:bg-purple-500 focus-visible:ring-purple-500"
                : "bg-cyan-600 hover:bg-cyan-500 focus-visible:ring-cyan-500",
            )}
            aria-label="Send message"
          >
            {isStreaming
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : mode === "quiz"
                ? <HelpCircle className="w-4 h-4" />
                : <Send className="w-4 h-4" />
            }
          </button>
        </div>
        {mode === "quiz" && (
          <p className="text-[10px] text-purple-400/60 mt-1.5 text-center">
            Quiz mode active — the tutor will grade your answers
          </p>
        )}
      </div>
    </div>
  )
}

function MessageBubble({
  message,
  isStreaming,
}: {
  message: Message
  isStreaming: boolean
}) {
  const isUser = message.role === "user"
  return (
    <div className={cn("flex gap-2", isUser && "flex-row-reverse")}>
      <div
        className={cn(
          "w-5 h-5 rounded-full shrink-0 flex items-center justify-center mt-0.5",
          isUser
            ? "bg-cyan-700"
            : "bg-gradient-to-br from-cyan-600 to-purple-600",
        )}
      >
        {isUser ? (
          <User className="w-2.5 h-2.5 text-white" />
        ) : (
          <Bot className="w-2.5 h-2.5 text-white" />
        )}
      </div>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed",
          isUser
            ? "bg-cyan-700/20 text-slate-200 border border-cyan-700/30"
            : "bg-slate-800/60 text-slate-300 border border-slate-700/50",
        )}
      >
        {!message.content && isStreaming ? (
          <span className="flex gap-0.5 items-center h-3.5">
            {[0, 150, 300].map((d) => (
              <span
                key={d}
                className="w-1 h-1 rounded-full bg-slate-500 animate-bounce"
                style={{ animationDelay: `${d}ms` }}
              />
            ))}
          </span>
        ) : (
          <FormattedText text={message.content} />
        )}
      </div>
    </div>
  )
}

function FormattedText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\n)/)
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**"))
          return (
            <strong key={i} className="text-slate-100 font-semibold">
              {part.slice(2, -2)}
            </strong>
          )
        if (part.startsWith("`") && part.endsWith("`"))
          return (
            <code
              key={i}
              className="font-mono text-cyan-300 bg-slate-900/60 px-1 rounded"
            >
              {part.slice(1, -1)}
            </code>
          )
        if (part === "\n") return <br key={i} />
        return <span key={i}>{part}</span>
      })}
    </>
  )
}
