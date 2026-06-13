import { jsonError, requireAuthenticatedUser } from "@/lib/project-api"
import {
  createRunScopedPublicToken,
  getOwnedTaskRun,
  parseDesignTokenRequest,
} from "@/lib/trigger/design-agent"

export async function POST(request: Request) {
  const authResult = await requireAuthenticatedUser()

  if (authResult.response) {
    return authResult.response
  }

  if (!authResult.userId) {
    return jsonError(401, "UNAUTHORIZED", "Authentication is required.")
  }

  const bodyResult = await parseDesignTokenRequest(request)

  if (bodyResult.response) {
    return bodyResult.response
  }

  if (!bodyResult.runId) {
    return jsonError(400, "INVALID_RUN_ID", "Run ID must be provided.")
  }

  const taskRun = await getOwnedTaskRun(bodyResult.runId, authResult.userId)

  if (!taskRun) {
    return jsonError(404, "NOT_FOUND", "Task run not found.")
  }

  try {
    const token = await createRunScopedPublicToken(taskRun.runId)

    return Response.json({
      token,
    })
  } catch (error) {
    console.error("Failed to create design task token.", {
      error,
      projectId: taskRun.projectId,
      runId: taskRun.runId,
      userId: authResult.userId,
    })

    return jsonError(
      502,
      "TRIGGER_TOKEN_FAILED",
      "Unable to create a token for this task run."
    )
  }
}
