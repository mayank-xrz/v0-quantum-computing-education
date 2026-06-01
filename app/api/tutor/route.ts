import Anthropic from "@anthropic-ai/sdk"
import { NextRequest } from "next/server"
import type { CircuitState } from "@/lib/quantum/circuit"
import { circuitToPromptString, simulateCircuit } from "@/lib/quantum/circuit"

export const runtime = "nodejs"

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const TUTOR_SYSTEM = `You are QuantumTutor, an expert quantum computing educator embedded in an interactive circuit simulator. Your job is to help learners understand quantum mechanics and quantum computing by grounding every explanation in their actual circuit and its current quantum state.

Rules:
- Always refer to the user's specific circuit when explaining — never give purely generic answers.
- When a user asks "why", show the physics: state vector evolution, probability amplitudes, Born rule, unitarity.
- Be encouraging but rigorous. Correct misconceptions gently with evidence.
- Use Dirac notation (|ψ⟩, ⟨ψ|) naturally.
- Keep responses concise (2-5 short paragraphs) unless the user asks for depth.
- You can suggest next gates or experiments.
- Never hallucinate circuit state — use only what is provided in the context.`

const QUIZ_SYSTEM = `You are QuantumTutor in Quiz Mode. Your job is to test the learner's understanding of their current circuit through Socratic questioning.

Rules:
- When the learner first messages in quiz mode, ask ONE clear, specific question about their circuit that requires genuine understanding (not just recall). Make it connected to what their circuit actually does.
- When the learner answers, grade it: acknowledge what's right, gently correct what's wrong, and explain the correct reasoning with reference to their actual state vector or gate sequence.
- After grading, ask a follow-up question that builds on the last or explores a related concept.
- Questions should range from easy ("What is the probability of measuring |1⟩ here?") to deep ("Why does adding a second H gate restore the original state?").
- Be encouraging. Use Dirac notation. Keep questions and feedback short (1-3 paragraphs max).
- Never give away the answer before the learner tries.`

function buildCircuitContext(circuit: CircuitState): string {
  try {
    const sim = simulateCircuit(circuit)
    const probs = sim.probabilities
      .map((p, i) =>
        p > 0.001
          ? `|${i.toString(2).padStart(circuit.numQubits, "0")}⟩: ${(p * 100).toFixed(1)}%`
          : null,
      )
      .filter(Boolean)
      .join(", ")

    const blochStr =
      circuit.numQubits === 1
        ? (() => {
            const v = sim.stateVector.blochVector()
            return v
              ? `\nBloch vector: x=${v.x.toFixed(3)}, y=${v.y.toFixed(3)}, z=${v.z.toFixed(3)}`
              : ""
          })()
        : ""

    return `=== LIVE CIRCUIT CONTEXT ===
${circuitToPromptString(circuit)}
State vector: ${sim.stateVector.toKetString(3)}
Measurement probabilities: ${probs || `100% |${"0".repeat(circuit.numQubits)}⟩`}${blochStr}
===========================`
  } catch (e) {
    return `=== CIRCUIT ===\n${circuitToPromptString(circuit)}\n(Simulation error: ${e})\n`
  }
}

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      { error: "ANTHROPIC_API_KEY is not configured on the server. Add it to .env.local." },
      { status: 500 },
    )
  }

  let body: {
    message: string
    circuit: CircuitState
    history: { role: "user" | "assistant"; content: string }[]
    mode?: "tutor" | "quiz"
  }

  try {
    body = await req.json()
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 })
  }

  const { message, circuit, history, mode = "tutor" } = body

  if (!message?.trim()) {
    return Response.json({ error: "message is required." }, { status: 400 })
  }

  const circuitContext = buildCircuitContext(circuit)
  const userMessageWithContext = `${circuitContext}\n\nUser: ${message}`

  const messages: Anthropic.MessageParam[] = [
    ...history.map((h) => ({ role: h.role, content: h.content })),
    { role: "user", content: userMessageWithContext },
  ]

  let stream: ReturnType<typeof client.messages.stream>
  try {
    stream = client.messages.stream({
      model: "claude-opus-4-8",
      max_tokens: 1024,
      system: mode === "quiz" ? QUIZ_SYSTEM : TUTOR_SYSTEM,
      messages,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to start stream"
    return Response.json({ error: msg }, { status: 502 })
  }

  const encoder = new TextEncoder()

  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          if (
            chunk.type === "content_block_delta" &&
            chunk.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(chunk.delta.text))
          }
        }
      } catch (err) {
        // Surface error in the stream so the client can display it
        const msg = err instanceof Error ? err.message : "Streaming error"
        // Check for rate-limit / overload
        const isRateLimit =
          err instanceof Anthropic.RateLimitError ||
          err instanceof Anthropic.APIError
        const friendlyMsg = isRateLimit
          ? "The AI is busy right now. Please wait a moment and try again."
          : `Error: ${msg}`
        controller.enqueue(encoder.encode(`\n\n[${friendlyMsg}]`))
      } finally {
        controller.close()
      }
    },
  })

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "no-store",
    },
  })
}
