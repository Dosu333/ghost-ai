import { auth } from "@trigger.dev/sdk"
import { z } from "zod"

import { getCurrentProjectIdentity, getProjectAccess } from "@/lib/project-access"
import { jsonError, requireAuthenticatedUser } from "@/lib/project-api"
import { prisma } from "@/lib/prisma"
import { aiChatFeedMessageSchema } from "@/types/tasks"

const canvasNodeSchema = z.object({
  data: z.object({
    color: z.string().trim().min(1),
    label: z.string(),
    shape: z.string().trim().min(1),
  }),
  height: z.number().finite().positive().optional(),
  id: z.string().trim().min(1),
  position: z.object({
    x: z.number().finite(),
    y: z.number().finite(),
  }),
  width: z.number().finite().positive().optional(),
})

const canvasEdgeSchema = z.object({
  data: z
    .object({
      label: z.string().optional(),
    })
    .optional(),
  id: z.string().trim().min(1),
  source: z.string().trim().min(1),
  sourceHandle: z.string().trim().min(1).optional(),
  target: z.string().trim().min(1),
  targetHandle: z.string().trim().min(1).optional(),
})

const specGenerationRequestSchema = z.object({
  chatHistory: z.array(aiChatFeedMessageSchema),
  edges: z.array(canvasEdgeSchema),
  nodes: z.array(canvasNodeSchema),
  roomId: z.string().trim().min(1),
})

export const generateSpecTaskPayloadSchema = specGenerationRequestSchema.extend({
  projectId: z.string().trim().min(1),
})

const specTokenRequestSchema = z.object({
  runId: z.string().trim().min(1),
})

export type GenerateSpecTaskPayload = z.infer<
  typeof generateSpecTaskPayloadSchema
>

export interface GenerateSpecTaskResult {
  generatedAt: string
  markdown: string
  projectId: string
  roomId: string
}

export interface SpecAgentContext {
  projectId: string
  roomId: string
  userId: string
}

function getValidationErrorMessage(error: z.ZodError) {
  const issue = error.issues[0]

  if (!issue) {
    return "Request body is invalid."
  }

  const path = issue.path.join(".")

  return path ? `${path}: ${issue.message}` : issue.message
}

export async function parseSpecGenerationRequest(request: Request) {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return {
      payload: null,
      response: jsonError(400, "INVALID_JSON", "Request body must be valid JSON."),
    }
  }

  const parsedBody = specGenerationRequestSchema.safeParse(body)

  if (!parsedBody.success) {
    return {
      payload: null,
      response: jsonError(
        400,
        "INVALID_SPEC_REQUEST",
        getValidationErrorMessage(parsedBody.error)
      ),
    }
  }

  return {
    payload: parsedBody.data,
    response: null,
  }
}

export async function getSpecAgentContext(
  roomId: string
): Promise<{
  context: SpecAgentContext | null
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
  const project = await getProjectAccess(roomId, identity)

  if (!project) {
    return {
      context: null,
      response: jsonError(404, "NOT_FOUND", "Project not found."),
    }
  }

  return {
    context: {
      projectId: project.id,
      roomId,
      userId: authResult.userId,
    },
    response: null,
  }
}

export async function parseSpecTokenRequest(request: Request) {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return {
      runId: null,
      response: jsonError(400, "INVALID_JSON", "Request body must be valid JSON."),
    }
  }

  const parsedBody = specTokenRequestSchema.safeParse(body)

  if (!parsedBody.success) {
    return {
      runId: null,
      response: jsonError(
        400,
        "INVALID_RUN_ID",
        getValidationErrorMessage(parsedBody.error)
      ),
    }
  }

  return {
    runId: parsedBody.data.runId,
    response: null,
  }
}

export async function recordSpecTaskRun(input: {
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

export async function getOwnedSpecTaskRun(runId: string, userId: string) {
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

export async function createSpecRunScopedPublicToken(runId: string) {
  return auth.createPublicToken({
    expirationTime: "1h",
    scopes: {
      read: {
        runs: [runId],
      },
    },
  })
}
