"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Send, Bot, User, Loader2, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import type { CircuitState } from "@/lib/quantum/circuit"

interface Message {
  role: "user" | "assistant"
  content: string
}

const SUGGESTED_QUESTIONS = [
  "What does this circuit do?",
  "Why did my qubit's probability change?",
  "What gate should I add next?",
  "Explain superposition in this context",
  "How do I create a Bell state?",
]

interface Props {
  circuit: CircuitState
}

export function QuantumTutor({ circuit }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || isStreaming) return

      setError(null)
      const userMsg: Message = { role: "user", content: trimmed }
      const history = [...messages, userMsg]
      setMessages(history)
      setInput("")
      setIsStreaming(true)

      // Placeholder for streaming
      setMessages((prev) => [...prev, { role: "assistant", content: "" }])

      abortRef.current = new AbortController()

      try {
        const res = await fetch("/api/tutor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: abortRef.current.signal,
          body: JSON.stringify({
            message: trimmed,
            circuit,
            history: messages, // send history before this turn
          }),
        })

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: "Unknown error" }))
          throw new Error(err.error ?? `HTTP ${res.status}`)
        }

        const reader = res.body?.getReader()
        if (!reader) throw new Error("No response body")

        const decoder = new TextDecoder()
        let accumulated = ""

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          accumulated += decoder.decode(value, { stream: true })
          const finalAccum = accumulated
          setMessages((prev) => {
            const updated = [...prev]
            updated[updated.length - 1] = { role: "assistant", content: finalAccum }
            return updated
          })
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return
        const msg = err instanceof Error ? err.message : "Something went wrong"
        setError(msg)
        setMessages((prev) => prev.slice(0, -1)) // remove empty assistant message
      } finally {
        setIsStreaming(false)
        abortRef.current = null
        inputRef.current?.focus()
      }
    },
    [messages, circuit, isStreaming],
  )

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      send(input)
    }
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-700/50 shrink-0">
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center">
          <Sparkles className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="text-sm font-semibold text-slate-200">QuantumTutor</span>
        <span className="text-xs text-slate-500 ml-auto">Circuit-aware AI</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-3 min-h-0">
        {messages.length === 0 && (
          <div className="flex flex-col gap-3 my-auto">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-600/20 border border-cyan-500/30 flex items-center justify-center mx-auto mb-3">
                <Sparkles className="w-6 h-6 text-cyan-400" />
              </div>
              <p className="text-sm text-slate-300 font-medium">Ask me anything about your circuit</p>
              <p className="text-xs text-slate-500 mt-1">I can see your gates and live quantum state</p>
            </div>
            <div className="flex flex-col gap-1.5">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  className="text-left text-xs px-3 py-2 rounded-lg border border-slate-700/50 bg-slate-800/40 text-slate-400 hover:text-slate-200 hover:border-slate-600 hover:bg-slate-800 transition-all"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} isLast={i === messages.length - 1 && isStreaming} />
        ))}

        {error && (
          <div className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-3 py-3 border-t border-slate-700/50 shrink-0">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isStreaming}
            placeholder="Ask about your circuit… (Enter to send)"
            rows={2}
            className={cn(
              "flex-1 resize-none text-sm rounded-xl px-3 py-2",
              "bg-slate-800/60 border border-slate-700/50",
              "text-slate-200 placeholder:text-slate-600",
              "focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50",
              "disabled:opacity-50 transition-colors",
            )}
          />
          <button
            onClick={() => send(input)}
            disabled={isStreaming || !input.trim()}
            className={cn(
              "p-2.5 rounded-xl transition-all",
              "bg-cyan-600 hover:bg-cyan-500 text-white",
              "disabled:opacity-40 disabled:cursor-not-allowed",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500",
            )}
            aria-label="Send message"
          >
            {isStreaming
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Send className="w-4 h-4" />
            }
          </button>
        </div>
      </div>
    </div>
  )
}

function MessageBubble({ message, isLast }: { message: Message; isLast: boolean }) {
  const isUser = message.role === "user"
  return (
    <div className={cn("flex gap-2", isUser && "flex-row-reverse")}>
      <div className={cn(
        "w-6 h-6 rounded-full shrink-0 flex items-center justify-center mt-0.5",
        isUser ? "bg-cyan-600" : "bg-gradient-to-br from-cyan-600 to-purple-600",
      )}>
        {isUser ? <User className="w-3 h-3 text-white" /> : <Bot className="w-3 h-3 text-white" />}
      </div>
      <div className={cn(
        "max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed",
        isUser
          ? "bg-cyan-600/20 text-slate-200 border border-cyan-600/30"
          : "bg-slate-800/60 text-slate-300 border border-slate-700/50",
      )}>
        {message.content || (isLast && (
          <span className="flex gap-0.5 items-center h-4">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: "300ms" }} />
          </span>
        ))}
        {message.content && (
          <FormattedText text={message.content} />
        )}
      </div>
    </div>
  )
}

function FormattedText({ text }: { text: string }) {
  // Light markdown: bold, inline code, newlines
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\n)/)
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={i} className="text-slate-100 font-semibold">{part.slice(2, -2)}</strong>
        }
        if (part.startsWith("`") && part.endsWith("`")) {
          return <code key={i} className="font-mono text-cyan-300 text-xs bg-slate-900/60 px-1 rounded">{part.slice(1, -1)}</code>
        }
        if (part === "\n") return <br key={i} />
        return <span key={i}>{part}</span>
      })}
    </>
  )
}
