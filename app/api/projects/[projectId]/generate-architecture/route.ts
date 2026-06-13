import { tasks } from "@trigger.dev/sdk"

import {
  getTriggerProjectContext,
  getTriggerTaskHandleResponse,
  parseArchitectureGenerationRequest,
} from "@/lib/trigger/project-tasks"
import { jsonError } from "@/lib/project-api"

interface GenerateArchitectureRouteContext {
  params: Promise<{
    projectId: string
  }>
}

export async function POST(
  request: Request,
  context: GenerateArchitectureRouteContext
) {
  const { projectId } = await context.params
  const projectContext = await getTriggerProjectContext(projectId)

  if (projectContext.response) {
    return projectContext.response
  }

  if (!projectContext.context) {
    return jsonError(500, "PROJECT_CONTEXT_MISSING", "Project context is missing.")
  }

  const bodyResult = await parseArchitectureGenerationRequest(request)

  if (bodyResult.response) {
    return bodyResult.response
  }

  if (!bodyResult.prompt) {
    return jsonError(400, "INVALID_PROMPT", "Prompt cannot be empty.")
  }

  try {
    const handle = await tasks.trigger("generate-architecture", {
      canvasJsonPath: projectContext.context.project.canvasJsonPath,
      projectId,
      projectName: projectContext.context.project.name,
      prompt: bodyResult.prompt,
      requestedByUserId: projectContext.context.userId,
    })

    return Response.json(getTriggerTaskHandleResponse(handle), {
      status: 202,
    })
  } catch (error) {
    console.error("Failed to trigger architecture generation.", {
      error,
      projectId,
      userId: projectContext.context.userId,
    })

    return jsonError(
      502,
      "TRIGGER_TASK_FAILED",
      "Unable to start the architecture generation task."
    )
  }
}
