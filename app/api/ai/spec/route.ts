import { tasks } from "@trigger.dev/sdk"

import { jsonError } from "@/lib/project-api"
import {
  getSpecAgentContext,
  parseSpecGenerationRequest,
  recordSpecTaskRun,
} from "@/lib/trigger/spec-agent"
import type { generateSpecTask } from "@/trigger/generate-spec"

export async function POST(request: Request) {
  const bodyResult = await parseSpecGenerationRequest(request)

  if (bodyResult.response) {
    return bodyResult.response
  }

  if (!bodyResult.payload) {
    return jsonError(500, "INVALID_REQUEST", "Spec request payload is missing.")
  }

  const contextResult = await getSpecAgentContext(bodyResult.payload.roomId)

  if (contextResult.response) {
    return contextResult.response
  }

  if (!contextResult.context) {
    return jsonError(500, "PROJECT_CONTEXT_MISSING", "Project context is missing.")
  }

  let handle: { id: string }

  try {
    handle = await tasks.trigger<typeof generateSpecTask>("generate-spec", {
      chatHistory: bodyResult.payload.chatHistory,
      edges: bodyResult.payload.edges,
      nodes: bodyResult.payload.nodes,
      projectId: contextResult.context.projectId,
      roomId: contextResult.context.roomId,
    })
  } catch (error) {
    console.error("Failed to trigger spec generation task.", {
      error,
      roomId: bodyResult.payload.roomId,
      userId: contextResult.context.userId,
    })

    return jsonError(502, "TRIGGER_TASK_FAILED", "Unable to start the spec task.")
  }

  try {
    await recordSpecTaskRun({
      projectId: contextResult.context.projectId,
      runId: handle.id,
      userId: contextResult.context.userId,
    })
  } catch (error) {
    console.error("Failed to persist spec generation task run.", {
      error,
      projectId: contextResult.context.projectId,
      roomId: bodyResult.payload.roomId,
      runId: handle.id,
      userId: contextResult.context.userId,
    })

    return jsonError(
      500,
      "TASK_RUN_RECORD_FAILED",
      "Unable to save ownership for the spec task run."
    )
  }

  return Response.json(
    {
      runId: handle.id,
    },
    {
      status: 202,
    }
  )
}
