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
  name?: unknown
}

interface ParseProjectBodyOptions {
  defaultName?: string
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
) {
  let body: ProjectBodyInput

  try {
    body = (await request.json()) as ProjectBodyInput
  } catch {
    return {
      name: null,
      response: jsonError(400, "INVALID_JSON", "Request body must be valid JSON."),
    }
  }

  if (body.name === undefined) {
    if (options.defaultName) {
      return { name: options.defaultName, response: null }
    }

    return {
      name: null,
      response: jsonError(400, "MISSING_NAME", "Project name is required."),
    }
  }

  if (typeof body.name !== "string") {
    return {
      name: null,
      response: jsonError(400, "INVALID_NAME", "Project name must be a string."),
    }
  }

  const normalizedName = body.name.trim()

  if (normalizedName.length === 0) {
    return {
      name: null,
      response: jsonError(
        400,
        "INVALID_NAME",
        "Project name cannot be empty."
      ),
    }
  }

  return { name: normalizedName, response: null }
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
