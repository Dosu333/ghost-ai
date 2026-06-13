import { z } from "zod"

const AI_STATUS_PHASES = [
  "started",
  "processing",
  "complete",
  "error",
] as const

const AI_STATUS_SCOPES = ["design", "spec"] as const
const AI_CHAT_ROLES = ["user", "assistant"] as const

export const AI_STATUS_FEED_ID = "ai-status-feed"
export const AI_CHAT_FEED_ID = "ai-chat"

export type AiStatusPhase = (typeof AI_STATUS_PHASES)[number]
export type AiStatusScope = (typeof AI_STATUS_SCOPES)[number]
export type AiChatRole = (typeof AI_CHAT_ROLES)[number]

export interface AiStatusFeedMessage {
  runId: string
  scope?: AiStatusScope
  status: AiStatusPhase
  text?: string
  timestamp: string
}

export const aiChatFeedMessageSchema = z.object({
  sender: z.object({
    id: z.string().trim().min(1),
    name: z.string().trim().min(1),
    email: z.string().trim().email().optional(),
    avatar: z.string().trim().min(1).optional(),
    color: z.string().trim().min(1).optional(),
  }),
  role: z.enum(AI_CHAT_ROLES),
  content: z.string().trim().min(1),
  timestamp: z.string().datetime({ offset: true }),
})

export type AiChatFeedMessage = z.infer<typeof aiChatFeedMessageSchema>

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

export function parseAiChatFeedMessage(value: unknown): AiChatFeedMessage | null {
  const parsedValue = aiChatFeedMessageSchema.safeParse(value)

  if (!parsedValue.success) {
    return null
  }

  return parsedValue.data
}

export function parseAiStatusFeedMessage(
  value: unknown,
): AiStatusFeedMessage | null {
  if (!isRecord(value)) {
    return null
  }

  const runId = value.runId
  const scope = value.scope
  const status = value.status
  const text = value.text
  const timestamp = value.timestamp

  if (typeof runId !== "string" || runId.trim().length === 0) {
    return null
  }

  if (
    typeof status !== "string" ||
    !AI_STATUS_PHASES.includes(status as AiStatusPhase)
  ) {
    return null
  }

  if (typeof timestamp !== "string" || timestamp.trim().length === 0) {
    return null
  }

  if (text !== undefined && typeof text !== "string") {
    return null
  }

  if (
    scope !== undefined &&
    (typeof scope !== "string" ||
      !AI_STATUS_SCOPES.includes(scope as AiStatusScope))
  ) {
    return null
  }

  return {
    runId,
    scope: scope as AiStatusScope | undefined,
    status: status as AiStatusPhase,
    text,
    timestamp,
  }
}

export function isAiStatusActive(
  status: Pick<AiStatusFeedMessage, "status"> | null | undefined,
) {
  return status?.status === "started" || status?.status === "processing"
}
