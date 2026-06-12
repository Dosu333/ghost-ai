import { tasks } from "@trigger.dev/sdk"

import {
  getTriggerProjectContext,
  getTriggerTaskHandleResponse,
} from "@/lib/trigger/project-tasks"
import { jsonError } from "@/lib/project-api"
import type { generateSpecTask } from "@/trigger/generate-spec"

interface GenerateSpecRouteContext {
  params: Promise<{
    projectId: string
  }>
}

export async function POST(
  _request: Request,
  context: GenerateSpecRouteContext
) {
  const { projectId } = await context.params
  const projectContext = await getTriggerProjectContext(projectId)

  if (projectContext.response) {
    return projectContext.response
  }

  if (!projectContext.context) {
    return jsonError(500, "PROJECT_CONTEXT_MISSING", "Project context is missing.")
  }

  try {
    const handle = await tasks.trigger<typeof generateSpecTask>("generate-spec", {
      canvasJsonPath: projectContext.context.project.canvasJsonPath,
      projectId,
      projectName: projectContext.context.project.name,
      requestedByUserId: projectContext.context.userId,
    })

    return Response.json(getTriggerTaskHandleResponse(handle), {
      status: 202,
    })
  } catch (error) {
    console.error("Failed to trigger spec generation.", {
      error,
      projectId,
      userId: projectContext.context.userId,
    })

    return jsonError(
      502,
      "TRIGGER_TASK_FAILED",
      "Unable to start the spec generation task."
    )
  }
}
