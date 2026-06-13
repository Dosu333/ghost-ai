import { AI_STATUS_FEED_ID, type AiStatusFeedMessage } from "@/types/tasks"

export const GHOST_AI_AGENT_ID = "ghost-ai-agent"
export const GHOST_AI_AGENT_NAME = "Ghost AI"
export const GHOST_AI_AGENT_COLOR = "#6457f9"

export const AI_STATUS_KINDS = [
  "started",
  "processing",
  "complete",
  "error",
] as const

export type AiStatusKind = (typeof AI_STATUS_KINDS)[number]

export interface AiStatusEvent {
  type: "ai-status"
  eventId: string
  feedId: typeof AI_STATUS_FEED_ID
  data: AiStatusFeedMessage
}
