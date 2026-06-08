import { auth } from "@clerk/nextjs/server"

import { prisma } from "@/lib/prisma"

const DEFAULT_PROJECT_NAME = "Untitled Project"

interface ApiErrorBody {
  error: {
    code: string
    message: string
  }
}

interface ProjectBodyInput {
  id?: unknown
  name?: unknown
}

interface ParseProjectBodyOptions {
  defaultName?: string
  allowId?: boolean
}

interface ParsedProjectBody {
  id: string | null
  name: string | null
  response: Response | null
}

const PROJECT_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

function parseOptionalProjectId(id: unknown) {
  if (id === undefined) {
    return { id: null, response: null }
  }

  if (typeof id !== "string") {
    return {
      id: null,
      response: jsonError(400, "INVALID_ID", "Project ID must be a string."),
    }
  }

  const normalizedId = id.trim()

  if (!normalizedId) {
    return {
      id: null,
      response: jsonError(400, "INVALID_ID", "Project ID cannot be empty."),
    }
  }

  if (!PROJECT_ID_PATTERN.test(normalizedId)) {
    return {
      id: null,
      response: jsonError(
        400,
        "INVALID_ID",
        "Project ID must use lowercase letters, numbers, and hyphens."
      ),
    }
  }

  return { id: normalizedId, response: null }
}

export function jsonError(
  status: number,
  code: string,
  message: string
): Response {
  const body: ApiErrorBody = {
    error: {
      code,
      message,
    },
  }

  return Response.json(body, { status })
}

export async function requireAuthenticatedUser() {
  const { userId } = await auth()

  if (!userId) {
    return {
      userId: null,
      response: jsonError(401, "UNAUTHORIZED", "Authentication is required."),
    }
  }

  return { userId, response: null }
}

export async function parseProjectBody(
  request: Request,
  options: ParseProjectBodyOptions = {}
): Promise<ParsedProjectBody> {
  let body: ProjectBodyInput

  try {
    body = (await request.json()) as ProjectBodyInput
  } catch {
    return {
      id: null,
      name: null,
      response: jsonError(400, "INVALID_JSON", "Request body must be valid JSON."),
    }
  }

  const idResult = options.allowId
    ? parseOptionalProjectId(body.id)
    : { id: null, response: null }

  if (idResult.response) {
    return {
      id: null,
      name: null,
      response: idResult.response,
    }
  }

  if (body.name === undefined) {
    if (options.defaultName) {
      return { id: idResult.id, name: options.defaultName, response: null }
    }

    return {
      id: idResult.id,
      name: null,
      response: jsonError(400, "MISSING_NAME", "Project name is required."),
    }
  }

  if (typeof body.name !== "string") {
    return {
      id: idResult.id,
      name: null,
      response: jsonError(400, "INVALID_NAME", "Project name must be a string."),
    }
  }

  const normalizedName = body.name.trim()

  if (normalizedName.length === 0) {
    return {
      id: idResult.id,
      name: null,
      response: jsonError(
        400,
        "INVALID_NAME",
        "Project name cannot be empty."
      ),
    }
  }

  return { id: idResult.id, name: normalizedName, response: null }
}

export { DEFAULT_PROJECT_NAME }

export async function getOwnedProjectForMutation(
  projectId: string,
  ownerId: string
) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      ownerId: true,
    },
  })

  if (!project) {
    return {
      project: null,
      response: jsonError(404, "NOT_FOUND", "Project not found."),
    }
  }

  if (project.ownerId !== ownerId) {
    return {
      project: null,
      response: jsonError(
        403,
        "FORBIDDEN",
        "Only the project owner can perform this action."
      ),
    }
  }

  return { project, response: null }
}
