import { tasks } from "@trigger.dev/sdk"

import { jsonError } from "@/lib/project-api"
import {
  createRunScopedPublicToken,
  getDesignAgentContext,
  parseDesignGenerationRequest,
  recordTaskRun,
} from "@/lib/trigger/design-agent"
import type { designAgentTask } from "@/trigger/design-agent"

export async function POST(request: Request) {
  const bodyResult = await parseDesignGenerationRequest(request)

  if (bodyResult.response) {
    return bodyResult.response
  }

  if (!bodyResult.payload) {
    return jsonError(500, "INVALID_REQUEST", "Design request payload is missing.")
  }

  const contextResult = await getDesignAgentContext(bodyResult.payload.projectId)

  if (contextResult.response) {
    return contextResult.response
  }

  if (!contextResult.context) {
    return jsonError(500, "PROJECT_CONTEXT_MISSING", "Project context is missing.")
  }

  let handle: { id: string }

  try {
    handle = await tasks.trigger<typeof designAgentTask>("design-agent", {
      prompt: bodyResult.payload.prompt,
      roomId: bodyResult.payload.roomId,
    })
  } catch (error) {
    console.error("Failed to trigger design agent task.", {
      error,
      projectId: bodyResult.payload.projectId,
      userId: contextResult.context.userId,
    })

    return jsonError(502, "TRIGGER_TASK_FAILED", "Unable to start the design task.")
  }

  let publicToken: string

  try {
    publicToken = await createRunScopedPublicToken(handle.id)
  } catch (error) {
    console.error("Failed to create design agent public token.", {
      error,
      projectId: bodyResult.payload.projectId,
      runId: handle.id,
      userId: contextResult.context.userId,
    })

    return jsonError(
      502,
      "TRIGGER_TOKEN_FAILED",
      "Unable to create a token for the design task."
    )
  }

  try {
    await recordTaskRun({
      projectId: contextResult.context.projectId,
      runId: handle.id,
      userId: contextResult.context.userId,
    })
  } catch (error) {
    console.error("Failed to persist design agent task run.", {
      error,
      projectId: bodyResult.payload.projectId,
      runId: handle.id,
      userId: contextResult.context.userId,
    })
  }

  return Response.json(
    {
      publicToken,
      runId: handle.id,
    },
    {
      status: 202,
    }
  )
}
