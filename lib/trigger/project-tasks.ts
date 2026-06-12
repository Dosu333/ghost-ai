import type { ProjectAccessResult } from "@/lib/project-access"
import { getCurrentProjectIdentity, getProjectAccess } from "@/lib/project-access"
import { jsonError, requireAuthenticatedUser } from "@/lib/project-api"

interface GenerateArchitectureRequestBody {
  prompt?: unknown
}

export interface TriggerTaskHandleResponse {
  publicAccessToken: string
  runId: string
  taskIdentifier: string
}

export interface GenerateArchitectureTaskPayload {
  canvasJsonPath: string | null
  projectId: string
  projectName: string
  prompt: string
  requestedByUserId: string
}

export interface GenerateArchitectureTaskResult {
  acceptedAt: string
  message: string
  projectId: string
}

export interface GenerateSpecTaskPayload {
  canvasJsonPath: string | null
  projectId: string
  projectName: string
  requestedByUserId: string
}

export interface GenerateSpecTaskResult {
  acceptedAt: string
  message: string
  projectId: string
}

export interface TriggerProjectContext {
  project: ProjectAccessResult
  userId: string
}

export async function getTriggerProjectContext(
  projectId: string
): Promise<{
  context: TriggerProjectContext | null
  response: Response | null
}> {
  const authResult = await requireAuthenticatedUser()

  if (authResult.response || !authResult.userId) {
    return {
      context: null,
      response:
        authResult.response ??
        jsonError(401, "UNAUTHORIZED", "Authentication is required."),
    }
  }

  const identity = await getCurrentProjectIdentity()
  const project = await getProjectAccess(projectId, identity)

  if (!project) {
    return {
      context: null,
      response: jsonError(404, "NOT_FOUND", "Project not found."),
    }
  }

  return {
    context: {
      project,
      userId: authResult.userId,
    },
    response: null,
  }
}

export async function parseArchitectureGenerationRequest(request: Request) {
  let body: GenerateArchitectureRequestBody

  try {
    body = (await request.json()) as GenerateArchitectureRequestBody
  } catch {
    return {
      prompt: null,
      response: jsonError(400, "INVALID_JSON", "Request body must be valid JSON."),
    }
  }

  if (typeof body.prompt !== "string") {
    return {
      prompt: null,
      response: jsonError(400, "INVALID_PROMPT", "Prompt must be a string."),
    }
  }

  const prompt = body.prompt.trim()

  if (!prompt) {
    return {
      prompt: null,
      response: jsonError(400, "INVALID_PROMPT", "Prompt cannot be empty."),
    }
  }

  return {
    prompt,
    response: null,
  }
}

export function getTriggerTaskHandleResponse(handle: {
  id: string
  publicAccessToken: string
  taskIdentifier: string
}): TriggerTaskHandleResponse {
  return {
    publicAccessToken: handle.publicAccessToken,
    runId: handle.id,
    taskIdentifier: handle.taskIdentifier,
  }
}
