import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { generateText } from "ai"
import { logger, metadata, schemaTask } from "@trigger.dev/sdk"

import {
  publishSpecAgentStatus,
  setDesignAgentPresence,
} from "@/lib/design-agent-canvas"
import { persistGeneratedSpec } from "@/lib/spec-persistence"
import {
  generateSpecTaskPayloadSchema,
  type GenerateSpecTaskPayload,
  type GenerateSpecTaskResult,
} from "@/lib/trigger/spec-agent"

const AI_MODEL = "gemini-2.5-flash"
const GOOGLE_AI_API_KEY_ENV_NAMES = [
  "GOOGLE_GENERATIVE_AI_API_KEY",
  "GEMINI_API_KEY",
] as const

function getGoogleAiApiKey() {
  for (const envName of GOOGLE_AI_API_KEY_ENV_NAMES) {
    const value = process.env[envName]

    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim()
    }
  }

  throw new Error(
    "Google Generative AI is not configured. Set GOOGLE_GENERATIVE_AI_API_KEY or GEMINI_API_KEY in the Trigger task environment and restart the worker."
  )
}

function getGoogleAiModel(modelId: string) {
  const provider = createGoogleGenerativeAI({
    apiKey: getGoogleAiApiKey(),
  })

  return provider(modelId)
}

function formatChatHistory(payload: GenerateSpecTaskPayload) {
  if (payload.chatHistory.length === 0) {
    return "No prior AI workspace chat messages were provided."
  }

  return payload.chatHistory
    .map((message) => {
      const senderName = message.sender.name.trim()
      const senderRole = message.role

      return `- [${message.timestamp}] ${senderName} (${senderRole}): ${message.content}`
    })
    .join("\n")
}

function formatNodes(payload: GenerateSpecTaskPayload) {
  if (payload.nodes.length === 0) {
    return "No canvas nodes were provided."
  }

  return payload.nodes
    .map((node) => {
      const width = typeof node.width === "number" ? node.width : "auto"
      const height = typeof node.height === "number" ? node.height : "auto"

      return `- ${node.id}: "${node.data.label}" (${node.data.shape}, ${node.data.color}) at (${node.position.x}, ${node.position.y}), size ${width}x${height}`
    })
    .join("\n")
}

function formatEdges(payload: GenerateSpecTaskPayload) {
  if (payload.edges.length === 0) {
    return "No canvas edges were provided."
  }

  const nodeLabelById = new Map(
    payload.nodes.map((node) => [node.id, node.data.label.trim() || node.id])
  )

  return payload.edges
    .map((edge) => {
      const sourceLabel = nodeLabelById.get(edge.source) ?? edge.source
      const targetLabel = nodeLabelById.get(edge.target) ?? edge.target
      const edgeLabel = edge.data?.label?.trim()
      const labelSuffix = edgeLabel ? ` labeled "${edgeLabel}"` : ""
      const sourceHandle = edge.sourceHandle ? ` via ${edge.sourceHandle}` : ""
      const targetHandle = edge.targetHandle ? ` to ${edge.targetHandle}` : ""

      return `- ${edge.id}: ${sourceLabel} (${edge.source})${sourceHandle} -> ${targetLabel} (${edge.target})${targetHandle}${labelSuffix}`
    })
    .join("\n")
}

async function generateMarkdownSpec(payload: GenerateSpecTaskPayload) {
  const result = await generateText({
    model: getGoogleAiModel(AI_MODEL),
    prompt: [
      "Create a Markdown technical specification for a collaborative system design workspace.",
      "Use only the provided canvas graph and chat history as source material.",
      "Be concrete and implementation-oriented, but do not invent infrastructure that is unsupported by the input.",
      "If information is missing, call it out explicitly as an assumption or open question.",
      "",
      "Required sections:",
      "1. Title",
      "2. Overview",
      "3. Architecture Summary",
      "4. Components",
      "5. Data Flow and Integrations",
      "6. Operational Considerations",
      "7. Risks and Open Questions",
      "",
      `Project ID: ${payload.projectId}`,
      `Room ID: ${payload.roomId}`,
      "",
      "Chat history:",
      formatChatHistory(payload),
      "",
      "Canvas nodes:",
      formatNodes(payload),
      "",
      "Canvas edges:",
      formatEdges(payload),
      "",
      "Return Markdown only.",
    ].join("\n"),
    providerOptions: {
      google: {
        thinkingConfig: {
          thinkingBudget: 512,
        },
      },
    },
    system:
      "You are Ghost AI, a senior systems architect. Produce crisp Markdown documentation grounded in the supplied collaborative architecture context.",
  })

  const markdown = result.text.trim()

  if (!markdown) {
    throw new Error("Ghost AI returned an empty spec draft.")
  }

  return markdown
}

export const generateSpecTask = schemaTask({
  id: "generate-spec",
  retry: {
    factor: 1.8,
    maxAttempts: 3,
    maxTimeoutInMs: 30_000,
    minTimeoutInMs: 500,
    randomize: false,
  },
  schema: generateSpecTaskPayloadSchema,
  run: async (
    payload: GenerateSpecTaskPayload,
    { ctx }
  ): Promise<GenerateSpecTaskResult> => {
    const runId = ctx.run.id

    metadata
      .set("scope", "spec")
      .set("status", "started")
      .set("projectId", payload.projectId)
      .set("roomId", payload.roomId)
      .set("chatMessageCount", payload.chatHistory.length)
      .set("nodeCount", payload.nodes.length)
      .set("edgeCount", payload.edges.length)

    await publishSpecAgentStatus({
      message: "Ghost AI started generating a technical spec from the current canvas.",
      roomId: payload.roomId,
      runId,
      status: "started",
    })
    await setDesignAgentPresence({
      cursor: null,
      roomId: payload.roomId,
      thinking: true,
      ttl: 120,
    })

    try {
      metadata.set("status", "processing")

      await publishSpecAgentStatus({
        message: "Ghost AI is reviewing the canvas graph and AI chat context.",
        roomId: payload.roomId,
        runId,
        status: "processing",
      })

      const markdown = await generateMarkdownSpec(payload)

      metadata
        .set("status", "persisting")
        .set("markdownLength", markdown.length)

      await publishSpecAgentStatus({
        message: "Ghost AI is saving the generated Markdown spec.",
        roomId: payload.roomId,
        runId,
        status: "processing",
      })

      const persistedSpec = await persistGeneratedSpec({
        markdown,
        projectId: payload.projectId,
      })

      metadata
        .set("status", "complete")
        .set("specFilePath", persistedSpec.filePath)
        .set("specId", persistedSpec.id)

      await publishSpecAgentStatus({
        message: "Ghost AI finished generating a Markdown technical spec draft.",
        roomId: payload.roomId,
        runId,
        status: "complete",
      })

      return {
        filePath: persistedSpec.filePath,
        generatedAt: new Date().toISOString(),
        markdown,
        projectId: payload.projectId,
        roomId: payload.roomId,
        specId: persistedSpec.id,
      }
    } catch (error) {
      logger.error("Spec generation task failed.", {
        error,
        projectId: payload.projectId,
        roomId: payload.roomId,
        runId,
      })

      metadata
        .set("status", "error")
        .set(
          "errorMessage",
          error instanceof Error
            ? error.message
            : "Ghost AI could not generate the spec."
        )

      await publishSpecAgentStatus({
        message:
          error instanceof Error
            ? error.message
            : "Ghost AI could not generate the spec.",
        roomId: payload.roomId,
        runId,
        status: "error",
      }).catch(() => {})

      throw error
    } finally {
      await setDesignAgentPresence({
        cursor: null,
        roomId: payload.roomId,
        thinking: false,
        ttl: 2,
      }).catch(() => {})
    }
  },
})
