import Anthropic from "@anthropic-ai/sdk"
import { NextRequest } from "next/server"
import type { CircuitState } from "@/lib/quantum/circuit"
import { circuitToPromptString, simulateCircuit } from "@/lib/quantum/circuit"

export const runtime = "nodejs"

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const SYSTEM_PROMPT = `You are QuantumTutor, an expert quantum computing educator embedded in an interactive circuit simulator. Your job is to help learners understand quantum mechanics and quantum computing by grounding every explanation in their actual circuit and its current quantum state.

Rules:
- Always refer to the user's specific circuit when explaining — never give purely generic answers.
- When a user asks "why", show the physics: state vector evolution, probability amplitudes, Born rule, unitarity.
- Be encouraging but rigorous. Correct misconceptions gently with evidence.
- Use Dirac notation (|ψ⟩, ⟨ψ|) naturally.
- Keep responses concise (2-5 paragraphs max) unless the user asks for depth.
- You can suggest next gates or experiments directly in the circuit.
- Use bullet points and short math expressions inline where helpful.
- Never hallucinate circuit state — use only what is provided in the context.`

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "ANTHROPIC_API_KEY not configured on server." }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    )
  }

  let body: {
    message: string
    circuit: CircuitState
    history: { role: "user" | "assistant"; content: string }[]
  }

  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  }

  const { message, circuit, history } = body

  if (!message || typeof message !== "string") {
    return new Response(JSON.stringify({ error: "message is required." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  }

  // Simulate the circuit to get live state for context
  let circuitContext = ""
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

    const bloch =
      circuit.numQubits === 1
        ? (() => {
            const v = sim.stateVector.blochVector()
            return v
              ? `\nBloch vector: x=${v.x.toFixed(3)}, y=${v.y.toFixed(3)}, z=${v.z.toFixed(3)}`
              : ""
          })()
        : ""

    circuitContext = `
=== USER'S CURRENT CIRCUIT ===
${circuitToPromptString(circuit)}
State vector: ${sim.stateVector.toKetString(3)}
Measurement probabilities: ${probs || "100% |" + "0".repeat(circuit.numQubits) + "⟩"}${bloch}
==============================`
  } catch (e) {
    circuitContext = `\n=== CIRCUIT ===\n${circuitToPromptString(circuit)}\n(Simulation error: ${e})\n`
  }

  // Inject circuit context into the user's message
  const userMessageWithContext = `${circuitContext}\n\nUser question: ${message}`

  const messages: Anthropic.MessageParam[] = [
    ...history.map((h) => ({
      role: h.role,
      content: h.content,
    })),
    { role: "user", content: userMessageWithContext },
  ]

  // Stream the response back
  const stream = client.messages.stream({
    model: "claude-opus-4-8",
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages,
  })

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
        const msg =
          err instanceof Error ? err.message : "Streaming error occurred."
        controller.enqueue(encoder.encode(`\n\n[Error: ${msg}]`))
      } finally {
        controller.close()
      }
    },
  })

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  })
}
