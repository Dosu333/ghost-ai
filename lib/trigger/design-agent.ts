import { auth } from "@trigger.dev/sdk"

import { getCurrentProjectIdentity, getProjectAccess } from "@/lib/project-access"
import { jsonError, requireAuthenticatedUser } from "@/lib/project-api"
import { prisma } from "@/lib/prisma"

interface DesignGenerationRequestBody {
  projectId?: unknown
  prompt?: unknown
  roomId?: unknown
}

interface DesignTokenRequestBody {
  runId?: unknown
}

export interface DesignAgentTaskPayload {
  prompt: string
  roomId: string
}

export interface DesignAgentTaskResult {
  echoedPrompt: string
  roomId: string
  startedAt: string
}

export interface DesignAgentContext {
  projectId: string
  userId: string
}

function parseRequiredStringField(
  value: unknown,
  code: string,
  message: string
): { response: Response | null; value: string | null } {
  if (typeof value !== "string") {
    return {
      response: jsonError(400, code, message),
      value: null,
    }
  }

  const normalizedValue = value.trim()

  if (!normalizedValue) {
    return {
      response: jsonError(400, code, message),
      value: null,
    }
  }

  return {
    response: null,
    value: normalizedValue,
  }
}

export async function getDesignAgentContext(
  projectId: string
): Promise<{
  context: DesignAgentContext | null
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
      response: jsonError(
        403,
        "FORBIDDEN",
        "You do not have access to this project."
      ),
    }
  }

  return {
    context: {
      projectId: project.id,
      userId: authResult.userId,
    },
    response: null,
  }
}

export async function parseDesignGenerationRequest(request: Request) {
  let body: DesignGenerationRequestBody

  try {
    body = (await request.json()) as DesignGenerationRequestBody
  } catch {
    return {
      payload: null,
      response: jsonError(400, "INVALID_JSON", "Request body must be valid JSON."),
    }
  }

  const promptResult = parseRequiredStringField(
    body.prompt,
    "INVALID_PROMPT",
    "Prompt must be a non-empty string."
  )

  if (promptResult.response || !promptResult.value) {
    return {
      payload: null,
      response: promptResult.response,
    }
  }

  const projectIdResult = parseRequiredStringField(
    body.projectId,
    "INVALID_PROJECT_ID",
    "Project ID must be a non-empty string."
  )

  if (projectIdResult.response || !projectIdResult.value) {
    return {
      payload: null,
      response: projectIdResult.response,
    }
  }

  const roomIdResult = parseRequiredStringField(
    body.roomId,
    "INVALID_ROOM_ID",
    "Room ID must be a non-empty string."
  )

  if (roomIdResult.response || !roomIdResult.value) {
    return {
      payload: null,
      response: roomIdResult.response,
    }
  }

  if (roomIdResult.value !== projectIdResult.value) {
    return {
      payload: null,
      response: jsonError(
        400,
        "ROOM_PROJECT_MISMATCH",
        "Room ID must match the project ID."
      ),
    }
  }

  return {
    payload: {
      projectId: projectIdResult.value,
      prompt: promptResult.value,
      roomId: roomIdResult.value,
    },
    response: null,
  }
}

export async function recordTaskRun(input: {
  projectId: string
  runId: string
  userId: string
}) {
  return prisma.taskRun.create({
    data: input,
    select: {
      runId: true,
    },
  })
}

export async function parseDesignTokenRequest(request: Request) {
  let body: DesignTokenRequestBody

  try {
    body = (await request.json()) as DesignTokenRequestBody
  } catch {
    return {
      runId: null,
      response: jsonError(400, "INVALID_JSON", "Request body must be valid JSON."),
    }
  }

  const runIdResult = parseRequiredStringField(
    body.runId,
    "INVALID_RUN_ID",
    "Run ID must be a non-empty string."
  )

  return {
    runId: runIdResult.value,
    response: runIdResult.response,
  }
}

export async function getOwnedTaskRun(runId: string, userId: string) {
  return prisma.taskRun.findFirst({
    where: {
      runId,
      userId,
    },
    select: {
      projectId: true,
      runId: true,
    },
  })
}

export async function createRunScopedPublicToken(runId: string) {
  return auth.createPublicToken({
    expirationTime: "1h",
    scopes: {
      read: {
        runs: [runId],
      },
    },
  })
}
